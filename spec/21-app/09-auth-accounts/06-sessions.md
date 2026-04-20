# Sessions

JWT model, refresh cookie, session table, sign-out everywhere.

---

## 1. Token shapes

### Access token (JWT)
- Algorithm: EdDSA (Ed25519).
- TTL: 15 minutes.
- Claims:
  - `sub` — `account_id` (UUIDv7)
  - `org` — active `org_id` (UUIDv7)
  - `roles` — `{ "<org_id>": "owner" \| "admin" \| "editor" \| "viewer" \| "billing" \| "guest" }` cached for active Org only (canonical `org_role` enum minus `system`, which is never JWT-issuable; per `17-admin-org/03-roles.md` §1)
  - `tv` — token_version (incremented on global revoke)
  - `ent_h` — entitlements hash (for change detection)
  - `mfa` — bool (MFA satisfied this session)
  - `iat`, `exp`, `iss`, `aud`
- Stored: in memory (web app) or `chrome.storage.local` (extension); never localStorage on web.

### Refresh cookie
- Name: `__Host-lmn_refresh`.
- HttpOnly, Secure, SameSite=Strict, Path=/, no Domain attribute (locks to apex).
- Value: opaque random 32 bytes; sha256-hashed in DB (`session.refresh_hash`).
- TTL: 30 days, rolling on use.
- Rotation: every refresh issues a new value; old denied (detection of theft).

## 2. `Session` table

| Field | Type | Notes |
|---|---|---|
| `id` | UUIDv7 | |
| `account_id` | UUIDv7 | |
| `refresh_hash` | bytea | sha256 |
| `created_at` | timestamptz | |
| `last_used_at` | timestamptz | |
| `expires_at` | timestamptz | rolling |
| `revoked_at` | timestamptz? | |
| `client_kind` | `web \| ext \| pwa \| api` | |
| `client_version` | text | |
| `ip_first` | inet | truncated |
| `ip_last` | inet | truncated |
| `user_agent` | text | |
| `mfa_satisfied` | bool | |

## 3. Refresh flow

1. Client calls `POST /v1/auth/token` with no body; refresh cookie sent automatically.
2. Server validates cookie → looks up `Session` by `refresh_hash` → checks not revoked, not expired.
3. Server issues new access token + new refresh cookie; updates `Session.refresh_hash` and `last_used_at`.
4. Old refresh value denylisted for 5 min (theft detection window).
5. If old refresh used after rotation → treat as compromise: revoke session + alert user.

## 4. Active Org switching

- `POST /v1/auth/token { active_organization_id }` returns access token scoped to new Org.
- Refresh cookie unchanged.
- Triggers TanStack Query cache reset per scope.

## 5. Sign-out

- `POST /v1/auth/signout` — revokes current `Session` and clears cookie.
- "Sign out everywhere" — sets `account.token_version = token_version + 1`; all access tokens with old `tv` rejected immediately (no waiting for 15-min TTL).
- Triggers `auth.signed_out` realtime event to other tabs.

## 6. Theft detection

- Reuse of an already-rotated refresh value → strong signal of compromise.
- Action: revoke entire Account's sessions, force password reset, email user with details (IP, UA).
- Audit log entry.

## 7. Device list (`/me/security/devices`)

- Lists all active `Session`s with: client kind, version, last seen, IP city/country (geo from truncated IP), current device badge.
- Per-row "Revoke" action.
- "Revoke all others" button.

## 8. Cross-tab coordination

- `BroadcastChannel("lmn-auth")` posts:
  - `signin`, `signout`, `token_refreshed`, `org_switched`, `revoked`.
- All tabs sync state without polling.

## 9. Extension specifics

- Refresh cookie lives on `.letsmarknow.com`; SW calls refresh endpoint via `fetch` with `credentials: "include"`.
- Access token kept in `chrome.storage.local`; cleared on sign-out.
- See `04-extension/11-auth-bridge.md`.

## 10. Performance

- Token refresh p75 < 80 ms (DB lookup by hash).
- Verify access JWT (no DB call) p99 < 1 ms.
- Session list query p95 < 200 ms.

## 11. Security

- JWT signing key rotated quarterly; old keys remain valid for 24 h overlap.
- JWKS published at `/.well-known/jwks.json`.
- Refresh cookie cannot be read by JS (HttpOnly).
- All auth endpoints require HTTPS (HSTS preload).

## 12. Telemetry

- `session.created` `{ client_kind }`
- `session.refreshed` `{ client_kind, age_min }`
- `session.revoked` `{ by: "user" | "system" | "compromise_detected" }`
- `session.theft_detected`
- `session.org_switched`

## 13. Edge cases

| Case | Behavior |
|---|---|
| Clock skew | Tolerate ±2 min on `iat`/`exp` |
| Cookie blocked by browser | Sign-in fails with explanation; suggests enabling cookies |
| Refresh during network outage | Client retries with backoff; UX shows "reconnecting" |
| Two simultaneous refresh requests | Server idempotent: same row updated; first wins, second gets fresh tokens too |
| Account deletion mid-session | All sessions revoked; clients sign out gracefully |

## 14. Tests

- Refresh rotation invalidates old value.
- Theft detection on reuse.
- `tv` bump invalidates JWTs.
- Multi-tab broadcast sync.
- Cookie attributes (HttpOnly, Secure, SameSite, Path).
