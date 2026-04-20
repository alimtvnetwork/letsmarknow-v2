# Rate Limits & Abuse

Auth-specific throttling, bot defenses, and account-protection guardrails.

---

## 1. Layers

1. **Edge (CDN)** — coarse per-IP limits; blocks DDoS volume.
2. **API gateway** — per-route limits with sliding window in Redis.
3. **App logic** — per-Account / per-email limits with stricter rules for sensitive ops.
4. **Anti-bot** — reCAPTCHA Enterprise + behavioral signals.

Order of evaluation: edge → gateway → app → anti-bot challenge if score high.

## 2. Auth route limits

> **Numeric source-of-truth:** `13-rate-limit-values.md` §2. Numbers below MUST match. Route names use the locked `sign_up` / `sign_in` form (snake_case verb pair) per `03-api-endpoints/01-conventions.md` §3.

| Route | Per-IP | Per-Email/Account | Notes |
|---|---|---|---|
| `POST /v1/auth/sign_up` | 10 / hour | 3 / 24h per email | Re-CAPTCHA on suspicion |
| `POST /v1/auth/sign_in` | 30 / 5 min | 5 / 15 min per email | Backoff on consecutive fails |
| `POST /v1/auth/magic_link` | 10 / hour | 5 / 24h per email | Generic success response |
| `POST /v1/auth/password/forgot` | 5 / hour | 3 / 24h per email | Generic success |
| `GET /v1/auth/verify` | 30 / hour | n/a | Token bound |
| `POST /v1/auth/token` (refresh) | 60 / min | 60 / min per session | Refresh hot path |
| `POST /v1/auth/sign_out` | 30 / min | n/a | |
| `POST /v1/shares/access` (password) | 10 / 15 min | 5 / 15 min per slug | Lockout at 100 fails / 24h on slug |
| OAuth start/callback | 30 / hour | n/a | Per-IP only |
| SCIM endpoints | 100 RPS per Org | n/a | Burst-tolerant |

## 3. Sign-in lockout

- 5 consecutive failures on `(email, IP)` → 15-min lockout for that pair.
- 20 failures on email across all IPs → email Account "Suspicious sign-in attempts" alert.
- 100 failures on email across all IPs → temporary Account lock until password reset (admin path also opens).

## 4. Account enumeration prevention

- Signup, signin, forgot-password, magic-link return uniform success responses regardless of email existence.
- Timing-safe compares everywhere.
- Signup error "email already in use" only shown after CAPTCHA challenge passes (raises bar for enumeration).

## 5. Bot defenses

- reCAPTCHA Enterprise score on signup, magic-link, forgot — challenge if score < 0.5.
- Honeypot fields in forms (hidden, must be empty).
- JS-required gating on auth forms (no curl-without-script abuse on hot paths).
- UA blocklist for known automated tools (curl/python-requests with no headers); challenge instead of block.

## 6. Disposable / suspect emails

- Maintained blocklist of disposable email domains (curated; updated weekly).
- Default behavior: warn, don't block (low-friction signup).
- Org Owners can enforce "no disposable emails" Org-wide for invites.

## 7. Email abuse

- Bounce rate per sender > 5% over 24 h → outbound sending throttled.
- Spam complaints > 0.1% → manual review of outbound templates.
- Per-Account email cap: 100 outbound (invites + verifications + notifications) per 24 h on Free; higher tiers scale.

## 8. Webhook abuse

- Outbound webhook (Team) failures: exponential backoff to 24 h; permanent disable after 7 d failure with notification.
- Inbound webhook receivers (e.g., billing) signed; signature verification before any work.

## 9. Audit

- Every rate-limit hit logged at info level (sampled 1%) for monitoring.
- Lockouts logged at warning level.
- Account locks logged at error level + on-call notified if Account is Owner of paid Org.

## 10. UX during throttle

- 429 responses include `Retry-After` HTTP header (seconds, rounded up).
- 429 response body uses the canonical envelope from `03-api-endpoints/18-error-codes.md` §1 — frontend matches on `error.code` (e.g. `RATE_LIMITED`, `RATE_LIMITED_AUTH`, `RATE_LIMITED_SHARE_PASSWORD`), never on `message` or status alone. Full envelope examples in `13-rate-limit-values.md` §7.
- UI shows friendly "Too many attempts. Try again in X minutes." with countdown driven by `retry_after_ms`.
- Magic-link / forgot flows: never reveal whether limit was hit due to email-specific or IP-specific rule.

## 11. Telemetry

- `ratelimit.hit` `{ route, scope }` (sampled)
- `ratelimit.lockout` `{ route, target }`
- `bot.captcha_challenged` `{ score }`
- `bot.captcha_failed`
- `bot.honeypot_triggered`
- `account.suspicious_attempts` `{ count_24h }`
- `account.locked` `{ reason }`

## 12. Configuration

- All limits live in a versioned config file `auth-limits.yaml` (loaded at startup; hot-reloadable via SIGHUP).
- Per-environment overrides (dev: very loose; prod: strict).
- Owner can request per-Org enterprise limits raise (Team Enterprise add-on).

## 13. Edge cases

| Case | Behavior |
|---|---|
| Shared NAT IP (corporate) | Risk of false positives; per-Account limits dominate; Owners can request whitelist |
| User behind Tor | Allowed but always challenged with CAPTCHA |
| Test environment scripts | Use API tokens (separate quota) instead of password sign-in |
| Provisioning burst (SCIM 1000-user import) | Routed to async batch endpoint; bypasses interactive limits |
| Account locked but Owner of paid Org | Support fast-path; never blocks billing access |

## 14. Tests

- Sliding-window correctness across clock boundaries.
- Lockout enforcement + auto-expire.
- CAPTCHA score gating.
- Enumeration-prevention timing tests.
- Backoff math correctness.
