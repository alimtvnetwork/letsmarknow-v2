# Entity: Tag

## Purpose

A short, color-coded label that can be attached to **three entity types — Collection, Group, and Item** — within an Organization. Powers filtering and search. Tag attachment is stored as `tag_ids[]` on each attachable entity (see `03-collection.md`, `04-group.md`, `05-item.md`); there is no separate join table.

## Fields

| Name | Type | Null | Default | Validation | Description |
|---|---|---|---|---|---|
| `id` | uuid | no | — | — | UUIDv7. |
| `organization_id` | uuid (Organization.id) | no | — | — | Tags are scoped to Org. |
| `name` | string(40) | no | — | trim, non-empty, lowercased on write | Tag text. |
| `color` | color | no | from palette | — | Pill background color. |
| `created_at` | timestamp | no | — | — | — |
| `created_by` | uuid (Account.id) | no | — | — | — |
| `usage_count_cache` | int | no | 0 | — | Number of entities currently using this tag. Maintained by service layer. |

> Tags do NOT have soft-delete (no `deleted_at`) and do NOT track `updated_at`. Renames mutate `name` in place; the rename is observable via the `tag.renamed` event in the audit log. This is an intentional design decision — Tags are lightweight labels, not first-class soft-deletable entities.
>
> Deleting a Tag removes it from all `tag_ids[]` arrays atomically.

## Invariants

1. `(organization_id, name)` unique. Duplicate names rejected client-side and server-side.
2. `name` is canonical lowercase. UI may display title-case but storage is lowercase.
3. Cannot move tag across Organizations.
4. Maximum 1000 distinct tags per Organization (hard limit).

## Indexes (recommended)

- `(organization_id, name)` unique
- `(organization_id, usage_count_cache DESC)` for tag-cloud display

## Lifecycle

- **Create:** implicit when user types a new tag in the inline tag editor on any entity, OR explicit via Tag Manager.
- **Rename:** updates `name`; reflected everywhere via reference (no array updates needed).
- **Delete:** removes from all referencing entities atomically. Confirms with user when `usage_count_cache > 0`.
- **Merge:** "Merge tag A into tag B" → updates all references, deletes A.

## Events emitted

- `tag.created`
- `tag.renamed`
- `tag.color_changed`
- `tag.deleted`
- `tag.merged` (from → into)
