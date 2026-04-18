# Spaces Endpoints

CRUD on Spaces + reorder + star + collapse + duplicate.

All endpoints require bearer auth and `X-Organization-Id` header.

---

### List spaces in active org
`GET /v1/spaces`

**Auth:** bearer
**Rate limit class:** read

**Query params**
- `include_deleted` (bool, default `false`) — include soft-deleted (Trash view)
- `expand` (csv: `collection_count`)
- `sort` (default `position`)

**Response 200**
```json
{
  "data": [
    {
      "id": "01J...",
      "organization_id": "01J...",
      "name": "My Collections",
      "description": null,
      "icon": null,
      "color": null,
      "position": 1024,
      "is_starred": false,
      "visibility": "org",
      "default_view_mode": "grid",
      "collection_count": 12,
      "deleted_at": null,
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

---

### Create space
`POST /v1/spaces`

**Auth:** bearer (Editor+)
**Idempotent:** with Idempotency-Key
**Rate limit class:** write

**Request body**
```json
{
  "name": "Personal",
  "description": null,
  "icon": "lock",
  "color": null,
  "visibility": "private"
}
```

**Response 201** Full Space.

**Errors**
- `403 ENTITLEMENT_REQUIRED` — Free tier exceeded `max_spaces_per_org`
- `409 LIMIT_REACHED` — hard cap (500)

---

### Get space
`GET /v1/spaces/:id`

**Response 200** Same shape as list item, plus `notes`, `settings`, `my_state` (per-Account):
```json
{
  "data": {
    "...": "...",
    "notes": "...",
    "settings": { "show_collection_count": true, "collapsed_collections": ["01J..."] },
    "my_state": { "is_starred": false, "last_viewed_at": "..." }
  }
}
```

---

### Update space
`PATCH /v1/spaces/:id`

**Auth:** bearer (Editor+)
**If-Match:** required
**Request body** (any subset)
```json
{
  "name": "...",
  "description": "...",
  "notes": "...",
  "icon": "...",
  "color": "...",
  "visibility": "shared",
  "default_view_mode": "compact",
  "settings": { /* partial merge */ }
}
```
**Response 200** Full Space.

---

### Reorder space
`POST /v1/spaces/:id/reorder`

**Auth:** bearer (Editor+)
**Request body**
```json
{ "before_space_id": "01J...", "after_space_id": "01J..." }
```
At least one of `before_space_id`/`after_space_id` required. Server computes new `position` between neighbors.
**Response 200** Updated Space.

---

### Star / unstar (per-Account)
`POST /v1/spaces/:id/star`
`POST /v1/spaces/:id/unstar`

**Auth:** bearer
**Response 204**
Side effect: updates `account_space_state.is_starred`.

---

### Collapse / expand (per-Account)
`POST /v1/spaces/:id/collapsed-collections`

**Request body**
```json
{ "add": ["01J..."], "remove": ["01J..."] }
```
**Response 200**
```json
{ "data": { "collapsed_collections": ["01J..."] } }
```

---

### Duplicate space
`POST /v1/spaces/:id/duplicate`

**Auth:** bearer (Editor+)
**Idempotent:** with Idempotency-Key
**Rate limit class:** bulk

**Request body**
```json
{
  "new_name": "Personal copy",
  "include_items": true,
  "include_shares": false
}
```
**Response 202**
```json
{ "data": { "job_id": "01J...", "new_space_id": "01J...", "status": "queued" } }
```

Polled via `GET /v1/jobs/:job_id`.

---

### Soft-delete space
`DELETE /v1/spaces/:id`

**Auth:** bearer (Editor+)
**If-Match:** required
**Response 200**
```json
{ "data": { "deleted_at": "...", "purges_at": "...", "history_event_id": "01J..." } }
```
The `history_event_id` enables direct Undo.

---

### Restore space
`POST /v1/spaces/:id/restore`
**Response 200** Full Space.
**Errors**
- `410 GONE` — already hard-deleted
