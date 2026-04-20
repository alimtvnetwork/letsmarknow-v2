# Password-Protected Shares

Gated read-only viewers behind a password.

---

## 1. URL

Same as public: `https://letsmarknow.com/t/{slug}` — but loads a password gate before content.

## 2. Password mechanics

- Hashed with **argon2id** (m=64MB, t=3, p=4).
- Per-link salt.
- Stored in `share_link.password_hash` + `password_salt`.
- Plain password never persisted server-side after creation; never sent back over API.
- Owner can rotate password (issues new hash, revokes existing viewer cookies).

## 3. Auth flow

1. Viewer hits `/t/{slug}` → server detects `mode=password` → renders gate page.
2. Viewer submits password → `POST /v1/public/shares/:slug/unlock` `{ password }`.
3. Server verifies (constant-time argon2id) → on success issues `share_session` JWT (HttpOnly cookie, 24 h, scoped to that slug).
4. Viewer reloads → server validates cookie → renders share.

## 4. Brute-force defense

- Per-IP rate limit: 5 attempts / 15 min / slug.
- Per-slug rate limit: 50 attempts / 15 min / slug (anti-distributed).
- After 5 fails per IP: exponential backoff (`429` with `Retry-After`).
- After 100 fails on slug in 24 h: link auto-locked + owner notified by email + audit log.
- Owner can re-enable from share settings (rotates password).

## 5. Cookie

- `Name`: `lmn_share_<linkId>`
- `HttpOnly`, `Secure`, `SameSite=Lax`.
- `Max-Age`: 24 h.
- `Path`: `/t/<slug>` and `/api/share/<slug>`.
- Cleared on owner revocation (server invalidates JWT via short TTL + denylist).

## 6. UI

- Gate page: lock illustration, headline "Enter password to view", input, submit, "Forgot? Ask the owner" hint.
- Errors: generic ("Incorrect password") to avoid leaking existence.
- Success: smooth transition to viewer.
- Reduced motion: instant transition.

## 7. Capabilities

Same as public-share read-only set, gated. Comments/reactions allowed if owner enabled AND viewer additionally signs in.

## 8. Caching

- Gate page: edge-cached 5 min, no PII.
- Authenticated content: NOT edge-cached; per-cookie response.
- After auth, can be edge-cached at 30 s with `Vary: Cookie` (carefully).

## 9. SEO

Always `noindex` regardless of owner setting (gate is meaningless to crawlers).

## 10. Telemetry

- `password_share.gate_shown`
- `password_share.attempt` `{ outcome: "ok" | "fail" | "rate_limited" | "locked" }`
- `password_share.unlocked_session_started`
- `password_share.locked` `{ reason }`

## 11. Owner notifications

- Email on first successful unlock per new viewer (settable to off).
- Email on lockout event (always sent).
- Inbox notification mirrors email.

## 12. Edge cases

| Case | Behavior |
|---|---|
| Password rotated mid-session | Cookie invalidated next request; gate re-shown |
| Owner disables password mode → public | Existing cookies invalidated; viewers re-prompted (no friction since now public) |
| Owner disables password mode → invite | All cookies invalidated; viewers must re-auth via invite |
| Share expires while authed | Cookie still valid until expiry, but content responses 410 |
| Viewer copies password to another device | Works; cookie isolated per browser |

## 13. Tests

- Unit: argon2 verification (timing-safe).
- Integration: rate limiter (per IP, per slug).
- E2E: enter wrong password 5x → 429; correct → unlocked; revoke → re-prompt.
- Security: cookie scope, HttpOnly, SameSite assertions.
