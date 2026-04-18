# Groups Endpoints

Sub-container inside Collection. Same shape as Collections minus a few fields, plus `hide`/`unhide` and `open-all`.

All require bearer auth and `X-Organization-Id`.

---

### List groups
`GET /v1/groups`

**Query params**
- `collection_id` (uuid, required)
- `include_deleted`, `tag`, `is_starred`, `is_hidden`, `sort`, `limit`, `cursor`

**Response 200** array of Group objects:
```json
{
  "data": [
    {
      "id": "01J...",
      "collection_id": "01J...",
      "space_id": "01J...",
      "organization_id": "01J...",
      "parent_group_id": null,
      "name": "Quick Tools",
      "description": null,
      "color": null,
      "icon_emoji": "🐤",
      "position": 1024,
      "is_starred": false,
      "is_collapsed_by_default": false,
      "is_hidden": false,
      "tag_ids": [],
      "view_mode": "compact",
      "item_count_cache": 13,
      "deleted_at": null,
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

---

### Create group
`POST /v1/groups`

**Idempotent:** Idempotency-Key
**Request body**
```json
{
  "collection_id": "01J...",
  "name": "Quick Tools",
  "icon_emoji": "🐤",
  "view_mode": "compact",
  "tag_ids": []
}
```
**Response 201** Full Group.

**Errors**
- `403 ENTITLEMENT_REQUIRED` — Free tier group cap
- `400 VALIDATION_FAILED` `details.field="parent_group_id"` — non-null parent_group_id rejected in v1

---

### Get group
`GET /v1/groups/:id`
**Query:** `expand=tags,items,shares`

---

### Update group
`PATCH /v1/groups/:id`
**If-Match:** required
Mutable fields per `02-data-model/group.md`.

---

### Move group (cross-Collection, same Org)
`POST /v1/groups/:id/move`

**Request body**
```json
{
  "to_collection_id": "01J...",
  "before_group_id": null,
  "after_group_id": null
}
```
Cross-Collection within same Org allowed; cross-Org rejected.

---

### Reorder within Collection
`POST /v1/groups/:id/reorder`
Body same as siblings.

---

### Hide / Unhide
`POST /v1/groups/:id/hide`
`POST /v1/groups/:id/unhide`
**Response 204**

`is_hidden=true` causes the group to be filtered out from default render in column view; still searchable; still openable via the full collection view.

---

### Duplicate group
`POST /v1/groups/:id/duplicate`
**Request body**
```json
{
  "to_collection_id": null,
  "new_name": "Quick Tools copy",
  "include_items": true,
  "include_shares": false
}
```

---

### Open all
`POST /v1/groups/:id/open-all`
Same response shape as `collections.open-all`.

---

### Soft-delete / Restore
`DELETE /v1/groups/:id`
`POST /v1/groups/:id/restore`
