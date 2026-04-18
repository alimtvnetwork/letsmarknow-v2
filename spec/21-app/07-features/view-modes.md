# View Modes

Four ways to render Items in a Collection / Space / Search.

---

## 1. Modes

| Mode | Best for | Density |
|---|---|---|
| `grid` | Visual browsing (default) | Comfortable |
| `list` | Reading-heavy users | Cozy |
| `compact` | Power users / large sets | Compact |
| `column` | Kanban-style overviews / Space rollup | Cozy |

## 2. Selection

- Per-Collection preferred mode persisted in `collection.default_view`.
- Per-route override via `?view=`.
- Per-Account default in `prefs.default_view`.
- View-mode switcher in Collection header always visible.
- Keyboard `1` / `2` / `3` / `4` switches modes when card focused.

## 3. Visual specs

### 3.1 Grid
- Card 220×180 px (default), responsive `repeat(auto-fill, minmax(220px, 1fr))`.
- Thumbnail 220×140 (16:11) with favicon overlay.
- Title 2-line clamp.
- Tags row (chips, max 3 visible + "+N").
- Footer micro-row: domain · saved-ago · star.

### 3.2 List
- Row 64 px tall.
- Layout: favicon · title (1 line, truncate) · domain · tags · ⋯ menu.
- Description preview as second line if present.
- Hover row reveals quick actions on right.

### 3.3 Compact
- Row 28 px tall (Compact density).
- Layout: favicon · title (truncate) · tags inline · domain right-aligned.
- No description.
- High-density power view; great for keyboard navigation.

### 3.4 Column
- Horizontal scroll; columns 280 px wide.
- Each Group is a column header.
- Items as small grid cards inside.
- Drag items between columns = reassign Group.
- "+ Group" column at the right end.

## 4. Behavior parity

All modes support:
- Multi-select.
- Drag-and-drop.
- Hover-to-jump.
- Right-click context menu.
- Keyboard nav (`j/k`, `h/l`).
- Bulk action bar.
- Filters (tag chips + search).

## 5. Performance

- Virtualization at > 100 visible items in any mode (TanStack Virtual).
- Image lazy-load (`loading="lazy"`, `decoding="async"`).
- Skeletons match the active mode's row/card shape.

## 6. Empty per mode

Empty state composition (illustration + headline + CTA) is identical regardless of mode.

## 7. Switcher UI

`<ViewModeSwitch>` component:
- Pills with icons (Grid, List, Compact, Column).
- Tooltip on hover with name.
- Persists choice immediately.

## 8. Entitlements

All view modes available on every plan.

## 9. Telemetry

- `view_mode.changed` `{ from, to, surface }`
- `view_mode.column_drag_between` `{ same_collection: bool }`

## 10. Edge cases

| Case | Behavior |
|---|---|
| Switch mode while items selected | Selection preserved |
| Mode change while modal open | Modal stays; mode applies behind |
| Column mode with no Groups | Single column "(no group)" with all items |
| Compact mode on touch | Density bumped to Cozy automatically |
