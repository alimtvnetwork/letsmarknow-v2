# API Conventions

> Read this before any other file in `03-api-endpoints/`. Every endpoint inherits these rules.

---

## 1. Base URL & versioning

- Production: `https://api.letsmarknow.com`
- Staging: `https://api.staging.letsmarknow.com`
- All endpoints under `/v1/`.
- `/v1/health` is the unversioned health check (also `/health`).

### 1.1 Path-parameter style (locked)

- **Use `:name` only.** All path parameters in declared endpoints, examples, and cross-references use the colon-prefix form: `/v1/items/:id`, `/v1/collections/:collection_id/items`.
- **Do NOT use `{name}`.** The brace form (`/v1/items/{id}`) is forbidden in the spec because it produces parity drift with the declared route table in `00-overview.md`.
- **Path-param naming:** lower_snake_case. Use `:id` for the entity's own primary key; use `:<entity>_id` only when the parent entity is needed for disambiguation (e.g. `/v1/collections/:collection_id/items`).
- **Conformance check:** `grep -rE '/v1/[^"]*\{[a-z_]+\}' spec/21-app/` MUST return zero results. CI will fail if any `{...}` path-param appears in a `/v1/...` URL.

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

- `code` is `UPPER_SNAKE_CASE` (a.k.a. SCREAMING_SNAKE), stable across versions. **Locked (W-8 closure 2026-04-19):** every reference to an error `code` in any spec file must use `UPPER_SNAKE_CASE`. Lowercase forms (e.g. `insufficient_role`) are **withdrawn**.
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

## 16. Aliases & shorthand (locked)

The spec uses **one canonical path per endpoint**. Alias forms (different casing, separators, group-placeholders, or shorthand omissions) are forbidden in spec text because they break the AI's ability to build a single route table from `00-overview.md`.

### 16.1 Forbidden alias patterns (full table)

Mappings verified against `00-overview.md` and per-domain files (current as of 2026-04-20, Phase 13.6).

**Auth (`03-auth.md`)**

| Forbidden | Canonical (declared at) | Reason |
|---|---|---|
| `POST /v1/auth/sign_in` | (no declared row — see 09-auth-accounts/02-signup-and-signin.md for actual signin path) | Snake_case forbidden in path segments. |
| `POST /v1/auth/sign_up` | (same) | Snake_case forbidden. |
| `POST /v1/auth/sign_out` | (same) | Snake_case forbidden. |
| `POST /v1/auth/magic_link` | `POST /v1/auth/magic-link/send` (`00-overview.md:143`, `03-auth.md:82`) | Two-step magic-link flow is `magic-link/send` + `magic-link/consume`. |
| `POST /v1/auth/magic/request` | `POST /v1/auth/magic-link/send` | Same as above; the `magic/request` form was an unimplemented draft. |
| `POST /v1/auth/oauth/callback` | `GET /v1/auth/oauth/:provider/callback` (`00-overview.md`, `03-auth.md:142`) | OAuth callback is per-provider and is a `GET` redirect target, not `POST`. |
| `POST /v1/auth/forgot` | `POST /v1/auth/password/forgot` (`03-auth.md:192`) | Use full `password/forgot` path — `forgot` alone is ambiguous. |

**Bulk operations (`08-items.md`)**

| Forbidden | Canonical (declared at) | Reason |
|---|---|---|
| `POST /v1/items:batch` | `POST /v1/bulk/items` (`00-overview.md:223`, `08-items.md` Bulk operations) | The `:` matrix-param style is not used in this API. The bulk endpoint lives under `/v1/bulk/`, not `/v1/items/`. |
| `POST /v1/items/batch` | `POST /v1/bulk/items` | Same as above. |
| `POST /v1/items/bulk` | `POST /v1/bulk/items` | Same. |
| `POST /v1/bulk` | `POST /v1/bulk/items` | Resource name is required; `/v1/bulk` alone is not a real endpoint. |

**Billing (`16-licenses.md`)**

| Forbidden | Canonical (declared at) | Reason |
|---|---|---|
| `POST /v1/billing/checkout/session` | `POST /v1/organizations/:id/billing/checkout` (`16-licenses.md:95`) | Checkout is org-scoped; the global path strips the required `:id` segment. |
| `POST /v1/billing/portal/session` | `POST /v1/organizations/:id/billing/portal` (`16-licenses.md:122`) | Same. |

**Org admin (`04-organizations.md`, `11-members-invites.md`)**

| Forbidden | Canonical (declared at) | Reason |
|---|---|---|
| `POST /v1/organizations/{id}/deletion` | `DELETE /v1/organizations/:id` (`04-organizations.md:163`) | Use the canonical DELETE; the synthetic `/deletion` POST does not exist. Also violates §1.1 (`{id}` not allowed). |
| `POST /v1/organizations/{id}/exports` | `POST /v1/organizations/:id/data-export` (`04-organizations.md:214`) | Canonical name is `data-export` (GDPR-aligned). Also violates §1.1. |
| `POST /v1/organizations/{id}/invites` | `POST /v1/members/invites` (`11-members-invites.md:64`) | Invites endpoint is org-implicit via `X-Organization-Id` header, not in path. Also violates §1.1. |

**Collections (`06-collections.md`)**

| Forbidden | Canonical (declared at) | Reason |
|---|---|---|
| `PATCH /v1/collections/:collection_id` | `PATCH /v1/collections/:id` (`06-collections.md:86`) | Use `:id` for the entity's own primary key; `:collection_id` is reserved for parent-disambiguation in nested paths (e.g. `/v1/collections/:collection_id/items`). See §1.1. |

**Group placeholder (documentation only)**

| Forbidden | Canonical | Reason |
|---|---|---|
| `PATCH /v1/{collections\|groups\|tags\|spaces}/{id}` | declare each path explicitly | Group-placeholders are documentation shorthand only; never appear in declared rows or cross-references. |

### 16.2 Rule

When a feature file needs to reference an endpoint, copy the canonical path verbatim from `00-overview.md`. If a needed endpoint is not in `00-overview.md`, file an `SI-NNN` against `13-spec-issues/02-current-issues.md` instead of inventing an alias.

### 16.3 Conformance check

```
grep -rE '/v1/auth/sign_(in|up|out)|/v1/auth/magic_link|/v1/auth/magic/request|/v1/auth/forgot([^/]|$)|/v1/items[:/](batch|bulk)|/v1/bulk([^/]|$)|/v1/billing/(checkout|portal)/session|/v1/organizations/\{[a-z_]+\}/(deletion|exports|invites)|/v1/collections/:collection_id([^/]|$)|/v1/\{[a-z|]+\}' spec/21-app/ \
  | grep -v '13-spec-issues' | grep -v '23-audits'
```

MUST return zero results.
