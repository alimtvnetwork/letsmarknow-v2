# Signup & Sign-in

All entry flows for getting an Account authenticated.

---

## 1. Surfaces

| Surface | Routes |
|---|---|
| Web app | `/signup`, `/signin`, `/signin/magic`, `/signin/oauth/:provider`, `/invite/:token` |
| Extension popup | "Sign in" button → opens `/signin?from=ext` in new tab |
| PWA | Same as web app |
| OAuth callbacks | `/auth/callback/:provider` |

## 2. Methods

1. **Email + password** — primary.
2. **Magic link** — passwordless via single-use email link.
3. **OAuth** — Google, Apple, GitHub. (See `04-oauth-providers.md`.)
4. **SAML SSO** — Team Org-scoped. (See `05-sso-saml.md`.)
5. **Invite acceptance** — `/invite/:token` short-circuits signup with pre-filled email.

## 3. Signup (email + password)

1. User submits email + password + optional display name.
2. Server validates: email format, password rules (`03-passwords-and-mfa.md`), throttle by IP + email.
3. Creates `Account` (`email_verified_at = null`) + Personal `Org` + `Member(owner)`.
4. Sends verification email; signs the user in immediately (no friction); banner says "Verify your email to enable sharing".
5. Until verified: cannot create public shares, cannot invite others, cannot change email.

## 4. Sign-in (email + password)

1. Submit credentials.
2. Server constant-time argon2id verify.
3. If MFA enabled: prompts for TOTP code (or recovery code).
4. Issues access JWT (15 min) + refresh cookie (rolling 30 d).
5. Server records `Session` row (`06-sessions.md`).
6. Client redirects to `?next=` or `/dashboard`.

## 5. Magic link

> **F-M13 closure (2026-04-19):** This section is the canonical magic-link spec. P1 per `readme.md`. Replaces the prior "implied but not specified" gap.

### 5.1 Endpoints

| Verb | Path | Purpose | Auth |
|---|---|---|---|
| `POST` | `/v1/auth/magic/request` | Issue token, send email | none |
| `GET`  | `/v1/auth/magic/callback?t={token}` | Consume token, sign in | none |

Both routes obey the rate-limit envelope in `13-rate-limit-values.md` and return errors per `03-api-endpoints/18-error-codes.md` (UPPER_SNAKE_CASE per W-8 closure).

### 5.2 Request payload

`POST /v1/auth/magic/request`
```json
{ "email": "user@example.com", "next": "/dashboard" }
```
Response is **always** `202 ACCEPTED` with empty body — no enumeration of whether the address exists.

### 5.3 Token issuance

- 32-byte CSPRNG → URL-safe base64 → token shown to user (single-use).
- Server stores **sha256(token)** in `auth_magic_links(account_id, token_hash, requested_ip, requested_ua, expires_at, consumed_at)`.
- TTL: **15 min**. New request invalidates older unconsumed tokens for the same address.
- One pending token per email at a time.

### 5.4 Callback / consume

`GET /v1/auth/magic/callback?t={token}` performs, in order:

1. Hash incoming `t`, look up row.
2. If missing / expired / already consumed → `410 GONE` with code `MAGIC_LINK_INVALID`; render `/auth/magic/expired` page with "Request a new link" CTA.
3. If row exists and matches:
   - Set `consumed_at = now()`.
   - If account exists → mint access JWT (15 min) + refresh cookie (rolling 30 d) per §4 step 4; record `Session` row.
   - If no account → create Account + Personal Org per `01-identity-model.md` §3 (treats as signup); same session issuance.
4. Redirect `302` to `?next=` (validated against same-origin allow-list) or `/dashboard`.
5. Token denylisted via `consumed_at` lookup for **24 h replay window** even after row TTL passes.

### 5.5 Email content

- Subject: copy-key `auth.magic.email.subject` ("Sign in to Lets Mark Now").
- CTA button → callback URL.
- Body includes: requesting IP (coarse), UA family, expiry stamp, "Didn't request? Ignore." footer.
- Sender + provider per `22-infrastructure/11-email-provider.md`.

### 5.6 Anti-abuse

- Throttle: 1 request per 60 s per email; 5 per 24 h per email; 10 per hour per IP. See §13.
- reCAPTCHA Enterprise gate when abuse score > 0.7.
- Tokens never logged; never echoed in URLs other than the callback path itself; callback page sets `Cache-Control: no-store, no-referrer`.

### 5.7 Telemetry

- `auth.magic_link_requested` `{ new_account: bool }`
- `auth.magic_link_sent`
- `auth.magic_link_consumed` `{ time_to_consume_s, new_account: bool }`
- `auth.magic_link_failed` `{ reason: "expired" | "consumed" | "not_found" | "rate_limited" }`

### 5.8 Errors

| Condition | HTTP | Code |
|---|---|---|
| Token missing / expired / consumed | 410 | `MAGIC_LINK_INVALID` |
| Throttled | 429 | `RATE_LIMITED` |
| Email malformed | 400 | `VALIDATION_FAILED` |
| reCAPTCHA fail | 403 | `CAPTCHA_REQUIRED` |

## 6. Invite acceptance

1. Recipient clicks `/invite/:token` from email.
2. If signed in with a different email → prompt: "Use this email to join, or sign out and accept with the invite email."
3. If signed in with matching email → 1-click "Join {Org}".
4. If not signed in → signup with email pre-filled and locked; on success, joins Org.
5. Invite token single-use; 14-day TTL by default.

## 7. OAuth flows

- PKCE on extension via `chrome.identity.launchWebAuthFlow`.
- Standard authorization code on web.
- Provider returns email + verified flag + sub.
- Match logic:
  - If `email` matches existing Account AND verified by provider → link.
  - Else create new Account.
  - Linked Accounts can sign in with any linked method.
- Detail in `04-oauth-providers.md`.

## 8. Forgot password

1. `/signin/forgot` → submit email.
2. Always returns success (no enumeration).
3. If account exists: email with reset link (1-time token, 1-hour TTL).
4. Reset page: new password (rules enforced); auto-sign-in on submit; all other sessions revoked.

## 9. Sign-out

- `POST /v1/auth/sign_out` — invalidates current session.
- "Sign out everywhere" — invalidates all sessions for Account; rotates a `token_version` claim.

## 10. UX details

- Single CTA per screen.
- Show password rules inline with live validation.
- Disable submit until basic validation passes.
- After failed attempt: clear password, keep email.
- "Show password" toggle (eye icon).
- Loading states < 200 ms feel instant.

## 11. Accessibility

- Form fields labeled (no placeholder-only).
- Errors associated via `aria-describedby`.
- Submit on Enter; focus moved to first error on fail.
- OAuth buttons have provider name in accessible label.

## 12. Telemetry

- `auth.signup_attempt` `{ via }`
- `auth.signup_success` `{ via }`
- `auth.signin_attempt` `{ via }`
- `auth.signin_success` `{ via, mfa_used }`
- `auth.signin_failure` `{ via, reason }`
- `auth.magic_link_sent` / `_consumed`
- `auth.password_reset_requested` / `_completed`
- `auth.invite_opened` / `_accepted`

## 13. Anti-abuse

- Signup rate-limit per IP (10/h) + per email (3/24h).
- Disposable-email blocklist (configurable; warn don't block by default).
- Re-CAPTCHA Enterprise on signup + magic-link if abuse score high.
- Password sign-in failure backoff: 5 fails → 15-min lockout per `(email, IP)`; surfaces generic error.

## 14. Edge cases

| Case | Behavior |
|---|---|
| Same email signs up via password then OAuth | Provider linked if email verified; otherwise must verify email first |
| Magic-link clicked twice | Second time: 410 with "already used" |
| Sign in while another tab signs out | Cross-tab broadcast triggers re-auth in source tab |
| OAuth provider returns unverified email | Block; require email verification step |
| Invite token belongs to a deleted Org | Friendly 410 page |
| User on iOS adds PWA mid-flow | Cookies preserved; flow continues |

## 15. Tests

- Argon2 verify (timing-safe).
- Magic-link single-use + TTL.
- OAuth account linking matrix.
- Invite acceptance happy + error paths.
- Sign-out everywhere invalidates JWT denylist within 5 s.
