# Entity: Collection

## Purpose

The primary container of saved tabs inside a Space — e.g. "Marketing Improvements", "Quick Tools", "Atto Property". Has color, icon, tags, notes, description, star. Can contain Groups and/or Items at the same level. Sharable as a unit.

## Fields

| Name | Type | Null | Default | Validation | Description |
|---|---|---|---|---|---|
| Audit Block | — | — | — | — | see `README.md` |
| `space_id` | uuid (Space.id) | no | — | must exist | Parent space. |
| `organization_id` | uuid (Organization.id) | no | derived from space | denormalized for query speed | — |
| `name` | string(120) | no | "New Collection" | trim, non-empty | Display name. |
| `description` | text | yes | null | ≤ 4000 chars | — |
| `notes` | text | yes | null | ≤ 8000 chars | Markdown-lite notes (Toby's "Add note" feature). |
| `color` | color | no | from palette | — | Card accent color (Toby's color picker). |
| `icon` | string(40) | yes | null | from icon set OR emoji | Optional icon (Tab Extend uses emojis like 🐤, 🦊). |
| `icon_emoji` | string(8) | yes | null | single emoji | Alternative to `icon`. |
| `position` | bigint | no | max(siblings)+1024 | — | Order within Space. |
| `is_starred` | bool | no | false | — | Per-Account, see Space.md note. |
| `is_collapsed_by_default` | bool | no | false | — | Whether to render collapsed initially (Toby's collapse arrow). |
| `tag_ids` | array<uuid> | no | `[]` | ≤ 32, all in same Org | Tags attached. |
| `default_view_mode` | enum(`list`\|`grid`\|`compact`) | yes | inherits | — | Per-collection view override. |
| `item_count_cache` | int | no | 0 | computed | Number of non-deleted Items inside (direct + via Groups). Maintained by service layer. |
| `group_count_cache` | int | no | 0 | computed | Number of non-deleted Groups inside. |

## Relationships

- **Parent:** Space.
- **Children:** Groups (0..N), Items (0..N direct), Shares (0..N).
- **Cross-refs:** `tag_ids[]` → Tag.

## Invariants

1. `space_id` mutable only via "Move to Space" action; `organization_id` recomputed.
2. Moving across Organizations is forbidden (export/import only).
3. `tag_ids` must all belong to same `organization_id`.
4. `position` re-balanced periodically.
5. Cascade soft/hard delete to Groups and Items.

## Indexes (recommended)

- `(space_id, position)` for render
- `(organization_id, deleted_at)`
- GIN index on `tag_ids` for tag filter
- Full-text index on `(name, description, notes)` for search

## Lifecycle

- **Create:** by Editor+. Either via "+ Add Collection" button (Toby flow: name input + color picker + Save/Cancel) or via "Save Session to Collection".
- **Update:** any mutable field. Emits granular events.
- **Move:** updates `space_id` (and denormalized `organization_id` if same Org — cross-org move forbidden).
- **Duplicate:** server creates new Collection with same fields except `id`, `name` becomes `"<name> copy"`, position=end. Children (Groups, Items) deep-copied. Shares NOT duplicated.
- **Soft-delete:** cascade.

## Events emitted

- `collection.created`
- `collection.updated` (per-field diff)
- `collection.moved` (space change)
- `collection.reordered`
- `collection.duplicated`
- `collection.color_changed`
- `collection.icon_changed`
- `collection.starred` / `collection.unstarred`
- `collection.tagged` / `collection.untagged`
- `collection.note_updated`
- `collection.shared` / `collection.unshared`
- `collection.soft_deleted`
- `collection.restored`
- `collection.hard_deleted`
