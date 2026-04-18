# API Conventions

> Read this before any other file in `03-api-endpoints/`. Every endpoint inherits these rules.

---

## 1. Base URL & versioning

- Production: `https://api.letsmarknow.com`
- Staging: `https://api.staging.letsmarknow.com`
- All endpoints under `/v1/`.
- `/v1/health` is the unversioned health check (also `/health`).

## 2. Auth

### 2.1 Bearer (primary)

```
Authorization: Bearer <access_token>
```

- `access_token` is a short-lived JWT (15 min).
- Issued by `POST /v1/auth/token` (refresh) or sign-in endpoints.
- Carries claims: `sub` (account_id), `org_id` (active org), `role`, `entitlements_hash`, `iat`, `exp`, `jti`.

### 2.2 Active organization header

```
X-Organization-Id: <uuid>
```

- Required on every authenticated endpoint that operates on Org-scoped resources.
- Server validates the Account is an active Member of the Org.
- If absent and the route is Org-scoped → `400 ORG_HEADER_REQUIRED`.

### 2.3 Refresh token

- Long-lived (30 days), HTTP-only cookie `lmn_refresh`, `Secure`, `SameSite=Lax`, scoped to `.letsmarknow.com`.
- Rotated on every use; old refresh becomes invalid.

### 2.4 Share cookie (public viewer)

- `lmn_share_<slug>` cookie set after successful password unlock or invite-only auth on `letsmarknow.com/t/{slug}`.
- Short-lived (24 h), signed (HMAC).

### 2.5 Webhook signature

- Inbound webhooks (Stripe, Paddle) verified per provider docs. Stored secret in env.

## 3. Standard headers

| Header | Direction | Purpose |
|---|---|---|
| `Authorization` | request | bearer token |
| `X-Organization-Id` | request | active org context |
| `X-Client` | request | `chrome-ext/1.4.0`, `web/1.4.0` (analytics + abuse) |
| `X-Request-Id` | request/response | client-generated UUID; echoed in response and logs |
| `Idempotency-Key` | request | UUID; required on resource-creating POSTs |
| `If-Match` | request | optimistic concurrency on PATCH/DELETE (`updated_at` value) |
| `ETag` | response | every entity response includes its `updated_at` as ETag |
| `X-RateLimit-Limit` | response | numeric |
| `X-RateLimit-Remaining` | response | numeric |
| `X-RateLimit-Reset` | response | unix seconds |
| `Retry-After` | response | seconds, on 429/503 |

## 4. Uniform error envelope

Every non-2xx response:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Human-readable message in user's locale.",
    "field": "name",
    "details": { "min": 1, "max": 120 },
    "request_id": "01J...",
    "doc_url": "https://docs.letsmarknow.com/errors/validation_failed"
  }
}
```

- `code` is SCREAMING_SNAKE, stable across versions.
- `field` is set when the error pertains to a single input field.
- Never leak stack traces, SQL, or internal IDs.

### Standard error codes

| HTTP | code | Meaning |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Body/query failed validation |
| 400 | `ORG_HEADER_REQUIRED` | Missing `X-Organization-Id` |
| 400 | `IDEMPOTENCY_KEY_REQUIRED` | Missing on creating POST |
| 400 | `IDEMPOTENCY_KEY_REUSED_DIFFERENT_BODY` | Same key, different payload |
| 401 | `UNAUTHENTICATED` | No/invalid token |
| 401 | `TOKEN_EXPIRED` | Use refresh |
| 403 | `FORBIDDEN` | Authenticated but not allowed |
| 403 | `ENTITLEMENT_REQUIRED` | Plan upgrade needed; `details.required_entitlement` set |
| 404 | `NOT_FOUND` | Resource not found or hidden by tenancy |
| 409 | `CONFLICT` | Generic conflict |
| 409 | `LIMIT_REACHED` | `details.limit_name`, `details.current`, `details.max` |
| 409 | `STALE_RESOURCE` | `If-Match` mismatch |
| 410 | `GONE` | Share revoked / target deleted |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Wrong Content-Type |
| 422 | `BUSINESS_RULE_VIOLATION` | e.g. cannot delete sole Owner |
| 423 | `LOCKED` | Resource locked by another mutation |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unhandled |
| 503 | `SERVICE_UNAVAILABLE` | Maintenance |

## 5. Pagination

Cursor-based, default and only style:

**Request:**
```
GET /v1/items?limit=50&cursor=eyJpZCI6IjAxSi4uLiJ9
```

**Response:**
```json
{
  "data": [ /* items */ ],
  "page": {
    "next_cursor": "eyJpZCI6IjAxSi4uLiJ9",
    "has_more": true,
    "limit": 50
  }
}
```

- `limit` default 50, max 200.
- `cursor` is opaque base64-JSON; clients never inspect.
- Total counts are NEVER returned in paginated lists (use dedicated `/count` endpoints).

## 6. Idempotency

- POST endpoints that create resources REQUIRE `Idempotency-Key` (UUID, client-generated).
- Server stores `(account_id, idempotency_key) → response` for 24 h.
- Same key + same body within 24 h → return cached response.
- Same key + different body → `400 IDEMPOTENCY_KEY_REUSED_DIFFERENT_BODY`.

## 7. Optimistic concurrency

- Mutating endpoints (PATCH, DELETE) accept `If-Match: <updated_at>` (the ETag value).
- Mismatch → `409 STALE_RESOURCE` with current `updated_at` in `details.current`.
- Clients then re-fetch and retry.

## 8. Rate limits (per Account, per IP for unauth)

| Class | Limit | Window |
|---|---|---|
| `read` | 1000 | 1 min |
| `write` | 200 | 1 min |
| `bulk` | 20 | 1 min |
| `auth` | 30 | 5 min (per IP) |
| `search` | 120 | 1 min |
| `webhook` | 10000 | 1 min |

Per-Org caps mirror per-Account at 5×.

429 responses include `Retry-After`.

## 9. Common response objects

### Entity envelope

```json
{
  "data": { /* the entity */ }
}
```

For lists, `data` is an array (see § 5).

### Entity reference (denormalized stub)

When an entity references another, the API returns a stub:

```json
{
  "id": "01J...",
  "type": "collection",
  "name": "Marketing Improvements",
  "color": "#e94560"
}
```

### Timestamps

ISO-8601 UTC with milliseconds: `"2026-04-18T14:22:31.123Z"`.

### Money

```json
{ "amount_cents": 999, "currency": "USD" }
```

## 10. Sorting

When supported, query param `sort=field,-other_field` (prefix `-` for desc). Allowed fields documented per endpoint.

## 11. Filtering

Query params named after fields:

```
GET /v1/items?collection_id=01J...&is_starred=true&tag=react
```

Multi-value via repeated keys: `?tag=react&tag=ui`.

## 12. Bulk operations

Endpoints prefixed `/bulk/` accept arrays:

```json
{ "operations": [ { "op": "create", "data": {...} }, { "op": "delete", "id": "..." } ] }
```

Response includes per-op result. Atomic by default (`all-or-nothing=true` query param to opt-in to fail-fast; default is per-op).

## 13. Search & expand

- `?fields=id,name,color` — sparse fields.
- `?expand=tags,shares` — embed referenced entities one level deep.

## 14. Conformance

Every response includes:

```
X-Request-Id: <uuid echoed>
X-API-Version: v1
```

## 15. Deprecation

Deprecated endpoints/fields return:

```
Sunset: Wed, 01 Jul 2026 00:00:00 GMT
Deprecation: true
Link: <https://docs.letsmarknow.com/migrations/v2>; rel="deprecation"
```
