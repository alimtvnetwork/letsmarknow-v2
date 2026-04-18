# 03 — API Endpoints

> ⚠️ **This folder defines REST endpoint CONTRACTS only.** No SQL, no implementation, no framework choice. The backend team designs the database and chooses the stack independently. This spec locks: HTTP method, path, auth requirement, request body shape, response body shape, error codes, idempotency, pagination, rate limits.

## Reading order

1. `conventions.md` — read **first**. Defines base URL, versioning, auth headers, error envelope, pagination, idempotency, rate limits, ETag/concurrency, common types. Every other file in this folder assumes these.
2. `public-share-viewer.md` — unauthenticated `/t/{slug}` endpoints. Read second because they have the loosest auth model.
3. `auth.md` — sign-up, sign-in, OAuth, magic links, sessions, password reset.
4. `organizations.md` → `spaces.md` → `collections.md` → `groups.md` → `items.md` — the core CRUD ladder.
5. `tags.md`, `shares.md`, `members-invites.md` — cross-cutting collaboration.
6. `sessions-save.md` — Save Session to Collection (extension-driven).
7. `search.md`, `history.md` — power features.
8. `import-export.md` — bulk operations.
9. `licenses.md`, `billing-webhooks.md` — entitlements.

## Files

| File | Endpoints (count) | Auth |
|---|---|---|
| `conventions.md` | — | — |
| `public-share-viewer.md` | 5 | none / share-cookie / OAuth |
| `auth.md` | 14 | mixed |
| `organizations.md` | 9 | bearer |
| `spaces.md` | 9 | bearer |
| `collections.md` | 11 | bearer |
| `groups.md` | 9 | bearer |
| `items.md` | 13 | bearer |
| `tags.md` | 7 | bearer |
| `shares.md` | 9 | bearer (mgmt) / public (viewer) |
| `members-invites.md` | 11 | bearer |
| `sessions-save.md` | 4 | bearer |
| `search.md` | 4 | bearer |
| `history.md` | 6 | bearer |
| `import-export.md` | 8 | bearer |
| `licenses.md` | 7 | bearer |
| `billing-webhooks.md` | 4 | webhook signature |

Total: ~130 endpoints.

## Endpoint template

Every endpoint in every file uses this exact format:

```
### <HUMAN NAME>
`<METHOD> /v1/<path>`

**Auth:** <none | bearer | bearer + role | webhook-sig | share-cookie>
**Idempotent:** <yes | no | with Idempotency-Key>
**Rate limit class:** <read | write | bulk | auth | search>

**Path params**
- `name` (type) — description

**Query params**
- `name` (type, default) — description

**Request body** (`application/json`)
```json
{ ... }
```

**Response 200** (`application/json`)
```json
{ ... }
```

**Errors**
- `400 VALIDATION_FAILED` — when …
- `403 FORBIDDEN` — when …
- `404 NOT_FOUND` — when …
- `409 CONFLICT` — when …
- `429 RATE_LIMITED` — when …
```

## Locked rules

- **Versioning:** all endpoints prefixed `/v1/`. Breaking changes go to `/v2/`.
- **JSON only:** request and response are `application/json; charset=utf-8`. Never form-encoded except OAuth callbacks and webhooks.
- **UTC always:** all timestamps in ISO-8601 UTC with milliseconds.
- **IDs are UUIDv7 strings.**
- **Error envelope is uniform** (see `conventions.md`).
- **No PATCH on parent fields that change tree shape** — those are dedicated actions like `POST /collections/:id/move`.
- **Idempotency-Key header** required on POST endpoints that create resources, optional elsewhere.
