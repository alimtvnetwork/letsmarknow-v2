# Entity: MindmapLayout

> **Phase 3** per `20-roadmap/04-phase-3-mindmap-ai.md`. Specced now so the data model and API (`03-api-endpoints/23-mindmap-layouts.md`) are reserved and consistent (closed VZ3 in `23-audits/audit-2026-04-30-visualization-sweep-109.md`).

## Purpose

Persisted snapshot of a user's mind-map view: node positions, filter state, zoom, pan. Lets a user save a hand-arranged graph and return to it later, or share a read-only frozen layout with teammates. Backs `15-visualization/04-mindmap-view.md §7` ("Saved layouts").

## Fields

| Name | Type | Null | Default | Validation | Description |
|---|---|---|---|---|---|
| Audit Block | — | — | — | — | see `README.md` |
| `account_id` | uuid (Account.id) | no | — | must exist | Owning Account (per-Account, per `15-visualization/04-mindmap-view.md §7`). |
| `organization_id` | uuid (Organization.id) | no | — | must exist | Org context — required for sharing scope and entitlement enforcement. |
| `scope_type` | enum(`space`\|`collection`\|`org`) | no | `collection` | locked enum | Which mind-map this layout was saved against. Matches `03-api-endpoints/23-mindmap-layouts.md` `scope_type` query param. |
| `scope_id` | uuid | no | — | must exist in the named scope table | FK target depends on `scope_type`. App-level integrity (no cross-table FK constraint). |
| `name` | string(120) | no | — | trim, non-empty | User-supplied label, shown in the layout picker. |
| `is_default` | bool | no | false | — | When true, this layout auto-loads on next mind-map open for the same `(account_id, scope_type, scope_id)`. At most one `true` per triple — enforced by partial unique index. |
| `snapshot` | jsonb | no | — | shape per §Snapshot schema below | The full saved layout payload. |
| `created_at` | timestamptz | no | now() | — | — |
| `updated_at` | timestamptz | no | now() | — | Bumped on every PATCH (rename, default toggle, position recapture). |

## Snapshot schema

`snapshot` shape (matches the export-as-JSON contract in `04-mindmap-view.md §10`):

```json
{
  "version": "1",
  "viewport": { "x": 0, "y": 0, "zoom": 1.0 },
  "filters": {
    "show": ["space", "collection", "group", "tag"],
    "color_by": "container",
    "min_count": 0,
    "search": null
  },
  "nodes": [
    { "id": "...", "kind": "collection", "x": 120.5, "y": -88.2, "pinned": true }
  ]
}
```

`nodes[].id` references the underlying entity (collection / group / tag / item). When the entity is deleted, the layout entry is silently dropped on next load (graceful — no migration required).

## Relationships

- **Owner:** Account (`account_id`).
- **Org context:** Organization (`organization_id`).
- **Scope target:** Space, Collection, or Org (depending on `scope_type`); resolved at app layer.
- **Sharable** read-only via the standard share model (`02-data-model/07-share.md`) with scope `mindmap_layout` (per `04-mindmap-view.md §7`).

## Invariants

1. `(account_id, scope_type, scope_id, is_default)` — at most one row with `is_default = true` per `(account_id, scope_type, scope_id)`. Partial unique index on `WHERE is_default = true`.
2. `scope_id` integrity is application-enforced (no FK), because `scope_type` selects the parent table dynamically.
3. `snapshot.version` is immutable per row; future schema migrations write a new row rather than rewrite an existing one.
4. Deleting a referenced entity (Collection, Space, Group, Tag) does NOT cascade-delete the layout — stale `nodes[].id` entries are filtered on read.
5. Entitlement gate: creating / updating requires `view.mindmap.access` per `15-visualization/readme.md §C10`.

## Indexes (recommended)

- `(account_id, scope_type, scope_id)` for the layout-picker list.
- Partial unique on `(account_id, scope_type, scope_id) WHERE is_default = true`.
- `(organization_id, deleted_at)` for org-wide cleanup jobs.

## Lifecycle

- **Create:** `POST /v1/mindmap-layouts` per `03-api-endpoints/23-mindmap-layouts.md`.
- **Update:** `PATCH /v1/mindmap-layouts/:id` (rename, toggle default, recapture positions).
- **Delete:** `DELETE /v1/mindmap-layouts/:id` — if the deleted row was `is_default = true`, the most recently `updated_at` sibling is promoted to default automatically (server-side).
- **Read:** `GET /v1/mindmap-layouts?scope_type=...&scope_id=...` returns metadata only; `GET /v1/mindmap-layouts/:id` returns the full `snapshot`.

## Events emitted

- `mindmap_layout.created`
- `mindmap_layout.updated` (per-field diff)
- `mindmap_layout.default_promoted` (server-side promotion after default deletion)
- `mindmap_layout.deleted`

## Cross-references

- API: `03-api-endpoints/23-mindmap-layouts.md`.
- Render contract: `15-visualization/04-mindmap-view.md §7` (Saved layouts), §10 (Export).
- Sharing: `02-data-model/07-share.md` (`mindmap_layout` scope).
- Entitlement: `15-visualization/readme.md §C10` (`view.mindmap.access`).
- Phase: `20-roadmap/04-phase-3-mindmap-ai.md`.
