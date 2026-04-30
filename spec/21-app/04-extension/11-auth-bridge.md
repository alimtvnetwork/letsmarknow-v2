# Auth Bridge

How the extension authenticates against `api.letsmarknow.com` from the constrained MV3 environment.

---

## 1. Goals

- No long-lived secrets in `chrome.storage` (refresh tokens stay HTTP-only cookies on `.letsmarknow.com`).
- Single sign-on between extension and web app (sign in in one → other follows).
- Survives Chrome profile sync (extension installs preserve auth).
- OAuth providers (Google, Apple, GitHub, Microsoft) work without cookies-in-extension hacks.

## 2. Two flows

### 2.1 Web-first (default)
1. User clicks "Sign in" in popup → SW calls `chrome.tabs.create({ url: "https://letsmarknow.com/login?from=ext" })`.
2. User signs in via standard web flow → web sets `lmn_refresh` cookie on `.letsmarknow.com`.
3. The web page (with our content script `web-bridge.js` injected) detects the just-completed sign-in and posts a one-time **handoff token** via `chrome.runtime.sendMessage` to the extension:
   ```ts
   chrome.runtime.sendMessage(EXT_ID, { type: "AUTH_HANDOFF", token: "lmn-ho-..." });
   ```
4. SW receives `AUTH_HANDOFF`, calls `POST /v1/auth/token` with `{ handoff_token }`. Server validates handoff (single-use, 60s TTL, bound to that account) and returns `{ access_token, expires_in, active_organization_id, entitlements_hash }`.
5. SW stores access token in `chrome.storage.local`. Subsequent `/v1/auth/token` refreshes use the cookie (sent automatically because `host_permissions` includes `https://api.letsmarknow.com/*`).

### 2.2 In-extension OAuth (no web roundtrip)
For users who never visit the web app:
1. SW calls `chrome.identity.launchWebAuthFlow({ url, interactive: true })` with `https://api.letsmarknow.com/v1/auth/oauth/google/start?from=ext&pkce=...`.
2. Provider auths, redirects to `https://<EXT_ID>.chromiumapp.org/oauth/cb` (Chrome's special redirect).
3. SW extracts `code` from URL → POSTs to `/v1/auth/oauth/google/callback?from=ext` with PKCE `verifier`.
4. Server returns `{ access_token, refresh_token }` (in-body, NOT cookie, since extension can't read .letsmarknow.com cookies cross-origin from an isolated context). Extension stores both in `chrome.storage.local` (refresh encrypted with derived key from `EXT_ID + install_id`).
5. Subsequent refresh: POST `/v1/auth/token` with `{ refresh_token }` body.

> Note: storing a refresh token in extension storage is acceptable when paired with PKCE+device binding. Server marks the refresh as `device_kind="extension"` and rotates on every use.

## 3. Token lifecycle

| Token | Storage | TTL | Refresh trigger |
|---|---|---|---|
| `access_token` | `chrome.storage.local` | 15 min | alarm 12 min, or 401 from API |
| `refresh_token` (web flow) | cookie on `.letsmarknow.com` | 30 days | rotated each use |
| `refresh_token` (ext OAuth) | `chrome.storage.local` (encrypted) | 30 days | rotated each use |

## 4. SW request decorator

> **`Idempotency-Key` injection** below follows the canonical contract in `03-api-endpoints/01-conventions.md §6` (every non-GET mutation gets a UUIDv7 key; server dedupes for 24 h).

```ts
async function api(path, init = {}) {
  await ensureFreshToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${state.access_token}`);
  if (state.active_organization_id) headers.set("X-Organization-Id", state.active_organization_id);
  headers.set("X-Client", `chrome-ext/${VERSION}`);
  headers.set("X-Request-Id", crypto.randomUUID());
  if (init.method && init.method !== "GET" && !headers.has("Idempotency-Key")) {
    headers.set("Idempotency-Key", crypto.randomUUID());
  }
  const res = await fetch(`https://api.letsmarknow.com${path}`, { ...init, headers, credentials: "include" });
  if (res.status === 401) { await refresh(); /* retry once */ }
  return res;
}
```

## 5. Org switching

- `POST /v1/auth/token` with `{ active_organization_id }` body.
- Server returns new access token bound to that Org.
- Extension updates `state.active_organization_id`, broadcasts `ORG_CHANGED` to all surfaces, evicts in-memory cache for previous Org from L0.

## 6. Sign-out

- Local: clear `auth.*` keys, clear IndexedDB, broadcast `AUTH_LOST`.
- Server: `POST /v1/auth/signout` (invalidates current refresh).
- "Sign out everywhere": `POST /v1/auth/signout-all` → invalidates all refreshes; SW sees next refresh fail and signs out.

## 7. Account deletion / external ban

If `/v1/auth/token` returns `403 ACCOUNT_DISABLED`, SW signs out and displays a permanent banner explaining (with link to support).

## 8. Multi-profile / multi-account

- One Chrome profile = one extension instance = one signed-in Account.
- Switching to a different Account requires sign-out first.
- Multi-Org per Account is fully supported (see § 5).

## 9. Security notes

- All token storage values are also written to `chrome.storage.session` mirror (cleared on browser close) for an extra "ephemeral mode" toggle in Options (Pro feature).
- We never store passwords.
- PKCE `code_verifier` is generated per OAuth attempt, stored in `chrome.storage.session` (cleared after use).
- Handoff token is single-use, server-tracked.

## 10. Failure / retry

| Failure | Behavior |
|---|---|
| Network down during refresh | Stay in current state; retry on `online` event; mark next API call as needing refresh. |
| `401 TOKEN_EXPIRED` after refresh | Sign out; broadcast `AUTH_LOST`. |
| Refresh cookie cleared (user wiped browser cookies) | First API call 401s → refresh fails → sign-out. User can sign back in. |
| Extension storage corrupted | On boot, if `auth.*` is malformed, treat as signed-out. |
