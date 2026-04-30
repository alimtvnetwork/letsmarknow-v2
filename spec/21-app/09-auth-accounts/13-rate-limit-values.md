# Rate Limit Values

> **Closes gap M4.** Concrete numeric rate limits for every public API route and authentication action.
>
> **F-M09 / F-M10 closure (2026-04-19):** This file is the canonical numeric companion to `11-rate-limits-and-abuse.md`. The 429 / 402 response envelope below is **identical** to the canonical envelope in `../03-api-endpoints/18-error-codes.md` §1 — nested `{ error: { code, ... } }`, `retry_after_ms` (milliseconds, never `_seconds` at top level), `request_id`, and `details.{...}`. Error codes are drawn **only** from the master catalog in `../03-api-endpoints/18-error-codes.md` §3.8 (rate) / §3.6 (billing); no codes are invented here.
>
> **Reconciliation map:**
>
> | This file | Canonical source | Status |
> |---|---|---|
> | All paths use `/v1/` prefix | `03-api-endpoints/01-conventions.md` §3 | ✅ aligned |
> | Auth limit numbers | `09-auth-accounts/11-rate-limits-and-abuse.md` §2 (narrative) | ✅ aligned |
> | 429 / 402 envelope shape | `../03-api-endpoints/01-conventions.md` §4 + `../03-api-endpoints/18-error-codes.md` §1 | ✅ aligned |
> | Rate-limit error codes | `../03-api-endpoints/18-error-codes.md` §3.8 (`RATE_LIMITED`, `RATE_LIMITED_AUTH`, `RATE_LIMITED_SHARE_PASSWORD`) | ✅ aligned |
> | Org-quota error code | `../03-api-endpoints/18-error-codes.md` §3.6 (`BILLING_QUOTA_EXCEEDED`) | ✅ aligned (no invented `QUOTA_EXCEEDED`) |
> | API-token per-tier rate buckets (Pro/Team/Enterprise) | `11-import-export/07-webhooks-and-api-imports.md §4` | ✅ delegated (this file does NOT duplicate API-token tier limits) |
> | Email-in plan-tier daily quotas | `11-import-export/08-email-in.md §7` | ✅ delegated (this file SoTs only the per-minute gateway burst) |
> | `Retry-After` HTTP header | mirrors `retry_after_ms` (seconds, rounded up) | ✅ aligned |
>
> **Locked rule:** Rate limits enforced at the edge function gateway via Upstash Redis token-bucket. Numbers below are MINIMUMS for production. Lower in test environments allowed; never higher in prod without owner approval.

---

## 1. Identifier strategy

| Layer | Identifier | Used for |
|---|---|---|
| L1 | `ip` (CF-Connecting-IP) | Anonymous endpoints, abuse defence |
| L2 | `account_id` | Authenticated endpoints |
| L3 | `account_id + route` | Per-route quotas |
| L4 | `org_id` | Org-wide quotas (saves, exports) |
| L5 | `share_token` | Public share viewer |

When both IP and account exist, the **stricter** of the two applies.

## 2. Authentication endpoints

> Numbers reconciled with `11-rate-limits-and-abuse.md` §2. That file is the narrative source; the table below is the canonical numeric table for codegen.

| Route | Per-IP | Per-Email/Account | Lockout |
|---|---|---|---|
| `POST /v1/auth/signup` | 10 / hour | 3 / 24 h per email | 24-h email block after 5 signups same email |
| `POST /v1/auth/signin` | 30 / 5 min | 5 / 15 min per email | 15-min lockout on `(email, IP)` after 5 consecutive failures; account lock after 100 fails / 24 h |
| `POST /v1/auth/magic-link/send` | 10 / hour | 5 / 24 h per email | — |
| `POST /v1/auth/password/forgot` | 5 / hour | 3 / 24 h per email | — |
| `GET /v1/auth/verify` | 30 / hour | n/a | — |
| `POST /v1/auth/token` (refresh) | 60 / min | 60 / min per session | — |
| `POST /v1/auth/signout` | 30 / min | n/a | — |
| `POST /v1/auth/mfa/verify` | n/a | 5/min per account | 15-min lockout after 10 failures |
| `GET /v1/auth/oauth/:provider/start`, `GET /v1/auth/oauth/:provider/callback` | 30 / hour | n/a | Canonical paths per `03-api-endpoints/00-overview.md` and `03-api-endpoints/03-auth.md §OAuth`. The bare `/auth/callback/:provider` form sometimes referenced in narrative prose is a lay alias for the same callback endpoint. |

## 3. Content endpoints (per authenticated account)

| Endpoint group | Limit | Window | Notes |
|---|---|---|---|
| `GET /v1/items`, `/v1/collections`, `/v1/spaces` (reads) | 1000 | 1 min | Class `read` per `../03-api-endpoints/01-conventions.md` §8 |
| `POST /v1/items` (save tab) | 200 | 1 min | Class `write` |
| `POST /v1/bulk/items` | 20 | 1 min | Class `bulk`; max 500 items per call |
| `PATCH /v1/items/:id` | 200 | 1 min | Class `write` |
| `DELETE /v1/items/:id` | 200 | 1 min | Class `write` |
| `POST /v1/sessions/save` | 30 | 1 min | Each session = up to 200 items |
| `POST /v1/shares` | 30 | 1 min | |
| `GET /v1/search` | 120 | 1 min | Class `search`; per-query cached 60 s server-side |

Per-Org caps mirror per-Account at 5× (per `../03-api-endpoints/01-conventions.md` §8).

## 4. Public share viewer (anonymous)

| Endpoint | Identifier | Limit |
|---|---|---|
| `GET /t/:slug` (HTML) | ip | 60 / min per slug |
| `GET /v1/public/shares/:slug/items` | ip | 120 / min per slug |
| `POST /v1/public/shares/:slug/comments` (if enabled) | ip | 10 / min per slug |
| `POST /v1/public/shares/:slug/unlock` (password verify) | ip + slug | 10 / 15 min per slug; 5 / 15 min per IP; lockout at 100 fails / 24 h on slug |

## 5. Webhook endpoints (inbound)

| Endpoint | Limit | Verification |
|---|---|---|
| `POST /v1/webhooks/stripe` | 300 / min | HMAC-SHA256 (Stripe-Signature header) |
| `POST /v1/webhooks/paddle` | 300 / min | HMAC-SHA256 |
| `POST /v1/webhooks/email-in` (per-org address) | 60 / min | Postmark/SES signature |

> **Email-in plan-tier daily quotas** (Pro: 100/24h @ 5 MB; Team: 1,000/24h @ 10 MB) are SoT'd in `11-import-export/08-email-in.md §7`. Both limits apply independently.

## 6. Org-wide quotas (Free / Pro / Team / Lifetime)

| Action | Free | Pro | Team | Lifetime |
|---|---|---|---|---|
| Saves per day | 500 | 5,000 | 20,000 | 5,000 |
| Exports per day | 1 | 10 | 50 | 10 |
| Active shares | 5 | 100 | unlimited | 100 |
| API tokens | 0 | 0 | 10 | 0 |

> **API token row** aligned with `10-licensing-billing/01-plans-matrix.md` capability matrix (API tokens are Team-only).

When quota exhausted → HTTP 402 with `error.code = BILLING_QUOTA_EXCEEDED` (per `03-api-endpoints/18-error-codes.md` §3.6). `Retry-After` header set to seconds until next UTC midnight reset.

## 7. Response shape (all 429 / 402 quota responses)

> Uses canonical envelope from `../03-api-endpoints/01-conventions.md` §4 + `../03-api-endpoints/18-error-codes.md` §1. **Do not invent flat `error_code` fields.**

429 rate-limit example:

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Try again in 23 s.",
    "http_status": 429,
    "retryable": true,
    "retry_after_ms": 23000,
    "request_id": "req_01HZ...",
    "details": {
      "limit": 120,
      "window_seconds": 60,
      "scope": "account:route"
    }
  }
}
```

402 org-quota example:

```json
{
  "error": {
    "code": "BILLING_QUOTA_EXCEEDED",
    "message": "Daily save quota reached. Upgrade or wait until reset.",
    "http_status": 402,
    "retryable": false,
    "retry_after_ms": null,
    "request_id": "req_01HZ...",
    "details": {
      "quota": "saves_per_day",
      "limit": 500,
      "current": 500,
      "reset_at": "2026-04-20T00:00:00Z"
    }
  }
}
```

`Retry-After` HTTP header MUST mirror `retry_after_ms` (in seconds, rounded up).

## 8. Bypass rules

- `system` actor (cron, internal jobs) → no limit.
- Authenticated requests with header `X-Lovable-Internal: <signed token>` → no limit (CI/load tests only).
- Owner-tier accounts get a soft 1.5× multiplier on Free/Pro plans (still enforced).

## 9. Telemetry

| Event | Props |
|---|---|
| `rate_limit.hit` | `route`, `identifier_type`, `limit`, `window_s` |
| `rate_limit.lockout` | `route`, `account_id`, `duration_s` |
| `quota.exhausted` | `org_id`, `quota_name`, `value` |

## 10. Locked rules

1. All limits enforced server-side at gateway. Client retry helpers MUST honour `Retry-After`.
2. No endpoint runs without a rate limit. Default-deny: missing limit = configuration error, not "unlimited".
3. Lockouts stored in Redis with TTL = lockout window; never persisted in Postgres (avoids replication lag bypass).
4. Limits live in `src/lib/rate-limits.ts` (codegen from this file). PRs that add a route must add a row to this table.
5. All paths in this file MUST include the `/v1/` prefix from `03-api-endpoints/01-conventions.md`. Bare `/auth/...` paths are a spec bug.
6. 429 / 402 envelopes MUST use the canonical nested `{ error: { code, ... } }` shape. Flat `error_code` is forbidden.
