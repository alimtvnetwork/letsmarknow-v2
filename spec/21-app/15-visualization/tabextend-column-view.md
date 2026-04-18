# Tab Extend Column View

Vertical kanban-style columns. The signature view from Tab Extend, brought into LMN with parity + improvements.

---

## 1. Rationale

Many Tab Extend power users organize by **process**, not topic:
- "To Read" → "Reading" → "Read" → "Archived".
- "Inbox" → "Triage" → "Active" → "Done".

Columns make this explicit and dragable. Each column is a Group within a Collection (or a virtual Group like "Untagged").

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

## 3. Card content per item

- Compact card (height 56-80 px depending on options):
  - Favicon + title (1-2 lines).
  - Host or tag chip.
  - Optional thumbnail (toggle per column).
- Expanded card (Pro+): up to 200 px with note preview.

## 4. Drag and drop

- Drag card between columns → moves item between Groups (server: `PATCH /v1/items/{id}` with `group_id`).
- Drag column header → reorder columns within Collection.
- Drag URL from browser → drop into column (creates new item).
- Drag multiple selected cards (multi-select via Shift/Cmd-Click) → batch move.
- Visual: column being dragged-into highlights with primary border + soft fill.

## 5. Column settings

Per-column options:
- **Name & color**.
- **Sort**: manual (default) / newest / oldest / alpha.
- **Limit**: WIP limit (Pro+) — cap at N items; warn when full.
- **View mode within column**: cards / list / compact.
- **Auto-archive**: items > N days old auto-move to "Archive" column.
- **Show count**: on/off.

## 6. Keyboard

| Key | Action |
|---|---|
| ↑ / ↓ | Move focus within column |
| ← / → | Move focus across columns |
| Enter | Open item |
| Cmd+→ | Move selected card to next column |
| Cmd+← | Move selected card to previous column |
| `n` | New item in focused column |
| `c` | Add new column |
| Delete | Move card to Archive (or Trash if Archive doesn't exist) |

## 7. Mobile

- Columns horizontally swipeable (snap-scroll).
- Active column fully visible; adjacent columns peek 16 px.
- Long-press card → drag mode with bottom drop-target chips.
- "Compact" view becomes the default per-column on mobile.

## 8. Add column

- Right-most "+ New column" tile.
- Modal: name, color, optional template (Default / Inbox / Done / Archive).
- Created as a Group under the current Collection.

## 9. Performance

| Metric | Budget (p95) |
|---|---|
| Initial render (5 cols × 50 cards) | < 150 ms |
| Drag start latency | < 30 ms |
| Drop commit (server round-trip) | < 250 ms |
| Scroll within column at 500 cards | ≥ 55 fps |

Each column virtualized independently after 100 cards.

## 10. Empty state

- Empty Collection in column view: 3 starter columns auto-created ("Inbox", "Active", "Done") with hint text inside each.
- User can dismiss starter set if undesired.

## 11. Telemetry

- `view.column.opened` `{ collection_id, column_count }`
- `view.column.card_moved` `{ from_col, to_col, source: drag | keyboard }`
- `view.column.column_added`
- `view.column.column_reordered`
- `view.column.wip_limit_hit`
- `view.column.auto_archive_run` `{ moved_count }`

## 12. Edge cases

| Case | Behavior |
|---|---|
| Drag card off all columns | Snap back to origin; no-op |
| Column has 10k cards | Virtualized; "Load more" auto-fires on scroll |
| Drag while offline | Optimistic move; queued; reverts on server reject |
| Two users drag same card simultaneously | Last-write-wins per `12-history-undo/conflict-resolution.md` |
| Collection has 0 Groups | Column view shows single "All" virtual column with hint to add real ones |
| Column deletion with cards inside | Confirm: "Move cards to <other column> or delete?" |

## 13. Differences from Tab Extend

| Tab Extend | LMN |
|---|---|
| Columns are top-level | Columns are Groups within a Collection (clean hierarchy) |
| No WIP limits | Pro+ supports WIP limits |
| Manual sort only | Auto-sort options per column |
| No mobile parity | First-class mobile column view |
| No column templates | Starter templates + custom |
| Local-only sort state | Synced across devices |

## 14. Tests

- Drag-drop accuracy at varying scroll positions.
- Column reorder persistence.
- Auto-archive cron correctness (timezone-aware).
- WIP limit enforcement + visual feedback.
- Mobile swipe-snap precision.
- Conflict resolution on simultaneous moves.
