# Environment Variables

Complete inventory. Anything not listed here MUST NOT be read from `process.env`.

---

## 1. Convention

- `SCREAMING_SNAKE_CASE`.
- Prefix by surface: `WEB_`, `API_`, `EXT_`, `BUILD_`.
- Public (safe to ship in client bundle) prefix: `VITE_PUBLIC_*`. Anything else is server-only.
- Boolean values: `true` / `false` (lowercase strings).
- URLs: full origin including scheme; **never** trailing slash.

## 2. Web app (`app.letsmarknow.com`) — build-time

| Var | Required | Example | Notes |
|---|---|---|---|
| `VITE_PUBLIC_API_URL` | yes | `https://api.letsmarknow.com` | API origin |
| `VITE_PUBLIC_MARKETING_URL` | yes | `https://letsmarknow.com` | For cross-links |
| `VITE_PUBLIC_ENV` | yes | `dev` / `staging` / `prod` | Drives banner + feature flag defaults |
| `VITE_PUBLIC_VERSION` | yes | `1.4.2+abcd123` | Semver + short SHA, for support |
| `VITE_PUBLIC_POSTHOG_HOST` | optional | `https://ph.letsmarknow.com` | Self-hosted |
| `VITE_PUBLIC_POSTHOG_KEY` | optional | `phc_…` | Publishable, OK in bundle |
| `VITE_PUBLIC_GLITCHTIP_DSN` | optional | `https://…@glitchtip…/1` | Publishable |

## 3. API (Edge Functions) — runtime

| Var | Required | Notes |
|---|---|---|
| `LOVABLE_CLOUD_URL` | yes | Provided automatically |
| `LOVABLE_CLOUD_ANON_KEY` | yes | Provided automatically; client-callable |
| `LOVABLE_CLOUD_SERVICE_ROLE_KEY` | yes | Server-only; never exposed |
| `JWT_SECRET` | yes | For our own short-lived signed tokens (share cookies) |
| `STRIPE_SECRET_KEY` | yes (prod) | `sk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | yes (prod) | `whsec_…` |
| `PADDLE_API_KEY` | optional | EU VAT path |
| `PADDLE_WEBHOOK_PUBLIC_KEY` | optional | For signature verification |
| `RESEND_API_KEY` | yes | Outbound transactional email (primary provider) |
| `POSTMARK_API_KEY` | optional | Required if `EMAIL_PROVIDER=postmark` (failover) |
| `EMAIL_PROVIDER` | optional | `resend` (default) or `postmark` |
| `EMAIL_FROM` | yes | `noreply@letsmarknow.com` (transactional) |
| `EMAIL_FROM_NOTIFICATIONS` | yes | `notifications@letsmarknow.com` |
| `EMAIL_FROM_BILLING` | yes | `billing@letsmarknow.com` |
| `EMAIL_FROM_SUPPORT` | yes | `support@letsmarknow.com` |
| `OAUTH_GOOGLE_CLIENT_ID_STAGING` | optional | Required in staging |
| `OAUTH_GOOGLE_CLIENT_SECRET_STAGING` | optional | Required in staging |
| `OAUTH_GOOGLE_CLIENT_ID_PROD` | yes (prod) | |
| `OAUTH_GOOGLE_CLIENT_SECRET_PROD` | yes (prod) | |
| `OAUTH_APPLE_CLIENT_ID_STAGING` | optional | Service ID, e.g. `com.letsmarknow.app.staging` |
| `OAUTH_APPLE_CLIENT_ID_PROD` | optional | Service ID, e.g. `com.letsmarknow.app` |
| `OAUTH_APPLE_TEAM_ID` | optional | Single value, both envs |
| `OAUTH_APPLE_KEY_ID_STAGING` | optional | |
| `OAUTH_APPLE_KEY_ID_PROD` | optional | |
| `OAUTH_APPLE_PRIVATE_KEY_STAGING` | optional | PEM, base64-encoded in vault |
| `OAUTH_APPLE_PRIVATE_KEY_PROD` | optional | PEM, base64-encoded in vault |
| `OAUTH_GITHUB_CLIENT_ID_STAGING` | optional | |
| `OAUTH_GITHUB_CLIENT_SECRET_STAGING` | optional | |
| `OAUTH_GITHUB_CLIENT_ID_PROD` | optional | |
| `OAUTH_GITHUB_CLIENT_SECRET_PROD` | optional | |
| `OAUTH_STATE_SECRET` | yes | HMAC key for OAuth `state` param (rotated quarterly) |
| `SHARE_LINK_HMAC_KEY` | yes | For signed share tokens |
| `RATE_LIMIT_REDIS_URL` | yes | Upstash or Cloud Redis |
| `QUEUE_URL` | yes | See `07-queues.md` |
| `CRON_SECRET` | yes | Bearer for cron-only endpoints |
| `SENTRY_DSN` (or GlitchTip) | yes (prod) | Server-side error reporting |
| `LOG_LEVEL` | optional | `debug`/`info`/`warn`/`error`, default `info` |
| `EU_DATA_RESIDENCY_ENFORCED` | yes | `true` in prod EU |

## 4. Marketing site (SSR) — build-time

| Var | Required | Notes |
|---|---|---|
| `VITE_PUBLIC_API_URL` | yes | Same as web app |
| `VITE_PUBLIC_APP_URL` | yes | `https://app.letsmarknow.com` |
| `VITE_PUBLIC_ENV` | yes | |
| `VITE_PUBLIC_PLAUSIBLE_DOMAIN` | optional | If we use Plausible for marketing only |

## 5. Chrome extension — build-time

| Var | Required | Notes |
|---|---|---|
| `EXT_API_URL` | yes | Baked into manifest |
| `EXT_CHANNEL` | yes | `stable` / `beta` |
| `EXT_VERSION` | yes | Semver written to `manifest.json` |
| `EXT_OAUTH_CLIENT_ID` | yes | Per `04-extension/11-auth-bridge.md` |

## 6. Validation

- A `scripts/check-env.ts` script runs in CI. Missing required vars fail the build.
- The script also fails if any var contains a placeholder pattern (`xxx`, `TODO`, `changeme`, `localhost` in non-dev).

## 7. Cross-references

- Secrets storage: `04-secrets.md`
- CI gate: `09-ci-cd.md`
