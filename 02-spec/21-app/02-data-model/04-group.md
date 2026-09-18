# Entity: Group

## Purpose

Optional sub-container inside a Collection (Tab Extend's "group inside group"). Same capabilities as a Collection except cannot contain another Group (max 1 level of nesting in v1). Sharable as a unit.

> ⚠️ Schema reserves `parent_group_id` for future v2 deeper nesting, but v1 service layer MUST reject any non-null value.

## Fields

| Name | Type | Null | Default | Validation | Description |
|---|---|---|---|---|---|
| Audit Block | — | — | — | — | — |
| `collection_id` | uuid (Collection.id) | no | — | must exist | Parent collection. |
| `space_id` | uuid (Space.id) | no | derived | denormalized | — |
| `organization_id` | uuid (Organization.id) | no | derived | denormalized | — |
| `parent_group_id` | uuid (Group.id) | yes | null | **MUST be null in v1** | Reserved for v2. |
| `name` | string(120) | no | "New Group" | trim, non-empty | — |
| `description` | text | yes | null | ≤ 4000 chars | — |
| `notes` | text | yes | null | ≤ 8000 chars | — |
| `color` | color | yes | null | — | Optional accent. |
| `icon` | string(40) | yes | null | from icon set | — |
| `icon_emoji` | string(8) | yes | null | single emoji | — |
| `position` | bigint | no | max(siblings)+1024 | — | Order within Collection. |
| `is_starred` | bool | no | false | — | Per-Account. |
| `is_collapsed_by_default` | bool | no | false | — | Tab Extend's collapse arrow. |
| `is_hidden` | bool | no | false | — | Tab Extend has an "eye-off" toggle to hide a group from the column view. |
| `tag_ids` | array<uuid> | no | `[]` | ≤ 32 | — |
| `view_mode` | enum(`list`\|`grid`\|`compact`) | no | `compact` | — | Default `compact` because Tab Extend renders groups as favicon grids. |
| `item_count_cache` | int | no | 0 | — | Maintained. |

## Relationships

- **Parent:** Collection.
- **Children:** Items (0..N), Shares (0..N).

## Invariants

1. `collection_id` mutable via "Move to Collection" within same Space (or cross-Space within same Org).
2. `parent_group_id` rejected if non-null in v1.
3. `tag_ids` must all belong to same Org.
4. Cascade soft/hard delete to Items.

## Indexes (recommended)

- `(collection_id, position)`
- `(organization_id, deleted_at)`
- GIN on `tag_ids`
- **GIN on `search_tsv`** (generated column over `(name, description, notes)`) for global / workspace search — definition lives in `14-search/06-search-engine.md` §2.2 (F-M17 reconciliation, 2026-04-19). Supersedes legacy "Full-text on `(name, description, notes)`". Never written by application code.

## Lifecycle

- **Create:** by Editor+. Either via "+ Add Group" inside Collection or by promoting a multi-select of Items.
- **Update / Move / Duplicate / Soft-delete:** parallel to Collection.
- **Open all:** non-mutating action — opens every Item's URL in new tabs in current window (default) or new window (modifier).

## Events emitted

- `group.created`
- `group.updated`
- `group.moved`
- `group.reordered`
- `group.duplicated`
- `group.hidden` / `group.unhidden`
- `group.color_changed` / `group.icon_changed`
- `group.starred` / `group.unstarred`
- `group.tagged` / `group.untagged`
- `group.note_updated`
- `group.shared` / `group.unshared`
- `group.opened_all` (non-mutating, recorded for analytics only — not in Undo)
- `group.soft_deleted`
- `group.restored`
- `group.hard_deleted`

## Permissions

> Role × action mapping for this entity lives in [`08-sharing-collab/05-permissions-matrix.md`](../08-sharing-collab/05-permissions-matrix.md) (search anchor: `group`). RLS policies in §RLS below translate that matrix into row-level predicates via `has_role()`; do not duplicate the matrix here.

## Foreign keys

> See [`00-overview.md §4a`](./00-overview.md#4a-master-foreign-key-on-delete-table) for the canonical on-delete actions across the data model. Standard: all FKs `cascade` (`collection_id`, `space_id`, `organization_id`, `parent_group_id`).

## RLS

> Follows the per-entity template at [`templates/entity-rls.md`](./templates/entity-rls.md).

- enable row level security
- SELECT: parent-Collection access (see `03-collection.md §RLS`) OR `share_grants_access('group', id, auth.account_id())`. AND `deleted_at IS NULL`.
- INSERT: `has_role(auth.account_id(), 'editor')` for `organization_id` AND parent-Collection access. WITH CHECK `parent_group_id IS NULL` (v1 single-level nesting per invariant 2).
- UPDATE: `editor`+ on Org. `collection_id` change allowed only when target Collection is in same Org (invariant 1).
- DELETE: soft = `editor`+; hard = `admin`+.
- Notes: `is_hidden` (eye-off) is a presentation flag — never used to gate RLS reads.
