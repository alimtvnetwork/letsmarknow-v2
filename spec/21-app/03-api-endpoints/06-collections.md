# Collections Endpoints

CRUD on Collections + move/duplicate/reorder + tagging + notes + bulk + open-all.

All require bearer auth and `X-Organization-Id`.

---

### List collections
`GET /v1/collections`

**Query params**
- `space_id` (uuid, **required**)
- `include_deleted` (bool, default false)
- `tag` (repeatable)
- `is_starred` (bool)
- `sort` (`position` default, also `name`, `-updated_at`, `-created_at`, `-item_count_cache`)
- `limit`, `cursor`

**Response 200**
```json
{
  "data": [
    {
      "id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
      "space_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
      "organization_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
      "name": "Marketing Improvements",
      "description": "...",
      "color": "#e94560",
      "icon": null,
      "icon_emoji": "📈",
      "position": 1024,
      "is_starred": false,
      "is_collapsed_by_default": false,
      "tag_ids": ["0190a4f1-6c5e-7c2a-9b3f-1234567890ab"],
      "default_view_mode": "grid",
      "item_count_cache": 4,
      "group_count_cache": 1,
      "deleted_at": null,
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "page": { "next_cursor": null, "has_more": false, "limit": 50 }
}
```

---

### Create collection
`POST /v1/collections`

**Auth:** bearer (Editor+)
**Idempotent:** Idempotency-Key required
**Request body**
```json
{
  "space_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
  "name": "New Collection",
  "color": "#e94560",
  "icon_emoji": "📈",
  "description": null,
  "notes": null,
  "tag_ids": []
}
```
**Response 201** Full Collection.

**Errors**
- `403 ENTITLEMENT_REQUIRED` — Free tier collection cap
- `409 LIMIT_REACHED`

---

### Get collection
`GET /v1/collections/:id`

**Query params**
- `expand` (csv: `tags`,`shares`,`groups`,`items`)

**Response 200** Full collection, optionally with embedded children.

---

### Update collection
`PATCH /v1/collections/:id`

**If-Match:** required
**Body** (any subset of mutable fields). `space_id` is NOT mutable here — use Move.

---

### Move collection (cross-Space, same Org)
`POST /v1/collections/:id/move`

**Request body**
```json
{
  "to_space_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
  "before_collection_id": null,
  "after_collection_id": null
}
```
**Response 200** Updated Collection.
**Errors**
- `403 FORBIDDEN` — destination Space not editable
- `422 BUSINESS_RULE_VIOLATION` — different Org

---

### Reorder within Space
`POST /v1/collections/:id/reorder`

Body same as `spaces.reorder`.

---

### Duplicate collection
`POST /v1/collections/:id/duplicate`

**Idempotent:** with Idempotency-Key
**Request body**
```json
{
  "to_space_id": null,        // null = same space
  "new_name": "Marketing Improvements copy",
  "include_items": true,
  "include_shares": false
}
```
**Response 201** New Collection.

---

### Tag / untag (bulk-friendly)
`POST /v1/collections/:id/tags`

**Request body**
```json
{ "add": ["0190a4f1-6c5e-7c2a-9b3f-1234567890ab","0190a4f1-6c5e-7c2a-9b3f-1234567890ab"], "remove": ["0190a4f1-6c5e-7c2a-9b3f-1234567890ab"], "create": [{ "name": "ux", "color": "#a78bfa" }] }
```
`create` allows inline tag creation. Newly-created tag IDs are auto-added.
**Response 200**
```json
{ "data": { "tag_ids": ["0190a4f1-6c5e-7c2a-9b3f-1234567890ab","0190a4f1-6c5e-7c2a-9b3f-1234567890ab"] } }
```

---

### Update notes (long-form, separate endpoint to allow large bodies)
`PUT /v1/collections/:id/notes`

**Request body**
```json
{ "notes": "markdown-lite content..." }
```
**Response 200**
```json
{ "data": { "notes": "...", "updated_at": "..." } }
```

---

### Open all (action; non-mutating)
`POST /v1/collections/:id/open-all`

This endpoint exists to **record analytics + return ordered URL list** to the extension, which then opens tabs locally. Server does NOT open tabs.

**Request body**
```json
{ "in_new_window": false, "include_groups": true }
```
**Response 200**
```json
{
  "data": {
    "urls": ["https://...", "https://..."],
    "count": 12
  }
}
```

---

### Soft-delete / Restore
`DELETE /v1/collections/:id` — same shape as Space delete.
`POST /v1/collections/:id/restore`
