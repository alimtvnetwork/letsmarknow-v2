# Entity: NextItem

## Purpose

A row in an Account's **Next** queue. Wraps a reference to an Item (the
canonical saved Tab) with queue-specific state: done flag, completion
timestamp, source provenance, and per-Account ordering.

The parent container is the `Collection` of `kind = next` owned by the
Account (singleton — see `03-collection.md` Invariants 7–10 and
`07-features/17-next-queue.md`).

## Fields

| Name | Type | Null | Default | Validation | Description |
|---|---|---|---|---|---|
| Audit Block | — | — | — | — | see `README.md` |
| `account_id` | uuid (Account.id) | no | — | must exist | Owner of this Next row. Denormalized from the parent Next-Collection for query speed. |
| `next_collection_id` | uuid (Collection.id where `kind = next`) | no | — | must exist | The singleton Next-Collection for the Account. |
| `item_id` | uuid (Item.id) | yes | — | nullable iff `tombstone = true` | The Item being queued. Nullable only when the source Item was hard-purged and we kept a snapshot. |
| `done` | bool | no | false | — | Whether the user has checked this off. |
| `completed_at` | timestamptz | yes | null | non-null iff `done = true` | When the row flipped to done. Cleared when un-checked. |
| `position` | float8 | no | next-bottom | fractional indexing | Order within the queue. New rows get `max(position) + 1024.0` (or `min - 1024.0` if `next_insert_position = top`). Re-balanced periodically. |
| `source_kind` | enum(`collection`\|`browser_tab`\|`manual`\|`session`\|`bulk`) | no | — | locked enum | How the item entered Next. |
| `source_collection_id` | uuid (Collection.id) | yes | null | non-null iff `source_kind in (collection, bulk)` | The Collection the item was added from. Becomes a dangling pointer if the source Collection is deleted; UI ignores. |
| `tombstone` | bool | no | false | — | True when the source Item was hard-purged. Forces UI into degraded mode (snapshot fields used instead of Item lookup). |
| `tombstone_url` | string(2048) | yes | null | non-null iff `tombstone = true` | Last-known URL for opening. |
| `tombstone_title` | string(280) | yes | null | non-null iff `tombstone = true` | Last-known title for display. |
| `tombstone_favicon_url` | string(2048) | yes | null | — | Last-known favicon URL (best-effort). |
| `created_at` | timestamptz | no | now() | — | Add-time. Used for cross-device LWW conflict resolution (earliest add wins). |
| `updated_at` | timestamptz | no | now() | — | Bumped on every field change. Used for LWW on mutable fields (`done`, `position`). |

## Relationships

- **Parent:** Collection (where `kind = next`).
- **Owner:** Account.
- **Refers to:** Item (nullable when tombstoned).
- **Optional source:** Collection (the source the item came from).

## Invariants

1. `(account_id, item_id)` is unique where `done = false` AND `tombstone = false`.
   (No duplicate **open** entries for the same Item; duplicate-done is permitted
   to preserve completion history but the add path un-archives instead of
   inserting — see `07-features/17-next-queue.md §5`.)
2. `next_collection_id` MUST point to a Collection with `kind = next` whose
   `account_id` matches this row's `account_id`.
3. Each Account has **at most one** Collection with `kind = next`. Enforced by
   a partial unique index on `collection (account_id) WHERE kind = next`.
4. `completed_at` is non-null iff `done = true`. Toggling `done` from true → false
   MUST null `completed_at`.
5. `tombstone = true` requires `item_id IS NULL` AND all three `tombstone_*`
   fields non-null (URL, title, favicon may be missing only if not captured at
   tombstone time — favicon nullable, others required).
6. `source_collection_id` is non-null iff `source_kind ∈ {collection, bulk}`.
7. `position` is re-balanced periodically (same algorithm as `Item.position`).
8. Deleting an Item soft-deletes its NextItem rows; hard-purging an Item
   converts its NextItem rows to tombstones (does NOT delete them, so the user
   can still see what they had queued).

## Indexes (recommended)

- `(account_id, done, position)` — primary render order, with `done` filter.
- `(account_id, item_id) WHERE done = false AND tombstone = false` — partial
  unique for invariant 1.
- `(account_id, source_collection_id)` — "show me what I queued from this
  Collection" affordance.
- `(updated_at)` for sync-since cursor.

## Lifecycle

- **Create:** via any of E1–E8 in `07-features/17-next-queue.md §5`.
  Optimistically applied locally; sync envelope `next_item.created` pushed.
- **Update — `done` toggle:** flips `done`, sets/clears `completed_at`,
  bumps `updated_at`. Emits `next_item.completed` or `next_item.uncompleted`.
- **Update — reorder:** changes `position`, bumps `updated_at`. Emits
  `next_item.reordered`.
- **Delete (user-initiated):** hard-deletes the row with a 5-second client-side
  undo buffer. Emits `next_item.removed`.
- **Tombstone:** triggered by Item hard-purge. Server-side migration job copies
  Item snapshot fields onto the row, sets `item_id = null`, `tombstone = true`.
  Emits `next_item.tombstoned`.
- **Auto-archive:** if `account_setting.next_auto_archive_days` is set, a daily
  cron hard-deletes rows where `done = true AND completed_at < now() - interval`.
  Emits `next_item.auto_archived`.

## RLS

- `SELECT`/`UPDATE`/`DELETE`: only `account_id = auth.account_id()`.
- `INSERT`: only when `account_id = auth.account_id()` AND
  `next_collection_id` resolves to a Collection with `kind = next` AND
  `account_id = auth.account_id()`.
- No Org/Space role gates apply — Next is per-Account, not per-Org.

## Realtime

Mutations broadcast on channel `account:{account_id}:next` (W-4 curly-brace
convention). Payload shapes match `08-sharing-collab/14-realtime-transport.md`
broadcast envelope; event names: `next_item.created`, `next_item.completed`,
`next_item.uncompleted`, `next_item.reordered`, `next_item.removed`,
`next_item.tombstoned`, `next_item.auto_archived`.

## Cross-references

- Feature spec: `07-features/17-next-queue.md`.
- Parent entity: `03-collection.md` (Invariants 7–10 cover the `next` kind).
- Item entity: `05-item.md` (referenced by `item_id`).
- Settings: `11-account.md` (`account_setting.next_*` fields).
- Realtime: `08-sharing-collab/14-realtime-transport.md`.
