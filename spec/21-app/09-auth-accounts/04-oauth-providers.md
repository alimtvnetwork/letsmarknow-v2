# OAuth Providers

Configuration, flows, and quirks for Google, Apple, GitHub.

---

## 1. Providers (v1)

| Provider | Use cases |
|---|---|
| Google | Default for most users; consumer + Workspace |
| Apple | iOS users; required for App Store-distributed PWA wrappers |
| GitHub | Developer audience |

Microsoft and others deferred until demand justifies.

## 2. Common flow (web)

1. Click provider button → `GET /v1/auth/oauth/:provider/start` (canonical per `03-api-endpoints/03-auth.md §OAuth`).
2. Server creates `state` + `nonce` (signed, 10-min TTL); redirects to provider authorize URL with PKCE.
3. Provider returns to `GET /v1/auth/oauth/:provider/callback?code=...&state=...` (the bare `/auth/callback/<provider>` form is a lay alias only).
4. Server validates `state`, exchanges code for tokens, fetches profile (`email`, `email_verified`, `sub`, `name`, `picture`).
5. Match Account by verified email; create if missing.
6. Issue JWT + refresh cookie; redirect to `?next=` or `/dashboard`.

## 3. Common flow (extension)

- Uses `chrome.identity.launchWebAuthFlow` with PKCE.
- Redirect URL: `https://<extension-id>.chromiumapp.org/auth/callback/<provider>`.
- Server detects `client=ext` and emits the JWT directly to the SW via the response page.
- SW persists tokens to its storage layout (`04-extension/03-service-worker.md`).

## 4. Provider specifics

### 4.1 Google
- Scopes: `openid email profile`.
- `prompt=select_account` for explicit picker.
- Workspace org claim included when available; surfaced as a hint for Team plan signup.

### 4.2 Apple
- Apple returns name only on FIRST authorization; persist immediately.
- `email_verified` always true.
- "Hide my email" (private relay) supported; we store relay address as canonical email.
- Server-to-server notifications (`pop` events — revocation, email change, account deletion) handled at canonical inbound webhook `POST /v1/webhooks/apple-notifications` (declared in `03-api-endpoints/00-overview.md §2.15`; auth: `webhook-sig` Apple JWS).

### 4.3 GitHub
- Scopes: `read:user user:email`.
- Email may be private; fetch primary verified via `/user/emails`.
- Display username + avatar; suggest as `display_name` on signup.

## 5. Account linking

- Existing signed-in user can link more providers in `/me/security/connections`.
- Linking requires re-auth (password or current MFA).
- Unlinking blocked if it would leave the Account with zero sign-in methods.

## 6. Storage

`account_oauth_links`:
| Field | Type |
|---|---|
| `id` | UUIDv7 |
| `account_id` | UUIDv7 |
| `provider` | enum |
| `provider_sub` | text |
| `email_at_link` | citext |
| `created_at`, `last_used_at` | |

Unique `(provider, provider_sub)`.

## 7. Token storage

- We do NOT store provider access/refresh tokens after initial profile fetch (we don't call provider APIs ongoing).
- Exception: Google Workspace Org claims may need a one-shot lookup; tokens discarded after.

## 8. Errors

| Error | UX |
|---|---|
| `access_denied` | Friendly "Sign-in cancelled" page with retry. |
| Email unverified by provider | Reject with explanation + link to verify with provider. |
| State mismatch | Generic error; possible CSRF; logged. |
| Provider 5xx | Retry banner; falls back to email/password tab. |

## 9. Security

- `state` and `nonce` both validated.
- ID tokens verified (signature, audience, issuer, expiry, nonce).
- Email match requires `email_verified=true` from provider, otherwise treated as unverified Account.
- HSTS + secure cookies; redirects validated against allowlist (`/^https?:\/\/(localhost|.*\.letsmarknow\.com)/`).

## 10. Telemetry

- `oauth.start` `{ provider, surface }`
- `oauth.success` `{ provider, linked_existing: bool }`
- `oauth.failure` `{ provider, reason }`
- `oauth.unlink` `{ provider }`
- `oauth.account_revoked_by_provider` `{ provider }` (server-to-server signal)

## 11. UX details

- Provider buttons in canonical brand colors with text "Continue with X".
- Order: Google · Apple · GitHub (top to bottom).
- Email/password collapsed under "Or use email" by default if last used method was OAuth (per device hint).

## 12. Edge cases

| Case | Behavior |
|---|---|
| Apple "Hide my email" relay changes | We refresh email on next sign-in; warn user if profile email differs |
| GitHub email made private after linking | Sign-in works (we have stored canonical); display name fallback |
| Two Accounts share the same provider sub (impossible normally) | Block with support contact |
| User changes email at provider | We treat new email as alias; canonical Account email unchanged unless user explicitly updates |

## 13. Tests

- Token verification (signature, claims).
- Account linking matrix (new vs existing, verified vs not).
- State/nonce CSRF protection.
- Apple revocation webhook.
- Extension PKCE flow integration.
