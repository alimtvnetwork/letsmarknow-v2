# Auth Endpoints

Sign-up, sign-in (password & magic link), OAuth, refresh, sign-out, password reset, MFA, sessions/devices.

> Detailed flows live in `09-auth-accounts/`. This file is the wire contract.

Default rate-limit class is `auth`.

---

### Sign up with password
`POST /v1/auth/signup`

**Auth:** none
**Idempotent:** with Idempotency-Key

**Request body**
```json
{
  "email": "alim@example.com",
  "password": "min-12-chars",
  "name": "Alim Ul Karim",
  "marketing_opt_in": false,
  "invite_token": null,
  "captcha_token": "hcaptcha-..."
}
```

**Response 201**
```json
{
  "data": {
    "account_id": "01J...",
    "email_verified": false,
    "default_organization_id": "01J...",
    "access_token": "eyJ...",
    "expires_in": 900
  }
}
```
Side effect: `lmn_refresh` cookie set. Verification email sent.

**Errors**
- `400 VALIDATION_FAILED` — weak password, invalid email, missing captcha
- `409 CONFLICT` `details.reason="email_exists"` — email already registered
- `429 RATE_LIMITED`

---

### Sign in with password
`POST /v1/auth/signin`

**Auth:** none
**Request body**
```json
{ "email": "...", "password": "...", "captcha_token": "..." }
```
**Response 200**
```json
{
  "data": {
    "account_id": "01J...",
    "default_organization_id": "01J...",
    "mfa_required": false,
    "mfa_challenge_id": null,
    "access_token": "eyJ...",
    "expires_in": 900
  }
}
```

If `mfa_required=true`, `access_token` is null and client must call `/v1/auth/mfa/verify` with `mfa_challenge_id`.

**Errors**
- `401 UNAUTHENTICATED` — wrong creds (uniform message; do not leak whether email exists)
- `403 FORBIDDEN` `details.reason="email_unverified"`
- `423 LOCKED` — too many failures (60s cooldown)

---

### Send magic link
`POST /v1/auth/magic-link/send`

**Request**
```json
{ "email": "...", "captcha_token": "...", "next": "/app" }
```
**Response 202**
```json
{ "data": { "sent": true } }
```
Always 202 even if email doesn't exist (no enumeration).

---

### Consume magic link
`POST /v1/auth/magic-link/consume`

**Request**
```json
{ "token": "lmn-ml-..." }
```
**Response 200** — same shape as signin.

**Errors**
- `400 VALIDATION_FAILED` — malformed/expired token
- `401 UNAUTHENTICATED` — token already used / revoked

---

### OAuth start
`GET /v1/auth/oauth/:provider/start`

**Path params**
- `provider` (enum: `google`|`apple`|`github`|`microsoft`)

**Query params**
- `next` (string) — post-auth redirect path
- `invite_token` (string?) — optional pending org invite

**Response 302** → provider's authorize URL.

---

### OAuth callback
`GET /v1/auth/oauth/:provider/callback`

**Auth:** none
**Idempotent:** no

**Query params**
- `code` — provider authorization code
- `state` — CSRF state

**Response 302** → app, with refresh cookie set + short-lived `lmn_handoff` query token client exchanges via `/v1/auth/token`.

**Errors**
- redirect to `/login?error=oauth_failed&provider=...`

---

### Refresh access token
`POST /v1/auth/token`

**Auth:** refresh cookie
**Idempotent:** yes

**Request body** (optional)
```json
{ "active_organization_id": "01J..." }
```
If absent, server picks last-used.

**Response 200**
```json
{
  "data": {
    "access_token": "eyJ...",
    "expires_in": 900,
    "active_organization_id": "01J...",
    "entitlements_hash": "sha256:..."
  }
}
```
Side effect: refresh cookie rotated.

**Errors**
- `401 UNAUTHENTICATED` — no/expired refresh
- `403 FORBIDDEN` — Account doesn't belong to requested Org

---

### Sign out (current device)
`POST /v1/auth/signout`

**Auth:** bearer
**Response 204**
Side effect: revokes current refresh; clears cookie.

---

### Sign out everywhere
`POST /v1/auth/signout-all`

**Auth:** bearer
**Response 204**
Side effect: revokes all refresh tokens of the Account; deletes all device sessions; bumps `tokens_invalidated_after` so any in-flight access tokens become invalid within 60s.

---

### Request password reset
`POST /v1/auth/password/forgot`

**Request**
```json
{ "email": "...", "captcha_token": "..." }
```
**Response 202** Always 202 (no enumeration).

---

### Reset password (consume token)
`POST /v1/auth/password/reset`

**Request**
```json
{ "token": "lmn-pr-...", "new_password": "min-12-chars" }
```
**Response 200** Returns new auth tokens (auto sign-in).
Side effect: invalidates all other sessions.

---

### Change password (signed in)
`POST /v1/auth/password/change`

**Auth:** bearer
**Request**
```json
{ "current_password": "...", "new_password": "..." }
```
**Response 204**
Side effect: invalidates all other sessions.

---

### MFA enroll (TOTP)
`POST /v1/auth/mfa/enroll`

**Auth:** bearer
**Request** `{}`
**Response 200**
```json
{
  "data": {
    "challenge_id": "01J...",
    "secret": "base32...",
    "otpauth_url": "otpauth://totp/...",
    "recovery_codes": ["abcd-efgh", "..."]
  }
}
```

---

### MFA verify (during signin or enroll)
`POST /v1/auth/mfa/verify`

**Request**
```json
{ "challenge_id": "01J...", "code": "123456" }
```
**Response 200** — same shape as signin.

**Errors**
- `401 UNAUTHENTICATED` — wrong code
- `423 LOCKED` — too many attempts

---

### List sessions / devices
`GET /v1/auth/sessions`

**Auth:** bearer
**Response 200**
```json
{
  "data": [
    {
      "id": "01J...",
      "client": "chrome-ext/1.4.0",
      "ip": "203.0.113.10",
      "city": "Melbourne",
      "country": "AU",
      "user_agent": "...",
      "current": true,
      "last_active_at": "2026-04-18T14:22:31.123Z",
      "created_at": "2026-04-10T..."
    }
  ]
}
```

---

### Revoke a session
`DELETE /v1/auth/sessions/:id`

**Auth:** bearer
**Response 204**

**Errors**
- `403 FORBIDDEN` — cannot revoke current session via this endpoint (use `/signout`)
