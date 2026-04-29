# Error Codes — Master Catalog

> **Purpose:** Single source of truth for every `error_code` string returned by the API. Frontend switches on `error_code`, never on HTTP status alone, never on `message` text.
>
> **Closes:** Blocker B2 from `23-audits/gap-analysis.md`.

---

## 1. Error envelope (recap from `01-conventions.md`)

Every non-2xx response uses this envelope:

```json
{
  "error": {
    "code": "SHARE_EXPIRED",
    "message": "This share link has expired.",
    "http_status": 410,
    "retryable": false,
    "retry_after_ms": null,
    "request_id": "req_01HZ...",
    "details": {}
  }
}
```

- `code` — stable string from the table below. **Never change a code once shipped.**
- `message` — human-readable, English only. Frontend may override with `../06-ui-ux/17-copy-strings.md` key `error.<code>`.
- `http_status` — mirrors the HTTP status of the response.
- `retryable` — if `true`, client may retry with backoff.
- `retry_after_ms` — if `retryable` and known, client should wait this long.
- `request_id` — for support.
- `details` — optional code-specific context (see per-code notes).

---

## 2. Code conventions

- **SCREAMING_SNAKE_CASE.**
- **Domain prefix** when ambiguous: `AUTH_`, `SHARE_`, `BILLING_`, `IMPORT_`, `RATE_`.
- **Past-tense or noun form**, never imperative: `SHARE_EXPIRED` ✅, `EXPIRE_SHARE` ❌.
- **No numeric suffixes.** Add a new code instead of `RATE_LIMITED_2`.

---

## 3. Master error table

### 3.1 Auth & session (`AUTH_*`)

| Code | HTTP | Retryable | Toast key | Details fields |
|---|---|---|---|---|
| `AUTH_INVALID_CREDENTIALS` | 401 | no | `toast.auth.invalid_credentials` | — |
| `AUTH_EMAIL_NOT_VERIFIED` | 403 | no | `toast.auth.email_not_verified` | `email` |
| `AUTH_MFA_REQUIRED` | 401 | no | `toast.auth.mfa_required` | `mfa_methods[]` |
| `AUTH_MFA_INVALID` | 401 | no | `toast.auth.mfa_invalid` | — |
| `AUTH_SESSION_EXPIRED` | 401 | no | `toast.auth.session_expired` | — |
| `AUTH_SESSION_REVOKED` | 401 | no | `toast.auth.session_revoked` | — |
| `AUTH_OAUTH_PROVIDER_FAILED` | 502 | yes | `toast.auth.oauth_failed` | `provider` |
| `AUTH_OAUTH_STATE_MISMATCH` | 400 | no | `toast.auth.oauth_state_mismatch` | — |
| `AUTH_PASSWORD_TOO_WEAK` | 422 | no | `toast.auth.password_too_weak` | `requirements[]` |
| `AUTH_EMAIL_TAKEN` | 409 | no | `toast.auth.email_taken` | — |
| `AUTH_RESET_TOKEN_INVALID` | 400 | no | `toast.auth.reset_token_invalid` | — |
| `AUTH_RESET_TOKEN_EXPIRED` | 410 | no | `toast.auth.reset_token_expired` | — |
| `AUTH_DEVICE_NOT_TRUSTED` | 403 | no | `toast.auth.device_not_trusted` | — |
| `AUTH_SSO_REQUIRED` | 403 | no | `toast.auth.sso_required` | `provider`, `org_slug` |

### 3.2 Authorization & permissions (`PERM_*`)

| Code | HTTP | Retryable | Toast key | Details fields |
|---|---|---|---|---|
| `PERM_DENIED` | 403 | no | `toast.perm.denied` | `required_role`, `actual_role` |
| `PERM_ROLE_REQUIRED` | 403 | no | `toast.perm.role_required` | `required_role` |
| `PERM_ORG_MISMATCH` | 403 | no | `toast.perm.org_mismatch` | — |
| `PERM_NOT_MEMBER` | 403 | no | `toast.perm.not_member` | `org_slug` |
| `PERM_OWNER_REQUIRED` | 403 | no | `toast.perm.owner_required` | — |
| `PERM_BILLING_LOCKED` | 402 | no | `toast.perm.billing_locked` | `reason` |

### 3.3 Resource lifecycle (`NOT_FOUND_*`, `CONFLICT_*`, `GONE_*`)

| Code | HTTP | Retryable | Toast key | Details fields |
|---|---|---|---|---|
| `NOT_FOUND` | 404 | no | `toast.notfound.generic` | `resource`, `id` |
| `NOT_FOUND_ITEM` | 404 | no | `toast.notfound.item` | `id` |
| `NOT_FOUND_COLLECTION` | 404 | no | `toast.notfound.collection` | `id` |
| `NOT_FOUND_SPACE` | 404 | no | `toast.notfound.space` | `id` |
| `NOT_FOUND_GROUP` | 404 | no | `toast.notfound.group` | `id` |
| `NOT_FOUND_ORG` | 404 | no | `toast.notfound.org` | `slug` |
| `NOT_FOUND_SHARE` | 404 | no | `toast.notfound.share` | `token` |
| `CONFLICT_DUPLICATE` | 409 | no | `toast.conflict.duplicate` | `field`, `value` |
| `CONFLICT_VERSION` | 409 | no | `toast.conflict.version` | `expected_version`, `actual_version` |
| `CONFLICT_NAME_TAKEN` | 409 | no | `toast.conflict.name_taken` | `name` |
| `GONE_SOFT_DELETED` | 410 | no | `toast.gone.soft_deleted` | `id`, `deleted_at`, `purges_at` |
| `GONE_HARD_DELETED` | 410 | no | `toast.gone.hard_deleted` | — |

### 3.4 Validation (`VALIDATION_*`)

| Code | HTTP | Retryable | Toast key | Details fields |
|---|---|---|---|---|
| `VALIDATION_FAILED` | 422 | no | `toast.validation.failed` | `errors[].field`, `errors[].code`, `errors[].message` |
| `VALIDATION_REQUIRED_FIELD` | 422 | no | `toast.validation.required_field` | `field` |
| `VALIDATION_INVALID_FORMAT` | 422 | no | `toast.validation.invalid_format` | `field`, `expected` |
| `VALIDATION_TOO_LONG` | 422 | no | `toast.validation.too_long` | `field`, `max` |
| `VALIDATION_TOO_SHORT` | 422 | no | `toast.validation.too_short` | `field`, `min` |
| `VALIDATION_INVALID_URL` | 422 | no | `toast.validation.invalid_url` | `field` |
| `VALIDATION_INVALID_EMAIL` | 422 | no | `toast.validation.invalid_email` | `field` |
| `VALIDATION_INVALID_ENUM` | 422 | no | `toast.validation.invalid_enum` | `field`, `allowed[]` |

### 3.5 Sharing (`SHARE_*`)

| Code | HTTP | Retryable | Toast key | Details fields |
|---|---|---|---|---|
| `SHARE_EXPIRED` | 410 | no | `toast.share.expired` | `expired_at` |
| `SHARE_REVOKED` | 410 | no | `toast.share.revoked` | `revoked_at` |
| `SHARE_PASSWORD_REQUIRED` | 401 | no | `toast.share.password_required` | — |
| `SHARE_PASSWORD_INVALID` | 401 | no | `toast.share.password_invalid` | `attempts_remaining` |
| `SHARE_PASSWORD_LOCKED` | 429 | yes | `toast.share.password_locked` | `unlock_at` |
| `SHARE_INVITE_ONLY` | 403 | no | `toast.share.invite_only` | — |
| `SHARE_DOMAIN_BLOCKED` | 403 | no | `toast.share.domain_blocked` | — |
| `SHARE_QUOTA_EXCEEDED` | 402 | no | `toast.share.quota_exceeded` | `limit` |
| `SHARE_LINK_INVALID` | 400 | no | `toast.share.link_invalid` | — |

### 3.6 Billing & licensing (`BILLING_*`)

| Code | HTTP | Retryable | Toast key | Details fields |
|---|---|---|---|---|
| `BILLING_PAYMENT_FAILED` | 402 | no | `toast.billing.payment_failed` | `provider`, `decline_code` |
| `BILLING_CARD_EXPIRED` | 402 | no | `toast.billing.card_expired` | — |
| `BILLING_SUBSCRIPTION_PAST_DUE` | 402 | no | `toast.billing.past_due` | `grace_until` |
| `BILLING_SUBSCRIPTION_CANCELED` | 403 | no | `toast.billing.subscription_canceled` | — |
| `BILLING_SEAT_LIMIT_REACHED` | 402 | no | `toast.billing.seat_limit` | `limit`, `current` |
| `BILLING_QUOTA_EXCEEDED` | 402 | no | `toast.billing.quota_exceeded` | `quota`, `limit`, `current` |
| `BILLING_PLAN_DOWNGRADE_BLOCKED` | 409 | no | `toast.billing.downgrade_blocked` | `reason` |
| `BILLING_COUPON_INVALID` | 400 | no | `toast.billing.coupon_invalid` | — |
| `BILLING_COUPON_EXPIRED` | 410 | no | `toast.billing.coupon_expired` | — |
| `BILLING_PROVIDER_ERROR` | 502 | yes | `toast.billing.provider_error` | `provider` |
| `LICENSE_INVALID` | 403 | no | `toast.license.invalid` | — |
| `LICENSE_EXPIRED` | 410 | no | `toast.license.expired` | — |
| `LICENSE_DEVICE_LIMIT` | 403 | no | `toast.license.device_limit` | `limit` |

### 3.7 Import / export (`IMPORT_*`, `EXPORT_*`)

| Code | HTTP | Retryable | Toast key | Details fields |
|---|---|---|---|---|
| `IMPORT_FILE_TOO_LARGE` | 413 | no | `toast.import.file_too_large` | `max_bytes` |
| `IMPORT_FORMAT_UNSUPPORTED` | 415 | no | `toast.import.format_unsupported` | `format`, `supported[]` |
| `IMPORT_PARSE_FAILED` | 422 | no | `toast.import.parse_failed` | `line`, `reason` |
| `IMPORT_QUOTA_EXCEEDED` | 402 | no | `toast.import.quota_exceeded` | `limit` |
| `IMPORT_JOB_FAILED` | 500 | yes | `toast.import.job_failed` | `job_id`, `reason` |
| `IMPORT_DUPLICATE_DETECTED` | 409 | no | `toast.import.duplicate` | `count` |
| `EXPORT_JOB_FAILED` | 500 | yes | `toast.export.job_failed` | `job_id` |
| `EXPORT_NOT_READY` | 425 | yes | `toast.export.not_ready` | `ready_at` |

### 3.8 Rate limiting & abuse (`RATE_*`)

| Code | HTTP | Retryable | Toast key | Details fields |
|---|---|---|---|---|
| `RATE_LIMITED` | 429 | yes | `toast.rate.limited` | `limit`, `window_seconds`, `reset_at` |
| `RATE_LIMITED_AUTH` | 429 | yes | `toast.rate.limited_auth` | `unlock_at` |
| `RATE_LIMITED_SHARE_PASSWORD` | 429 | yes | `toast.rate.limited_share_password` | `unlock_at` |
| `ABUSE_DETECTED` | 403 | no | `toast.abuse.detected` | — |
| `ABUSE_IP_BLOCKED` | 403 | no | `toast.abuse.ip_blocked` | — |

### 3.9 System & infra (`SYS_*`)

| Code | HTTP | Retryable | Toast key | Details fields |
|---|---|---|---|---|
| `SYS_INTERNAL` | 500 | yes | `toast.sys.internal` | `request_id` |
| `SYS_TIMEOUT` | 504 | yes | `toast.sys.timeout` | — |
| `SYS_UNAVAILABLE` | 503 | yes | `toast.sys.unavailable` | `retry_after_ms` |
| `SYS_MAINTENANCE` | 503 | yes | `toast.sys.maintenance` | `eta` |
| `SYS_DEPENDENCY_DOWN` | 502 | yes | `toast.sys.dependency_down` | `dependency` |
| `SYS_FEATURE_DISABLED` | 403 | no | `toast.sys.feature_disabled` | `feature_flag` |

### 3.10 Realtime (`RT_*`)

| Code | HTTP | Retryable | Toast key | Details fields |
|---|---|---|---|---|
| `RT_CONNECTION_LOST` | n/a | yes | `toast.rt.connection_lost` | — |
| `RT_CHANNEL_DENIED` | 403 | no | `toast.rt.channel_denied` | `channel` |
| `RT_PRESENCE_FULL` | 429 | yes | `toast.rt.presence_full` | `limit` |

---

## 4. Client behavior matrix

| `retryable` | Recommended client action |
|---|---|
| `false` | Show toast, log to telemetry, do **not** retry. |
| `true` + `retry_after_ms` set | Wait `retry_after_ms`, then retry once. After 3 fails, show toast. |
| `true` + no `retry_after_ms` | Exponential backoff: 1s, 2s, 4s. Cap at 3 retries. |

---

## 5. Adding a new code (process)

1. Append a row to the relevant section above.
2. Add the toast key to `06-ui-ux/17-copy-strings.md` under `errors.*`.
3. Add a Gherkin scenario under `21-testing/` for the trigger condition.
4. Bump the OpenAPI spec.
5. Never reuse a deprecated code — mark as `~~DEPRECATED~~` in the table.

---

## 6. Locked rules

- Codes are **stable contracts**. Once shipped, never rename, never repurpose.
- Frontend **must switch on `code`**, never on `message` or `http_status` alone.
- Every new endpoint declares its possible error codes in the OpenAPI spec.
- `details` is **additive only** — never remove a field, never change its type.
- HTTP status in the envelope **must match** the response status line.
