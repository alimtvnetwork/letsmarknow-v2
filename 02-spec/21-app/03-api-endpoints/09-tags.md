# Tags Endpoints

Tags are Org-scoped, flat (no hierarchy in v1), and attachable to Collections, Groups, Items.

All require bearer auth and `X-Organization-Id`.

---

### List tags
`GET /v1/tags`

**Query params**
- `q` (string) — case-insensitive prefix match on `name`
- `sort` (`name` default; also `-usage_count`, `-created_at`)
- `limit` (default 100, max 500), `cursor`

**Response 200**
```json
{
  "data": [
    {
      "id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
      "organization_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
      "name": "react",
      "slug": "react",
      "color": "#a78bfa",
      "description": null,
      "usage_count": 17,
      "created_by": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

---

### Create tag
`POST /v1/tags`

**Idempotent:** Idempotency-Key
**Request body**
```json
{ "name": "react", "color": "#a78bfa", "description": null }
```
- `name`: 1–40 chars; auto-trimmed; case preserved on create but uniqueness is case-insensitive per Org.
- `slug` is auto-derived (lowercased, kebab-case, unicode-stripped); collisions get `-2`, `-3`, etc.

**Response 201** Full Tag.

**Errors**
- `409 CONFLICT` `details.reason="name_exists"` — duplicate name in this Org
- `409 LIMIT_REACHED` `details.limit_name="max_tags_per_org"` — entitlement-driven

---

### Get tag
`GET /v1/tags/:id`

---

### Update tag
`PATCH /v1/tags/:id`
**If-Match:** required
**Body**
```json
{ "name": "react.js", "color": "#7c3aed", "description": "..." }
```
Renaming bumps `updated_at` on every entity that uses this tag (denormalized cache invalidation), but does NOT emit per-entity History Events.

**Errors**
- `409 CONFLICT` — new name collides

---

### Delete tag
`DELETE /v1/tags/:id`
**Auth:** Editor+
**Response 204**
Side effects: removes from `tag_ids` of all entities. Asynchronous if `usage_count > 1000` → returns `202 Accepted` with `job_id`.

---

### Merge tags
`POST /v1/tags/:id/merge`

**Request body**
```json
{ "merge_into_tag_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab" }
```
All entities tagged with `:id` are re-tagged with `merge_into_tag_id` (de-duped); `:id` is then deleted.
**Response 202** `{ data: { job_id: "0190a4f1-6c5e-7c2a-9b3f-1234567890ab", status: "queued" } }`

---

### Suggest tags (autocomplete)
`GET /v1/tags/suggest`

**Query**
- `q` (string, required) — typed substring
- `limit` (default 10, max 25)

**Response 200**
```json
{
  "data": [
    { "id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab", "name": "react", "color": "#a78bfa", "match": "prefix" },
    { "id": null, "name": "react-native", "color": null, "match": "create_new" }
  ]
}
```
`match=create_new` entries have `id=null` and represent "Create new tag" affordances.
