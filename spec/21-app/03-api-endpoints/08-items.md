# Items Endpoints

CRUD on Items (the leaf bookmarks) + move + reorder + favicon refresh + open + bulk + jump-to-tab.

All require bearer auth and `X-Organization-Id`.

---

### List items
`GET /v1/items`

**Query params**
- `collection_id` (uuid) — required unless `group_id` is set
- `group_id` (uuid) — required unless `collection_id` is set
- `include_groups` (bool, default false) — when filtering by collection_id, also include items in groups inside that collection
- `include_deleted`, `tag` (repeatable), `is_starred`, `q` (substring on title/url)
- `sort` (`position` default; also `name`, `-created_at`, `-updated_at`, `-last_opened_at`)
- `limit`, `cursor`

**Response 200**
```json
{
  "data": [
    {
      "id": "01J...",
      "collection_id": "01J...",
      "group_id": null,
      "space_id": "01J...",
      "organization_id": "01J...",
      "title": "ChatGPT",
      "url": "https://chatgpt.com/",
      "normalized_url": "https://chatgpt.com/",
      "domain": "chatgpt.com",
      "description": null,
      "notes": null,
      "favicon_url": "https://cdn.letsmarknow.com/favicons/chatgpt.com.png",
      "favicon_status": "ok",
      "color_override": null,
      "tag_ids": ["01J..."],
      "position": 1024,
      "is_starred": false,
      "last_opened_at": "2026-04-18T...",
      "open_count": 42,
      "deleted_at": null,
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "page": { "next_cursor": null, "has_more": false, "limit": 50 }
}
```

---

### Create item
`POST /v1/items`

**Idempotent:** Idempotency-Key required
**Request body**
```json
{
  "collection_id": "01J...",
  "group_id": null,
  "url": "https://chatgpt.com/",
  "title": "ChatGPT",
  "description": null,
  "notes": null,
  "tag_ids": [],
  "position_hint": "end"
}
```
- Exactly one of `collection_id` or `group_id` required.
- `position_hint`: `"start" | "end" | "after:<item_id>" | "before:<item_id>"`.
- `title` optional; if omitted server fetches `<title>` async (returns provisional title = domain).

**Response 201** Full Item.

**Errors**
- `403 ENTITLEMENT_REQUIRED` — Free item cap
- `409 LIMIT_REACHED` — hard cap (10k/collection or 2k/group)
- `400 VALIDATION_FAILED` `details.field="url"` — invalid scheme (only `http`/`https`/`chrome-extension`/`file` allowed; `file` requires entitlement)

---

### Get item
`GET /v1/items/:id`
**Query:** `expand=tags,shares,collection,group`

---

### Update item
`PATCH /v1/items/:id`
**If-Match:** required
**Body** (any subset)
```json
{
  "title": "...",
  "url": "https://...",
  "description": "...",
  "notes": "...",
  "color_override": "#e94560"
}
```
URL change triggers async favicon refetch + History Event with old/new URL.

---

### Move item (cross-Collection or in/out of Group, same Org)
`POST /v1/items/:id/move`

**Request body**
```json
{
  "to_collection_id": "01J...",
  "to_group_id": null,
  "before_item_id": null,
  "after_item_id": null
}
```
Exactly one of `to_collection_id` or `to_group_id` required (group target implies its collection).

**Errors**
- `422 BUSINESS_RULE_VIOLATION` — destination is in different Org
- `409 LIMIT_REACHED` — destination at item cap

---

### Reorder within parent
`POST /v1/items/:id/reorder`
Body: `{ before_item_id, after_item_id }`.

---

### Star / unstar
`POST /v1/items/:id/star`
`POST /v1/items/:id/unstar`
**Response 204**

---

### Tag / untag
`POST /v1/items/:id/tags`
Body: `{ add: [...], remove: [...], create: [{ name, color }] }`. Same shape as collections.

---

### Refresh favicon
`POST /v1/items/:id/favicon/refresh`
**Response 202** `{ data: { status: "queued" } }`
Server refetches; updates `favicon_url`, `favicon_status`.

---

### Record open (Jump-to-Tab or new-tab open)
`POST /v1/items/:id/opens`

**Request body**
```json
{ "source": "jump_to_tab" | "new_tab" | "open_all" | "share_viewer", "in_new_window": false }
```
**Response 204**
Side effects: bumps `last_opened_at`, `open_count`. Emits NO history event (too noisy).

---

### Duplicate item
`POST /v1/items/:id/duplicate`
Body: `{ to_collection_id?, to_group_id? }`. Defaults to same parent.
**Response 201** New Item.

---

### Bulk operations
`POST /v1/bulk/items`

**Request body**
```json
{
  "all_or_nothing": false,
  "operations": [
    { "op": "create", "data": { "collection_id": "01J...", "url": "...", "title": "..." } },
    { "op": "update", "id": "01J...", "data": { "title": "..." }, "if_match": "..." },
    { "op": "move", "id": "01J...", "data": { "to_group_id": "01J..." } },
    { "op": "delete", "id": "01J..." },
    { "op": "tag", "id": "01J...", "data": { "add": ["01J..."] } }
  ]
}
```
**Response 207**
```json
{
  "data": {
    "results": [
      { "index": 0, "status": 201, "data": { /* item */ } },
      { "index": 1, "status": 409, "error": { "code": "STALE_RESOURCE", "..." : "..." } }
    ]
  }
}
```
Atomic when `all_or_nothing=true`: any failure → all rolled back, response is `4xx` with first error.

---

### Soft-delete / Restore
`DELETE /v1/items/:id`
`POST /v1/items/:id/restore`

Delete returns `{ deleted_at, purges_at, history_event_id }` for one-click Undo.
