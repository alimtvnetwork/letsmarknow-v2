# Entity: Space

## Purpose

A logical grouping inside an Organization — e.g. "My Collections", "Evatix", "Personal", "Gaming PC". Contains Collections. Sharable as a unit.

## Fields

| Name | Type | Null | Default | Validation | Description |
|---|---|---|---|---|---|
| Audit Block | — | — | — | — | see `README.md` |
| `organization_id` | uuid (Organization.id) | no | — | must exist | Parent organization. |
| `name` | string(120) | no | "New Space" | trim, non-empty | Display name. |
| `description` | text | yes | null | ≤ 4000 chars | Free-text description. |
| `notes` | text | yes | null | ≤ 8000 chars | Markdown-lite notes shown in space sidebar. |
| `icon` | string(40) | yes | null | from icon set | Optional icon name (e.g. `users`, `lock`, `gamepad`). |
| `color` | color | yes | null | — | Optional accent color override. |
| `position` | bigint | no | max(siblings)+1024 | — | Order within sidebar. |
| `is_starred` | bool | no | false | — | Pinned to top of sidebar for current Account (per-Account flag — see § Per-Account state). |
| `visibility` | enum(`private`\|`org`\|`shared`) | no | `org` | — | `private` = only members with explicit access; `org` = all Org members; `shared` = at least one active Share exists. |
| `default_view_mode` | enum(`list`\|`grid`\|`compact`\|`mindmap`\|`column`) | yes | inherits from Org | — | Per-space view preference. |
| `settings` | json | no | `{}` | — | Per-space prefs (e.g. `show_collection_count`, `collapsed_collections: [uuid,...]`). |

### Per-Account state

The `is_starred` flag and `collapsed_collections` are per-Account, not per-Space. The DB team should implement them via a side table `account_space_state(account_id, space_id, is_starred, collapsed_collections, last_viewed_at)`.

## Relationships

- **Parent:** Organization.
- **Children:** Collections (0..N), Shares (0..N).

## Invariants

1. `organization_id` immutable.
2. Cannot move a Space across Organizations (use export/import).
3. `position` unique-ish per `(organization_id)` — re-balanced periodically.
4. Soft-deleting a Space cascades to all Collections, Groups, Items.

## Indexes (recommended)

- `(organization_id, position)` for sidebar render
- `(organization_id, deleted_at)`
- **GIN on `search_tsv`** (generated column over `(name, description)`) for global / workspace search — definition lives in `14-search/06-search-engine.md` §2.2 (F-M17 reconciliation, 2026-04-19). Never written by application code.

## Lifecycle

- **Create:** by Editor+ in Org. New Spaces appear at the bottom of the sidebar.
- **Update:** any field except `id`, `organization_id`, `created_at`, `created_by`.
- **Move (reorder):** updates `position`. Emits `space.reordered`.
- **Soft-delete:** cascades. Recoverable for 30 days.
- **Hard-delete:** cascades.

## Events emitted

- `space.created`
- `space.updated`
- `space.reordered`
- `space.starred` / `space.unstarred`
- `space.collapsed` / `space.expanded`
- `space.soft_deleted`
- `space.restored`
- `space.hard_deleted`
- `space.shared` (when first Share created)
- `space.unshared` (when last Share revoked)

## Foreign keys

> See [`00-overview.md §4a`](./00-overview.md#4a-master-foreign-key-on-delete-table) for the canonical on-delete actions across the data model. Standard: all FKs `cascade` from Organization. No carve-outs.

## RLS

> Follows the per-entity template at [`templates/entity-rls.md`](./templates/entity-rls.md).

- enable row level security
- SELECT: (`has_role(auth.account_id(), 'viewer')` for `organization_id` AND (`Member.space_access = 'all'` OR `id = ANY(Member.space_ids)`)) OR `share_grants_access('space', id, auth.account_id())`. AND `deleted_at IS NULL`.
- INSERT: `has_role(auth.account_id(), 'editor')` for `organization_id`. WITH CHECK `organization_id` membership confirmed.
- UPDATE: `has_role(auth.account_id(), 'editor')` for `organization_id`. `organization_id` immutable (invariant 1).
- DELETE (soft): `editor`+. Hard-delete: `admin`+.
- Notes: per-Account state (`is_starred`, `collapsed_collections`) lives in `account_space_state` side table — that table is gated by `account_id = auth.account_id()` only.
