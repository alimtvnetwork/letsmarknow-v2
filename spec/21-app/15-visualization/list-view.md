# List View

Default view mode. Dense, scannable, keyboard-friendly rows.

---

## 1. Row anatomy

```
┌─────────────────────────────────────────────────────────────────────┐
│ ☐ 🔖  Title of the saved item              ai · research  ⭐ 2d ⋯  │
│       host.com/path · note preview…                                 │
└─────────────────────────────────────────────────────────────────────┘
```

- Checkbox (multi-select) — appears on hover or when ≥ 1 row selected.
- Favicon (16 × 16) — lazy-loaded; falls back to letter avatar.
- Title — single line, ellipsis on overflow; bold weight.
- Tags — first 3 visible; `+N` chip for the rest.
- Star icon — toggle on click.
- Relative time (last opened or updated, whichever newer).
- `⋯` overflow menu.
- Subtitle line: host + first 80 chars of note (muted color).

## 2. Density

- **Comfortable** (default): 56 px row height, 8 px vertical padding.
- **Cozy**: 44 px.
- **Compact**: 32 px (auto-switches subtitle off).
- Switchable from view-options popover; persisted per Collection.

## 3. Columns (optional, Pro+)

User can enable extra columns:
- Created date
- Updated date
- Last opened
- Size (for files)
- Author (Team)
- Word count (for notes)

Drag column headers to reorder; right-click header for visibility menu.

## 4. Sorting

- Click column header to sort.
- Triple-state: ascending → descending → manual (drag-order).
- Sort indicator arrow on active column.
- Default: `updated_at desc`.

## 5. Grouping

- Optional: group by Tag, Date (Today / Yesterday / This Week / Older), Domain, Author.
- Group headers sticky on scroll.
- Collapse/expand per group; state persisted.

## 6. Selection

- Click row body → focus.
- Click checkbox or `Space` → toggle selection.
- `Shift+Click` → range select.
- `Cmd/Ctrl+A` → select all visible.
- Selected rows: 2 px primary-color left border + tinted background.

## 7. Keyboard

| Key | Action |
|---|---|
| ↑ / ↓ | Move focus |
| Space | Toggle selection |
| Enter | Open primary action |
| Cmd+Enter | Open in new tab |
| → | Expand row to inline preview |
| ← | Collapse preview |
| Delete | Move to Trash (with undo toast) |
| `e` | Edit title inline |
| `t` | Add tag (opens picker) |
| `s` | Toggle star |

## 8. Inline preview

- `→` or hover-dwell 400 ms expands a 200 px detail strip below the row.
- Shows full note, all tags, image preview if any, action buttons.
- `←` or Esc collapses.
- Only one preview open at a time.

## 9. Virtualization

- `react-window` (variable size) once item count > 200.
- Overscan 5 rows above + below viewport.
- Row heights cached by id.
- Scroll position preserved across navigation.

## 10. Empty state

See `06-ui-ux/empty-error-loading.md`. List view shows:
- Centered illustration.
- Headline + sub.
- Primary CTA: "Save your first link".
- Secondary: "Import from…".

## 11. Performance

| Metric | Budget (p95) |
|---|---|
| Initial render (50 rows) | < 80 ms |
| Scroll FPS at 5k items | ≥ 55 |
| Sort/filter re-render | < 100 ms |
| Image lazy-load p95 | < 300 ms after viewport entry |

## 12. Telemetry

- `view.list.opened` `{ density, item_count }`
- `view.list.density_changed`
- `view.list.column_toggled` `{ column }`
- `view.list.sort_changed` `{ column, direction }`
- `view.list.preview_opened`

## 13. Edge cases

| Case | Behavior |
|---|---|
| Item with no title | Show URL as title; muted style |
| Item with no favicon | Letter avatar from host name |
| 10k+ items | Virtualization mandatory; "showing N of M" footer |
| All items in one tag group | Group header still rendered |
| Sort + manual order conflict | Manual order disabled chip; click to re-enable |

## 14. Tests

- Keyboard navigation across 1k items.
- Selection persistence on sort change.
- Virtualization scroll integrity.
- Density switch preserves focus.
- Inline preview keyboard close.
