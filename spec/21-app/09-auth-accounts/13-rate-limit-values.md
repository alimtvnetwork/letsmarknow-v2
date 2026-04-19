# Rate Limit Values

> **Closes gap M4.** Concrete numeric rate limits for every public API route and authentication action.
> **Locked rule:** Rate limits are enforced at the edge function gateway via Upstash Redis token-bucket. Limits below are MINIMUMS for production. Lower in test environments allowed; never higher in prod without owner approval.

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

| Action | Identifier | Limit | Burst | Window | Lockout |
|---|---|---|---|---|---|
| `POST /auth/signin` (password) | ip + email | **5/min** | 10 | 60 s | 15-min lockout after 10 failures in 1 h |
| `POST /auth/signup` | ip | **3/min** | 5 | 60 s | 24-h email block after 5 signups same email |
| `POST /auth/reset-password` | ip + email | **3/h** | 5 | 1 h | — |
| `POST /auth/verify-email` (resend) | account | **5/h** | — | 1 h | — |
| `POST /auth/oauth/callback` | ip | **20/min** | 30 | 60 s | — |
| `POST /auth/mfa/verify` | account | **5/min** | 10 | 60 s | 15-min lockout after 10 failures |

## 3. Content endpoints (per authenticated user)

| Endpoint group | Limit | Window | Notes |
|---|---|---|---|
| `GET /items`, `/collections`, `/spaces` (reads) | **300/min** | 60 s | Cached; ETag-aware |
| `POST /items` (save tab) | **120/min** | 60 s | Bulk save uses `/items/batch` instead |
| `POST /items/batch` | **10/min** | 60 s | Max 500 items per call |
| `PATCH /items/:id` | **180/min** | 60 s | |
| `DELETE /items/:id` | **120/min** | 60 s | |
| `POST /sessions/save` | **30/min** | 60 s | Each session = up to 200 items |
| `POST /shares` | **30/min** | 60 s | |
| `GET /search` | **120/min** | 60 s | Per-query cached 60 s server-side |

## 4. Public share viewer (anonymous)

| Endpoint | Identifier | Limit |
|---|---|---|
| `GET /s/:token` (HTML) | ip | **60/min** per token |
| `GET /api/share/:token/items` | ip | **120/min** per token |
| `POST /api/share/:token/comment` (if enabled) | ip | **10/min** per token |
| `POST /api/share/:token/password` (verify) | ip | **5/min** per token; 15-min lockout after 10 failures |

## 5. Webhook endpoints (inbound)

| Endpoint | Limit | Verification |
|---|---|---|
| `POST /webhooks/stripe` | **300/min** | HMAC-SHA256 (Stripe-Signature header) |
| `POST /webhooks/paddle` | **300/min** | HMAC-SHA256 |
| `POST /webhooks/email-in` (per-org address) | **60/min** | Postmark/SES signature |

## 6. Org-wide quotas (Free / Pro / Team / Lifetime)

| Action | Free | Pro | Team | Lifetime |
|---|---|---|---|---|
| Saves per day | 500 | 5,000 | 20,000 | 5,000 |
| Exports per day | 1 | 10 | 50 | 10 |
| Active shares | 5 | 100 | unlimited | 100 |
| API tokens | 0 | 3 | 10 | 3 |

When quota exhausted → HTTP 429 with `error_code = QUOTA_EXCEEDED` and `Retry-After` header set to seconds until next UTC midnight reset.

## 7. Response shape (all 429 responses)

```json
{
  "error_code": "RATE_LIMITED",
  "message": "Too many requests. Try again in 23 s.",
  "retry_after_seconds": 23,
  "limit": 120,
  "window_seconds": 60,
  "scope": "account:route"
}
```

`Retry-After` HTTP header MUST mirror `retry_after_seconds`.

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
3. Lockouts are stored in Redis with TTL = lockout window; never persisted in Postgres (avoids replication lag bypass).
4. Limits live in `src/lib/rate-limits.ts` (codegen from this file). PRs that add a route must add a row to this table.
