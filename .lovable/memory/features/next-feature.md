---
name: Next feature
description: Per-Account global to-do queue. Modeled as Collection of kind=next (singleton, system-managed). NextItem join row carries done/completed_at/position/source_kind. Realtime on account:{account_id}:next.
type: feature
---

# Next feature — locked decisions

**Source spec:** `spec/21-app/07-features/17-next-queue.md`
**Data model:** `spec/21-app/02-data-model/12-next-item.md` + `03-collection.md` (kind enum + Invariants 10–13)
**UI:** `spec/21-app/04-extension/04-popup.md §14` (popup body region)
**Glossary:** `spec/21-app/00-overview/02-glossary.md` "Next" section
**Linter:** `scripts/lint/next-singleton-invariants.ts`

## Locked invariants (do not re-debate)

1. **Scope: per-Account, global.** One Next per human user. Spans all Orgs and Spaces. NOT per-Org, NOT per-Space, NOT per-Workspace.
2. **Model: Collection kind=`next` singleton.** Adds the third value to the locked `kind` enum (`manual|session|next`). Reuses Item/share/history/search/RLS infra. `space_id IS NULL`, `organization_id IS NULL`, `account_id` non-null. Partial unique index `(account_id) WHERE kind = next` enforces singleton.
3. **Done state lives on the join row** (`next_item.done`, `next_item.completed_at`). Same Item in a regular Collection retains un-done appearance.
4. **Source provenance:** `source_kind` enum locked to 5 values: `collection`, `browser_tab`, `manual`, `session`, `bulk`. Optional `source_collection_id` (nullable; can become dangling — UI ignores).
5. **Hard-purge of source Item ⇒ tombstone**, not delete. Stores `tombstone_url`, `tombstone_title`, `tombstone_favicon_url` for continued openability.
6. **Realtime channel:** `account:{account_id}:next` (W-4 curly-brace form). LWW conflict resolution per row on `updated_at`.
7. **Idempotency:** duplicate-open URL → no-op. Duplicate-done URL → un-archives existing row, never duplicates.
8. **UI verb is "Add to Next"** verbatim. Forbidden synonyms: "Add to To-do", "Save for later", "Bookmark for Next", "Add to Toby Next".
9. **Limits:** soft cap 500 items, hard cap 2000, virtualize above 100.
10. **Out of scope v1:** sharing Next, sub-tasks, recurring items, AI prioritization, per-Org Next.

## Why these decisions (so future sessions can re-derive if needed)

- Per-Account chosen over per-Workspace/per-Org because Toby's "Next" is intuitively user-personal; Org-scoping would force users to maintain N parallel queues.
- Collection-kind chosen over sibling primitive because it adds 1 enum value and reuses ~7 existing surfaces (RLS, sharing, history, search, import/export, virtualized list, hover toolbar) instead of duplicating them.
- Done on join row chosen over Item field because Item belongs to a Collection's library context — coupling done state would leak Next semantics into Collection display.
