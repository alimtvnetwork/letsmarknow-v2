# Messaging

Typed message contracts inside the extension (popup ↔ SW ↔ new-tab ↔ side panel ↔ content script) and to/from the web app via `externally_connectable`.

---

## 1. Channels

| From → To | API |
|---|---|
| surface → SW | `chrome.runtime.sendMessage({ type, payload })` (one-shot) or `chrome.runtime.connect({ name })` (long-lived port) |
| SW → all surfaces | `chrome.runtime.sendMessage({ type, payload })` (broadcast — every listener gets it) |
| SW → specific surface | port-based (we keep a registry of connected ports per surface) |
| web app → SW | `chrome.runtime.sendMessage(EXT_ID, ...)` (only `letsmarknow.com` per `externally_connectable.matches`) |
| SW → web app | `chrome.tabs.sendMessage(tabId, ...)` to the content script which `window.postMessage`s into the page |

## 2. Internal envelope

```ts
type Envelope<T = unknown> = {
  type: string;        // SCREAMING_SNAKE
  payload?: T;
  request_id?: string; // UUID, set by sender for ack correlation
};

type Ack<T = unknown> =
  | { ok: true,  data: T,                        request_id?: string }
  | { ok: false, error: { code: string, message: string }, request_id?: string };
```

All `sendMessage` handlers MUST return `Promise<Ack>` (so `sendResponse` can be async).

## 3. Message catalog

### From popup / new-tab / side-panel → SW

| `type` | payload | reply data |
|---|---|---|
| `PING` | `{}` | `{ ok: true, data: { sw_version, uptime_ms } }` |
| `GET_AUTH_STATE` | `{}` | `{ signed_in, account, active_org, entitlements_hash }` |
| `SIGN_IN_HANDOFF` | `{ token }` | auth result |
| `SIGN_OUT` | `{ everywhere?: boolean }` | `{ ok: true }` |
| `GET_TREE` | `{ org_id, since_etag? }` | `{ etag, spaces, collections, groups }` |
| `GET_ITEMS` | `{ collection_id?, group_id?, cursor? }` | items page |
| `SAVE_TAB` | `SaveTabPayload` | created Item |
| `SAVE_SESSION_PREVIEW` | preview payload | preview result |
| `SAVE_SESSION` | session payload | save result |
| `MUTATE` | `{ op: MutationOp }` | mutation result |
| `UNDO` | `{ history_event_id }` | undo result |
| `QUICK_FIND` | `{ q }` | top-10 items |
| `SEARCH` | `{ q, filters?, cursor? }` | search page |
| `OPEN_ITEM` | `{ item_id, in_new_window?, jump? }` | `{ opened: "new_tab" \| "jumped" }` |
| `RESTORE_AS_SESSION` | `{ source }` | `{ window_id, opened_count }` |
| `REFRESH_ENTITLEMENTS` | `{}` | new entitlements |
| `GET_DIAGNOSTICS` | `{}` | sync log + counters |
| `CLEAR_CACHE` | `{ confirm }` | `{ ok: true }` |
| `SET_PREF` | `{ key, value }` | new prefs object |

### From SW → all surfaces (broadcast)

| `type` | payload |
|---|---|
| `AUTH_LOST` | `{}` |
| `AUTH_GAINED` | `{ account, org }` |
| `ORG_CHANGED` | `{ org_id }` |
| `ENTITLEMENTS_CHANGED` | `{ entitlements_hash, by_org }` |
| `ITEM_CREATED` / `ITEM_UPDATED` / `ITEM_DELETED` | `{ item, history_event_id }` |
| `COLLECTION_CREATED` / `_UPDATED` / `_DELETED` | similar |
| `GROUP_*` / `SPACE_*` | similar |
| `SHARE_CREATED` / `_REVOKED` | similar |
| `SYNC_PROGRESS` | `{ phase, pct }` |
| `OFFLINE` / `ONLINE` | `{ pending_count }` |
| `KILL_SWITCH` | `{ disabled, reason, min_required_version }` |

### Web app ↔ extension (cross-origin)

Allowed message `type`s only:

| `type` | direction | purpose |
|---|---|---|
| `LMN_PING` | web → ext | "are you installed?" reply `{ ok: true, version }` |
| `LMN_AUTH_HANDOFF` | web → ext | one-time sign-in token |
| `LMN_SAVE_TAB` | web → ext | "save this tab now" (web app's "Save current tab" button) |
| `LMN_SAVE_SESSION` | web → ext | trigger session save flow |
| `LMN_OPEN_ITEM` | web → ext | "jump to / open" via extension (uses Chrome tab matching) |
| `LMN_INSTALLED` | ext → web | broadcast on install/update so web app can show "Extension installed ✓" |

All other inbound types are dropped with `{ ok: false, error: { code: "UNKNOWN_MESSAGE_TYPE" } }`.

## 4. Long-lived ports (live updates)

When a surface mounts, it opens a port:
```ts
const port = chrome.runtime.connect({ name: "newtab" | "popup" | "sidepanel" });
port.onMessage.addListener(handleBroadcast);
```

SW maintains `connectedPorts: Map<name, Set<Port>>`. Broadcasts iterate all sets.

On `port.onDisconnect`, SW removes from registry.

## 5. Request correlation

For request/reply patterns over ports (when one-shot is insufficient):
- Sender includes `request_id` (UUID).
- SW reply uses same `request_id`.
- Senders maintain a `Map<request_id, resolve>` and time out after 10 s.

## 6. Error handling

- Surfaces always handle `chrome.runtime.lastError` after sendMessage.
- SW wraps every handler in try/catch; uncaught → reply with `{ ok: false, error: { code: "INTERNAL_ERROR", message: e.message } }` AND telemetry.

## 7. Versioning

`PING` reply includes SW version. Surfaces compare to bundled version; if mismatch (e.g. SW updated mid-session), surface shows "Reload required" banner with reload button (`window.location.reload()`).

## 8. Security

- `externally_connectable.matches` whitelists `letsmarknow.com` only.
- Origin verification on web → ext messages: `chrome.runtime.onMessageExternal` checks `sender.origin === "https://letsmarknow.com"`.
- Payload schema validation via lightweight `zod` schemas before dispatch. Invalid → `{ ok: false, error: "VALIDATION_FAILED" }`.
