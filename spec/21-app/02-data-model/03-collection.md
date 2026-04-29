# Entity: Collection

## Purpose

The primary container of saved tabs inside a Space — e.g. "Marketing Improvements", "Quick Tools", "Atto Property". Has color, icon, tags, notes, description, star. Can contain Groups and/or Items at the same level. Sharable as a unit.

## Fields

| Name | Type | Null | Default | Validation | Description |
|---|---|---|---|---|---|
| Audit Block | — | — | — | — | see `README.md` |
| `space_id` | uuid (Space.id) | no | — | must exist | Parent space. |
| `organization_id` | uuid (Organization.id) | no | derived from space | denormalized for query speed | — |
| `kind` | enum(`manual`\|`session`\|`next`) | no | `manual` | locked enum | Discriminator. `manual` = user-built collection (default). `session` = snapshot created by Save Session — requires `captured_at` non-null and unlocks `Restore session` / `Restore in new window` / `Re-capture from current window` actions (SI-023, Save Session v1). `next` = the **per-Account singleton Next queue** — system-created, not user-creatable, not deletable, not shareable; lives outside the Space hierarchy with `space_id = null` (see Invariants 10–13 and `12-next-item.md`). |
| `account_id` | uuid (Account.id) | yes | null | non-null iff `kind = next` | Owner Account when this Collection is the singleton Next queue. Always null for `manual` and `session`. |
| `captured_at` | timestamptz | yes | null | non-null iff `kind=session` | Moment the browser-window snapshot was taken. Independent of `created_at` (re-capture updates only `captured_at`). |
| `source_window_id` | string(64) | yes | null | non-null only when `kind=session` AND captured locally; nullable after device change | Browser-supplied window identifier from the capturing client. Used to gate the `Re-capture from current window` action; cleared when the source window is no longer alive. |
| `name` | string(120) | no | "New Collection" | trim, non-empty | Display name. For `kind=session` default = `Window {n} — {Mon D, h:mm A}` (user locale + timezone), with ` (2)`, ` (3)`… on collision. |
| `description` | text | yes | null | ≤ 4000 chars | — |
| `notes` | text | yes | null | ≤ 8000 chars | Markdown-lite notes (Toby's "Add note" feature). |
| `color` | color | no | from palette | — | Card accent color (Toby's color picker). |
| `icon` | string(40) | yes | null | from icon set OR emoji | Optional icon (Tab Extend uses emojis like 🐤, 🦊). |
| `icon_emoji` | string(8) | yes | null | single emoji | Alternative to `icon`. |
| `position` | bigint | no | max(siblings)+1024 | — | Order within Space. |
| `is_starred` | bool | no | false | — | Per-Account, see Space.md note. |
| `starred_pin_position` | float8 | yes | null | non-null iff `is_starred=true` | Manual ordering within the parent Space's "⭐ Starred" pinned section (Toby parity, SI-021). Independent of `position`. Re-balanced like `position`. When unstarred, set to null. |
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
5. `starred_pin_position` is non-null iff `is_starred = true`. Toggling `is_starred` to `false` MUST null the pin position; toggling to `true` MUST assign `max(starred siblings)+1024` unless an explicit value is provided. (SI-021.)
6. Cascade soft/hard delete to Groups and Items.
7. `kind` is immutable after creation. A `manual` collection cannot be promoted to `session` and vice-versa. (SI-023.)
8. `captured_at` is non-null iff `kind = session`. Re-capture updates only `captured_at` and `items` (not `created_at`).
9. `source_window_id` may only be set when `kind = session`. Clearing it disables the `Re-capture from current window` action without affecting `Restore`.

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
- `collection.starred_pin_reordered` (within Space's "⭐ Starred" section, SI-021)
- `collection.tagged` / `collection.untagged`
- `collection.note_updated`
- `collection.shared` / `collection.unshared`
- `collection.soft_deleted`
- `collection.restored`
- `collection.hard_deleted`
- `collection.session_captured` (SI-023, emitted at create when `kind=session`)
- `collection.session_recaptured` (SI-023, `captured_at` and items replaced)
- `collection.session_restored` `{ scope: current_window | new_window, opened: int, skipped: int }`
