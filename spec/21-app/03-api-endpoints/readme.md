# 03 — API Endpoints

> ⚠️ **This folder defines REST endpoint CONTRACTS only.** No SQL, no implementation, no framework choice. The backend team designs the database and chooses the stack independently. This spec locks: HTTP method, path, auth requirement, request body shape, response body shape, error codes, idempotency, pagination, rate limits.

## Reading order

0. **`00-overview.md` — start here if you just want to see every endpoint.** Single index of all 145 endpoints grouped by HTTP method (GET / POST / PATCH / PUT / DELETE), each with one-line purpose and a pointer to its detailed contract file.
1. `01-conventions.md` — read **first** before implementing. Defines base URL, versioning, auth headers, error envelope, pagination, idempotency, rate limits, ETag/concurrency, common types. Every other file in this folder assumes these.
2. `02-public-share-viewer.md` — unauthenticated `/t/{slug}` endpoints. Read second because they have the loosest auth model.
3. `03-auth.md` — sign-up, sign-in, OAuth, magic links, sessions, password reset.
4. `04-organizations.md` → `05-spaces.md` → `06-collections.md` → `07-groups.md` → `08-items.md` — the core CRUD ladder.
5. `09-tags.md`, `10-shares.md`, `11-members-invites.md` — cross-cutting collaboration.
6. `12-sessions-save.md` — Save Session to Collection (extension-driven).
7. `13-search.md`, `14-history.md` — power features.
8. `15-import-export.md` — bulk operations.
9. `16-licenses.md`, `17-billing-webhooks.md` — entitlements.

## Files

| File | Endpoints (count) | Auth |
|---|---|---|
| `00-overview.md` | 145 (index, all methods) | — |
| `01-conventions.md` | — | — |
| `02-public-share-viewer.md` | 7 | none / share-cookie / OAuth |
| `03-auth.md` | 14 | mixed |
| `04-organizations.md` | 10 | bearer |
| `05-spaces.md` | 9 | bearer |
| `06-collections.md` | 11 | bearer |
| `07-groups.md` | 9 | bearer |
| `08-items.md` | 13 | bearer |
| `09-tags.md` | 7 | bearer |
| `10-shares.md` | 11 | bearer (mgmt) / public (viewer) |
| `11-members-invites.md` | 11 | bearer |
| `12-sessions-save.md` | 4 | bearer |
| `13-search.md` | 4 | bearer |
| `14-history.md` | 7 | bearer |
| `15-import-export.md` | 14 | bearer / path-token |
| `16-licenses.md` | 8 | bearer |
| `17-billing-webhooks.md` | 6 | webhook signature / path-token |
| `18-error-codes.md` | — (catalog) | — |
| `19-account.md` | 2 | bearer (Account scope) |
| `20-jobs.md` | 1 | bearer |
| `21-flags.md` | 1 | bearer |
| `22-internal.md` | 1 | bearer |
| `23-mindmap-layouts.md` | 5 | bearer |

Total: 145 endpoints.

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
- **Error envelope is uniform** (see `01-conventions.md`).
- **No PATCH on parent fields that change tree shape** — those are dedicated actions like `POST /collections/:id/move`.
- **Idempotency-Key header** required on POST endpoints that create resources, optional elsewhere.
