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

## RLS

> Follows the per-entity template at [`templates/entity-rls.md`](./templates/entity-rls.md). Tags are Org-scoped lightweight labels with no soft-delete (see file header).

- enable row level security
- SELECT: `has_role(auth.account_id(), 'viewer')` for `organization_id`.
- INSERT: `has_role(auth.account_id(), 'editor')` for `organization_id`. (Implicit-create from inline tag editor uses the same predicate.) WITH CHECK uniqueness on `(organization_id, lower(name))` enforced via unique index, not RLS.
- UPDATE (rename, color change): `editor`+ on Org.
- DELETE: `admin`+ on Org (because deletion mutates `tag_ids[]` arrays across many entities atomically and is destructive).
- Notes: no `deleted_at` column → no soft-delete predicate. The 1000-tags-per-Org cap (invariant 4) is enforced by trigger, not RLS.
