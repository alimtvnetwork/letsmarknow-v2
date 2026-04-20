# Tab Extend Column View

Vertical kanban-style columns. The signature view from Tab Extend, brought into LMN with parity + improvements. Phase 1.

> Folder-wide rules in `readme.md` §C1–C13. This file owns only column-specific spec.

---

## 1. Rationale

Many Tab Extend power users organize by **process**, not topic:
- "To Read" → "Reading" → "Read" → "Archived".
- "Inbox" → "Triage" → "Active" → "Done".

Columns make this explicit and dragable. Each column is a **Group within a Collection** (per `02-data-model/04-group.md`), or a virtual Group like "Untagged" / "All".

## 2. Structure

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Inbox       │ Reading     │ Done        │ Archive     │
│ (12)        │ (3)         │ (47)        │ (210)       │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ • Item A    │ • Item C    │ • Item E    │ ...         │
│ • Item B    │ • Item D    │ • Item F    │             │
│ ...         │ ...         │ ...         │             │
│             │             │             │             │
│ + Add       │ + Add       │ + Add       │             │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

- Columns map 1:1 to Groups within the current Collection.
- Each column scrolls independently.
- Column header: name, count, color dot, `⋯` menu (rename, color, sort, delete).
- Footer: `+ Add link` quick-input (URL paste-in or text).
- Card IDs are **UUIDv7** per `mem://index.md` Core rule (NOT ULID — corrected from earlier draft).

## 3. Card content per item

- Compact card (height 56–80 px depending on options):
  - Favicon + title (1–2 lines).
  - Host or tag chip.
  - Optional thumbnail (toggle per column).
- Expanded card (Pro+, entitlement `view.column.per_column_mode`): up to 200 px with note preview.

## 4. Drag and drop

Per `06-ui-ux/09-drag-and-drop.md`.

- Drag card between columns → moves item between Groups. Server: `PATCH /v1/items/{id}` with `{ group_id, position }` per `03-api-endpoints/08-items.md`.
- Drag column header → reorder columns within Collection. Server: `PATCH /v1/groups/{id}` with `{ position }`.
- Drag URL from browser → drop into column (creates new item via `POST /v1/items` per `03-api-endpoints/08-items.md`).
- Drag multiple selected cards (multi-select via Shift/Cmd-Click) → batch move via `POST /v1/bulk/items` per `07-features/10-bulk-operations.md`.
- Visual: column being dragged-into highlights with primary border + soft fill (`bg-primary/8`).
- Optimistic per `12-history-undo/02-undo-redo.md` §5; emits `item.moved` event per `12-history-undo/01-event-log.md` §4.

## 5. Column settings

Per-column options (stored on Group row at `groups.view_settings: jsonb`):

- **Name & color** (mutates `groups.name`, `groups.color`).
- **Sort**: manual (default) / newest / oldest / alpha. Stored at `groups.view_settings.sort`.
- **WIP limit** (Pro+, entitlement `view.column.wip_limit`) — cap at N items; warn when full. Stored at `groups.view_settings.wip_limit: number`.
- **View mode within column** (Pro+, entitlement `view.column.per_column_mode`): cards / list / compact. Default cards.
- **Auto-archive** (Pro+, entitlement `view.column.auto_archive`): items > N days old auto-move to "Archive" column. Stored at `groups.view_settings.auto_archive_days: number`.
  - Implemented as a cron job per `22-infrastructure/08-cron.md`: `auto_archive_columns` runs **daily at 02:30 UTC**. Translation to user TZ (Asia/KL = UTC+8) is presentation-layer only.
  - **Phase dependency (per sequencing audit S-3, 2026-04-19):** the cron pipeline is now an explicit **P1 deliverable** per `20-roadmap/02-phase-1-v1.md` §9 (added 2026-04-19). Auto-archive lights up at P1 alongside the rest of column view.
- **Show count**: on/off. Stored at `groups.view_settings.show_count: bool`. Default true.

## 6. Keyboard

| Key | Action |
|---|---|
| ↑ / ↓ | Move focus within column |
| ← / → | Move focus across columns |
| Enter | Open item URL in new tab |
| Cmd+→ / Ctrl+→ | Move selected card to next column |
| Cmd+← / Ctrl+← | Move selected card to previous column |
| `n` | New item in focused column |
| `c` | Add new column |
| Delete | Move card to Archive column (or Trash if Archive doesn't exist) |

All shortcuts registered in `06-ui-ux/08-keyboard-input.md` §3.

## 7. Mobile

- Columns horizontally swipeable (`scroll-snap-type: x mandatory`).
- Active column fully visible; adjacent columns peek 16 px.
- Long-press card → drag mode with bottom drop-target chips listing destination columns.
- "Compact" view (per `03-compact-view.md`) becomes the default per-column on screens below `md` breakpoint per `06-ui-ux/19-breakpoints.md` §3.

## 8. Add column

- Right-most "+ New column" tile.
- Modal: name, color, optional template (Default / Inbox / Done / Archive).
- Created as a Group under the current Collection via `POST /v1/groups` per `03-api-endpoints/07-groups.md`.

## 9. Performance

| Metric | Budget (p95) |
|---|---|
| Initial render (5 cols × 50 cards) | < 150 ms |
| Drag start latency | < 30 ms |
| Drop commit (server round-trip) | < 250 ms |
| Scroll within column at 500 cards | ≥ 55 fps |

Each column virtualized independently after 100 cards (per `readme.md` §C7).

## 10. Empty state

- Empty Collection in column view: 3 starter columns auto-created ("Inbox", "Active", "Done") with hint text inside each. Server creates the 3 Groups in a single transaction; emits 3 `group.created` events sharing one `correlation_id` per `12-history-undo/01-event-log.md` §6 (so user can undo as one action).
- User can dismiss starter set if undesired (deletes the 3 groups; emits 3 `group.deleted` events).

## 11. Telemetry

Namespace `view.column.*`. Catalog in `18-analytics-telemetry/03-events.md`.

- `view.column.opened` `{ collection_id, column_count }`
- `view.column.card_moved` `{ from_col, to_col, source: "drag" | "keyboard" | "bulk", item_count }`
- `view.column.column_added` `{ from_template: string | null }`
- `view.column.column_reordered` `{ from_position, to_position }`
- `view.column.wip_limit_hit` `{ group_id, limit }`
- `view.column.auto_archive_run` `{ moved_count, group_id }`

## 12. Realtime

> **Phase: P2 enhancement** (per sequencing audit S-4, 2026-04-19). Column view ships in **P1 with optimistic local-only mutations**; no realtime channel is required to function. Cross-tab invalidation in P1 uses `BroadcastChannel('lmn.collection.{collection_id}')` per `readme.md` §C5. The Supabase Realtime layer below lights up in **P2** alongside the rest of the realtime fleet (`20-roadmap/03-phase-2-collab.md` §4), gated behind feature flag `realtime.enabled` per `07-features/15-feature-flags-and-rollouts.md`.

**P2 behavior** — per `08-sharing-collab/14-realtime-transport.md` §2 (Supabase Realtime — locked transport):

- Subscribe to `collection:{collection_id}` channel.
- Inbound `item.moved` / `item.created` / `item.trashed` events update the local cache and animate cards in/out (250 ms ease-out).
- Inbound `group.created` / `group.deleted` events add/remove columns.
- Optimistic local mutations reconcile with server events per `12-history-undo/03-conflict-resolution.md` §3 (LWW for `position`).

## 13. Edge cases

| Case | Behavior | Spec ref |
|---|---|---|
| Drag card off all columns | Snap back to origin; no-op | `06-ui-ux/09-drag-and-drop.md` |
| Column has 10k cards | Virtualized; "Load more" auto-fires on scroll via cursor pagination | `03-api-endpoints/08-items.md` |
| Drag while offline | Optimistic move; queued in `pending_mutations`; reverts on server reject | `04-extension/10-sync-and-offline.md` |
| Two users drag same card simultaneously | Last-write-wins per `12-history-undo/03-conflict-resolution.md` §3; loser sees toast `view.column.move_overridden` |
| Collection has 0 Groups | Column view shows single "All" virtual column with hint; "Add column" CTA prominent | — |
| Column deletion with cards inside | Confirm modal: copy key `view.column.delete_with_cards`; options: "Move cards to <other column>" or "Delete all" | — |
| Free user sets WIP limit | UI hides field; if API called directly, server rejects with `BILLING_QUOTA_EXCEEDED` | `readme.md` §C10 |

## 14. Differences from Tab Extend

| Tab Extend | LMN |
|---|---|
| Columns are top-level | Columns are Groups within a Collection (clean hierarchy) |
| No WIP limits | Pro+ supports WIP limits |
| Manual sort only | Auto-sort options per column |
| No mobile parity | First-class mobile column view |
| No column templates | Starter templates + custom |
| Local-only sort state | Synced across devices via Supabase Realtime |

## 15. A11y

- Column container `<div role="region" aria-label={group.name}>`.
- Card list `<ul role="list">`; each card `<li role="listitem">` with focusable wrapper.
- Drag-and-drop has full keyboard equivalent: select card with Space, then Cmd+← / Cmd+→ to move (per §6).
- Screen reader announces moves: "Moved 'Title' to Done column".
- Per WCAG 2.1 AA `06-ui-ux/20-accessibility-wcag.md` §3, all hit targets ≥ 24×24 px.

## 16. Copy strings used

- `view.column.starter.inbox.name` / `.active.name` / `.done.name`
- `view.column.starter.hint`
- `view.column.delete_with_cards`
- `view.column.move_overridden`
- `view.column.wip_limit_hit_toast`
- `view.column.auto_archive_summary`
- `upgrade.modal.feature_locked` (shared)

## 17. Tests

- Drag-drop accuracy at varying scroll positions.
- Column reorder persistence (refresh and verify `groups.position` PATCH committed).
- Auto-archive cron correctness (UTC schedule per §5; test runs at simulated 02:30 UTC across DST boundaries).
- WIP limit enforcement + visual feedback (red dot on header at limit; orange at 80%).
- Mobile swipe-snap precision (column edges align to viewport edges within 1 px).
- Conflict resolution on simultaneous moves (per `12-history-undo/03-conflict-resolution.md` §3 LWW).
- Free user WIP limit attempt → server returns `BILLING_QUOTA_EXCEEDED`; client shows upsell.
- Realtime: simulate `collection:{id}` event for `item.moved` → card animates from old column to new within 500 ms.
