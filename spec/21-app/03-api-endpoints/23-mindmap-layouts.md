# Mindmap Layout Endpoints

> **Scope.** Persistence layer for the mindmap visualization (`15-visualization/04-mindmap-view.md`). A `MindmapLayout` is a saved arrangement of nodes (positions, collapsed state, color overrides) tied to a scope (Space / Collection / Group). One scope can have many layouts (named views); one is marked `is_default`.
>
> **Why a separate file (not folded into `15-import-export.md` or `06-collections.md`).** Layouts have their own lifecycle: they are created by the mindmap canvas, listed in a "Saved views" picker, mutated by drag operations, and deleted independently of the underlying scope. They do NOT belong to import/export and they cross multiple scope kinds, so a dedicated file is the cleanest home.

All require bearer auth + `X-Organization-Id`. Rate limit class: `write` for POST/PATCH/DELETE; `read` for GET.

---

### List layouts for a scope
`GET /v1/mindmap-layouts?scope_type=collection&scope_id=01J...`

**Auth:** bearer + `X-Organization-Id` + read access to the scope
**Idempotent:** yes
**Rate limit class:** `read`

**Query params**
- `scope_type` (required) — `space | collection | group`.
- `scope_id` (required) — uuid of the scope entity.
- `include_shared` (optional, default `true`) — include layouts shared with the Org by other members.

**Response 200**
```json
{
  "data": [
    {
      "id": "01J...",
      "name": "Q1 priorities",
      "scope_type": "collection",
      "scope_id": "01J...",
      "is_default": true,
      "node_count": 42,
      "created_by_account_id": "01J...",
      "shared_with_org": false,
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "page": { "next_cursor": null, "has_more": false }
}
```

> The full layout payload (node positions, viewport state) is NOT returned in the list — fetch it via `GET /v1/mindmap-layouts/:id`.

---

### Get a single layout (full payload)
`GET /v1/mindmap-layouts/:id`

**Response 200**
```json
{
  "data": {
    "id": "01J...",
    "name": "Q1 priorities",
    "scope_type": "collection",
    "scope_id": "01J...",
    "is_default": true,
    "viewport": { "x": 0, "y": 0, "zoom": 1.0 },
    "nodes": [
      { "id": "01J...", "kind": "item", "ref_id": "01J...", "x": 120, "y": 80, "collapsed": false, "color": null }
    ],
    "edges": [
      { "from": "01J...", "to": "01J...", "kind": "tag", "label": "ai" }
    ],
    "created_by_account_id": "01J...",
    "shared_with_org": false,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

---

### Create a layout
`POST /v1/mindmap-layouts`

**Auth:** bearer + `X-Organization-Id` + write access to the scope
**Idempotent:** Idempotency-Key (recommended)
**Rate limit class:** `write` (60 / hour per Account)

**Request body**
```json
{
  "name": "Q1 priorities",
  "scope_type": "collection",
  "scope_id": "01J...",
  "is_default": false,
  "shared_with_org": false,
  "viewport": { "x": 0, "y": 0, "zoom": 1.0 },
  "nodes": [
    { "id": "01J...", "kind": "item", "ref_id": "01J...", "x": 120, "y": 80, "collapsed": false }
  ],
  "edges": []
}
```

**Field semantics**
- `name` — required, 1–80 chars, unique per (`scope_type`, `scope_id`, `created_by_account_id`).
- `is_default` — when `true`, the previous default for this scope is automatically unset (atomic).
- `shared_with_org` — when `true`, all Org members with read access to the scope see the layout in their picker. Only the creator (or Org owner/admin) can edit/delete a shared layout.
- `nodes[].kind` enum: `item | group | collection | tag | note`. `ref_id` points at the corresponding entity.
- `nodes[].id` — client-generated UUIDv7 (per project memory rule); the server preserves it so subsequent PATCHes can address the same node.

**Response 201** — same shape as `GET /v1/mindmap-layouts/:id`.

**Errors**
- `400 VALIDATION_FAILED` — name length / duplicate name / node count > 5000.
- `403 FORBIDDEN` — caller lacks write on the scope OR `shared_with_org=true` requested without the appropriate Org permission.
- `409 CONFLICT` — race on the unique-name constraint.
- `413 PAYLOAD_TOO_LARGE` — body > 2 MB; split nodes across multiple layouts.

---

### Update a layout (rename, reposition, share)
`PATCH /v1/mindmap-layouts/:id`

Partial updates accepted. Whole-array replacement for `nodes` / `edges` (the canvas debounces and PATCHes the full set on every drag-end). Server diffs internally for the audit log.

---

### Delete a layout
`DELETE /v1/mindmap-layouts/:id`

**Auth:** bearer + `X-Organization-Id` + (creator OR Org owner/admin)
**Idempotent:** yes (re-deleting returns 200 with `{ already_deleted: true }`)
**Rate limit class:** `write`

**Response 200**
```json
{
  "data": {
    "id": "01J...",
    "deleted_at": "2026-04-20T08:30:00Z",
    "was_default": true,
    "new_default_id": "01J..."
  }
}
```

> If the deleted layout was `is_default`, the server promotes the most-recently-updated remaining layout for the same scope to default and returns its id as `new_default_id`. If no layouts remain, `new_default_id` is `null` and the canvas falls back to auto-layout.

**Errors**
- `403 FORBIDDEN` — non-creator non-admin attempting to delete a `shared_with_org=true` layout.
- `404 NOT_FOUND` — id unknown OR layout in another Org.

See also `15-visualization/04-mindmap-view.md §106`.
