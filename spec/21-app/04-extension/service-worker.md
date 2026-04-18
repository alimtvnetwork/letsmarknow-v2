# Service Worker

The MV3 background service worker is the brain. Stateless by design; lives only when needed.

---

## 1. File & boot

- Path: `background/sw.js` (ES module).
- Imports split into sub-modules: `auth.js`, `api.js`, `cache.js`, `messaging.js`, `commands.js`, `context-menus.js`, `omnibox.js`, `alarms.js`, `notifications.js`, `telemetry.js`.
- Boot trigger: `chrome.runtime.onInstalled`, `chrome.runtime.onStartup`, OR any registered listener firing.

## 2. Lifecycle

| Event | Action |
|---|---|
| `onInstalled` (`reason: "install"`) | open `welcome` tab → `https://letsmarknow.com/welcome?utm=ext_install`; create context menus; register alarms. |
| `onInstalled` (`reason: "update"`) | run migration if `previousVersion` < current; show release notes notification on minor+ bumps if user opted in. |
| `onStartup` | rehydrate cache pointers; do not network-fetch unless user interacts. |
| Idle | SW is unloaded by Chrome after ~30s of no listeners firing. State persisted to `chrome.storage.local` and IndexedDB (`lmn-cache`). |
| `chrome.alarms.onAlarm` | wake SW on schedule (see § 5). |

## 3. Storage layout

### `chrome.storage.local`
| Key | Shape | Notes |
|---|---|---|
| `auth.access_token` | string | JWT, 15-min TTL |
| `auth.access_token_exp` | number (ms) | absolute expiry |
| `auth.account_id` | string | UUIDv7 |
| `auth.active_organization_id` | string | UUIDv7 |
| `auth.entitlements_hash` | string | for change detection |
| `prefs` | object | user prefs (theme, default collection, toast on/off, etc.) |
| `last_used_collection_id` | string | per-Org |
| `last_used_group_id` | string\|null | per-Collection |
| `pending_mutations` | array | offline queue (see `sync-and-offline.md`) |
| `kill_switch` | object | `{ disabled: false, reason: null, min_required_version: "1.0.0" }` |

> Refresh tokens are stored as **HTTP-only cookies on `.letsmarknow.com`**, NOT in extension storage. The SW relies on the cookie when calling `/v1/auth/token`. This avoids storing long-lived secrets in extension storage (which is readable by other extensions in some attack scenarios).

### IndexedDB `lmn-cache`
Object stores: `organizations`, `spaces`, `collections`, `groups`, `items`, `tags`, `shares`, `history_recent`, `search_recent`, `meta` (etag/updated_at index).
Versioned schema; upgrade handler runs migrations.

## 4. Message router (`messaging.js`)

Single entry point: `chrome.runtime.onMessage.addListener`.

```ts
type Msg =
  | { type: "SAVE_TAB",      payload: SaveTabPayload }
  | { type: "SAVE_SESSION",  payload: SaveSessionPayload }
  | { type: "QUICK_FIND",    payload: { q: string } }
  | { type: "OPEN_ITEM",     payload: { item_id: string, in_new_window?: boolean } }
  | { type: "JUMP_TO_TAB",   payload: { url: string, item_id: string } }
  | { type: "GET_AUTH_STATE" }
  | { type: "SIGN_OUT" }
  | { type: "REFRESH_ENTITLEMENTS" }
  | { type: "GET_TREE",      payload: { org_id: string, since_etag?: string } }
  | { type: "MUTATE",        payload: { op: MutationOp } }
  | { type: "UNDO",          payload: { history_event_id: string } }
  | { type: "PING" };

type Reply<M extends Msg> = Promise<{ ok: true, data: any } | { ok: false, error: ApiError }>;
```

Rules:
- All handlers return `Promise` (so `sendResponse` can be async).
- All handlers wrap in try/catch → uniform error envelope.
- Long-running ops (save_session) emit progress events via `chrome.runtime.sendMessage` to all surfaces.

## 5. Alarms

| Alarm | Period | Job |
|---|---|---|
| `lmn.token-refresh` | 12 min | If `access_token_exp - now < 3min`, call `/v1/auth/token`. |
| `lmn.entitlements-check` | 6 h | Re-fetch `/v1/me/entitlements`; compare hash; if changed, broadcast. |
| `lmn.sync-pull` | 5 min when popup/newtab open in last hour | Incremental pull of changes since last `etag`. |
| `lmn.flush-offline-queue` | 30 s | Drain `pending_mutations` while online. |
| `lmn.kill-switch-poll` | 6 h | `GET /v1/health/extension?version=...` to learn of force-update / kill-switch. |
| `lmn.cleanup-cache` | 24 h | Evict items older than 30 days that are not in any starred Collection. |

## 6. Network layer (`api.js`)

- One `fetch` wrapper. Adds: `Authorization`, `X-Organization-Id`, `X-Client: chrome-ext/<version>`, `X-Request-Id` (UUID), `Idempotency-Key` (auto for POST creates).
- Retries: only `GET` and idempotent POSTs, exponential backoff (200ms × 2^n, max 5 tries) on `429`/`5xx`/network error.
- Token refresh: on `401 TOKEN_EXPIRED`, run refresh once, retry; on second `401`, sign-out and dispatch `AUTH_LOST` broadcast.

## 7. Crash & recovery

- Uncaught errors in SW → `self.addEventListener("error" / "unhandledrejection")` → telemetry (no PII) + persist to `chrome.storage.local.last_error` for Options "Send debug info".
- If SW fails to register on startup (extremely rare), Chrome shows red error in `chrome://extensions`. We watch for `chrome.runtime.lastError` after each `chrome.*` call.

## 8. Multi-window / multi-profile

- SW is per-Chrome-profile. Multiple windows share one SW.
- Multi-Account: extension has ONE active Account at a time. Switching account is a sign-out + sign-in.
- Switching active Org is a token refresh with `active_organization_id` body — no full sign-out.

## 9. Performance budgets

| Metric | Budget |
|---|---|
| SW cold start to first message handled | < 80 ms p95 |
| `SAVE_TAB` end-to-end (online) | < 600 ms p95 |
| `QUICK_FIND` round-trip | < 150 ms p95 |
| Memory at idle | < 8 MB |
| IndexedDB size for 10k items | < 12 MB |
