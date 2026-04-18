# Compact View

Maximum information density. Single-line rows. For power users with thousands of items.

---

## 1. Row anatomy

```
🔖 Title here · host.com · ai · research · 2d  ⭐
```

- 24 px row height.
- Single line, ellipsis on overflow.
- Favicon (12 px) · Title · `·` Host · `·` Tags (inline) · `·` Time · Star.
- No description, no preview, no checkbox by default.
- Hover: row tints + checkbox slides in from left.

## 2. When to use

- Triage mode (review 500 newly imported items quickly).
- Reference lookups.
- Power users.

## 3. Visual density

- 12 px font for body; 13 px for title.
- Tabular alignment optional (column mode):
  - Title (flex 1) | Host (160 px) | Tags (200 px) | Time (60 px).
- Switchable to "flow" mode: free-flowing, no columns.

## 4. Selection & actions

- Click row → focus.
- Click row again → open.
- `Space` → toggle select; checkbox slides in.
- Right-click → context menu.
- Bulk-action bar appears at top when ≥ 1 selected.

## 5. Keyboard

Same as list view, plus:
| Key | Action |
|---|---|
| `j` / `k` | Vim-style next/prev |
| `gg` | Jump to top |
| `G` | Jump to bottom |
| `/` | Focus filter input |

## 6. Inline edit

- Double-click title → inline edit (no modal).
- Tab moves to tags field; Enter saves; Esc cancels.
- Optimistic; reverts on server reject with toast.

## 7. Filtering

- Filter bar always visible at top of list.
- Type to filter visible rows in real time (no server round-trip until 200 ms idle).
- Ctrl+L focuses filter; Esc clears.

## 8. Performance

| Metric | Budget (p95) |
|---|---|
| Initial render (200 rows) | < 60 ms |
| Scroll FPS at 10k items | ≥ 60 |
| Filter typing latency | < 16 ms per keystroke |
| Memory at 20k items | < 200 MB |

Virtualized always; row height fixed → uses fixed-size virtualizer (faster than variable).

## 9. Mobile

- Compact view collapses to list view automatically below 640 px.
- Setting: "Force compact on mobile" for power users.

## 10. Telemetry

- `view.compact.opened` `{ item_count, mode: tabular | flow }`
- `view.compact.inline_edited` `{ field }`
- `view.compact.bulk_selected` `{ count }`

## 11. Edge cases

| Case | Behavior |
|---|---|
| Tag list overflows row | Truncate to first 2 + `+N`; full list on hover tooltip |
| Title is empty | Show URL path; italic muted |
| Same-second timestamps | Stable sort by id descending |
| User pastes filter with operators | Parsed as global search query (auto-promote) |

## 12. Tests

- Vim-key sequence handling (gg, G, count prefixes).
- Inline edit save / revert.
- 20k item scroll performance.
- Filter typing without dropped frames.
- Auto-collapse to list on mobile width.
