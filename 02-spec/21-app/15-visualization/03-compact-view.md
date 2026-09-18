# Compact View

Maximum information density. Single-line rows. For power users with thousands of items. Phase 0.

> Folder-wide rules in `readme.md` §C1–C13. This file owns only compact-specific spec.

---

## 1. Row anatomy

```
🔖 Title here · host.com · ai · research · 2d  ⭐
```

- 24 px row height.
- Single line, ellipsis on overflow.
- Favicon (12 px) · Title · `·` Host · `·` Tags (inline) · `·` Time · Star.
- No description, no preview, no checkbox by default.
- Hover: row tints (`bg-muted/50`) + checkbox slides in from left (24 px wide reveal).

## 2. When to use

- Triage mode (review 500 newly imported items quickly).
- Reference lookups.
- Power users.

## 3. Visual density

- 12 px font for body (`text-xs` per `06-ui-ux/01-design-tokens.md` §typography); 13 px for title.
- **Tabular alignment** (column mode):
  - Title (flex 1) | Host (160 px) | Tags (200 px) | Time (60 px).
  - Persisted at `collections.view_settings.compact_layout: "tabular" | "flow"`.
- **Flow mode**: free-flowing, no columns; default for screens < `lg` per `06-ui-ux/19-breakpoints.md` §3.

## 4. Selection & actions

- Click row → focus.
- Click row again → open URL in new tab.
- `Space` → toggle select; checkbox slides in.
- Right-click → context menu (per `06-ui-ux/03-component-library.md` ContextMenu).
- Bulk-action bar appears at top when ≥ 1 selected.
- Selection state: `readme.md` §C6.

## 5. Keyboard

Shortcuts registered in `06-ui-ux/08-keyboard-input.md` §3. Same as `01-list-view.md` §7, plus vim-style:

| Key | Action |
|---|---|
| `j` / `k` | Vim-style next/prev |
| `gg` | Jump to top (sequence; 500 ms timeout) |
| `G` | Jump to bottom |
| `/` | Focus filter input |
| `Ctrl+L` | Focus filter input (alt) |

Vim-key sequences require both keystrokes within 500 ms; otherwise treated as single keypresses.

## 6. Inline edit

- Double-click title → inline edit (no modal).
- Tab moves to tags field; Enter saves; Esc cancels.
- Optimistic per `12-history-undo/02-undo-redo.md` §5; reverts on server reject with toast `view.compact.edit_rejected`.
- Server: `PATCH /v1/items/{id}` per `03-api-endpoints/08-items.md`; emits `item.title.set` event per `12-history-undo/01-event-log.md` §4.

## 7. Filtering

- Filter bar always visible at top of list.
- Type to filter visible rows in real time (no server round-trip until 200 ms idle).
- After 200 ms idle: server-side query via `GET /v1/items?q=...&collection_id=...` per `03-api-endpoints/08-items.md`.
- `Ctrl+L` focuses filter; Esc clears.
- Filter operators (`tag:`, `domain:`, `is:starred`, etc.) auto-promoted to global search per `14-search/02-item-search.md` §2 — caret moves to global Cmd+K palette.

## 8. Performance

| Metric | Budget (p95) |
|---|---|
| Initial render (200 rows) | < 60 ms |
| Scroll FPS at 10k items | ≥ 60 |
| Filter typing latency | < 16 ms per keystroke |
| Memory at 20k items | < 200 MB |

Virtualized always; row height fixed → uses fixed-size virtualizer (faster than variable). Library: `@tanstack/react-virtual` (per `readme.md` §C7).

## 9. Mobile / small viewport

- Compact view collapses to list view automatically below `sm` breakpoint (640 px) per `06-ui-ux/19-breakpoints.md` §3.
- Setting: "Force compact on mobile" — persisted at `account.preferences.force_compact_mobile` (boolean). When true, no collapse; horizontal scroll engaged for tabular columns.
- Horizontal scroll on touch uses `scroll-snap-type: x mandatory`.

## 10. Telemetry

Namespace `view.compact.*`. Catalog in `18-analytics-telemetry/03-events.md`.

- `view.compact.opened` `{ item_count, mode: "tabular" | "flow", collection_id }`
- `view.compact.inline_edited` `{ field: "title" | "tag" }`
- `view.compact.bulk_selected` `{ count }`
- `view.compact.vim_sequence` `{ sequence: "gg" | "G" }` (sampled 5%)
- `view.compact.filter_promoted_to_search` `{ query_length }`

## 11. Edge cases

| Case | Behavior | Spec ref |
|---|---|---|
| Tag list overflows row | Truncate to first 2 + `+N`; full list on hover Tooltip | `06-ui-ux/03-component-library.md` |
| Title is empty | Show URL path; italic `--muted-foreground` | `02-data-model/05-item.md` |
| Same-second timestamps | Stable sort by `id` descending (UUIDv7 lexicographic) | `mem://index.md` Core (UUIDv7) |
| User pastes filter with operators | Parsed as global search query (auto-promote) | `14-search/02-item-search.md` |
| `gg` typed but second `g` arrives after 500 ms | Treated as single `g` (currently no-op); optional dev warning | §5 |
| Remote delete arrives mid-edit (P0: cross-tab `BroadcastChannel`; P2: cross-device realtime) | Edit cancelled; toast `view.compact.item_removed_remotely`; focus moves to next row | `readme.md` §C5 |

## 12. A11y

- Each row is `<div role="row">`; columns are `<div role="cell">` in tabular mode.
- Inline edit input: `role="textbox" aria-label={title}`.
- Vim shortcuts MUST also be reachable via standard keys (j/k = ↓/↑); see `06-ui-ux/08-keyboard-input.md` §6.
- Hit targets: per WCAG 2.1 AA `06-ui-ux/20-accessibility-wcag.md` §3, 24×24 px minimum even though row height is 24 px (overflow menu rendered as 32×32 absolutely-positioned button).
- Filter input has visible label or `aria-label="Filter items in this collection"`.

## 13. Copy strings used

- `view.compact.empty.headline`
- `view.compact.empty.sub`
- `view.compact.edit_rejected`
- `view.compact.item_removed_remotely`
- `view.compact.filter_placeholder`

## 14. Tests

- Vim-key sequence handling (`gg`, `G`, count prefixes deferred to P1).
- Inline edit save / revert.
- 20k item scroll performance against budget in §8.
- Filter typing without dropped frames (PerformanceObserver longtask < 50 ms).
- Auto-collapse to list view on viewport resize below `sm` breakpoint.
- Filter operator parser delegates to global search (same parser as `14-search/02-item-search.md`).
