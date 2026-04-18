# Resizable Sections

Drag-handle splitters between sidebar / main / inspector / preview panes.

---

## 1. Resizable regions

| Region | Min | Default | Max |
|---|---|---|---|
| Left sidebar (Collections tree) | 200 px | 280 px | 480 px |
| Main canvas | flex | flex | flex |
| Right inspector (item details) | 280 px | 360 px | 560 px |
| Bottom preview (inline) | 120 px | 240 px | 50% viewport |
| Mind-map legend overlay | 160 px | 200 px | 320 px |

## 2. Drag handle

- 4 px wide hot zone (8 px hit area for accessibility).
- On hover: cursor `col-resize` / `row-resize`; soft accent-color line appears.
- On drag: line becomes solid primary; ghost guideline follows pointer.
- Released: pane snaps to new size; size persisted.

## 3. Persistence

- Per Account, per surface (web vs extension new tab).
- Stored as `{ region: px }` map in `account.preferences`.
- Synced across devices.
- Reset via Settings → Layout → "Restore default sizes".

## 4. Constraints

- Resizing one region never pushes another below its min.
- If the viewport shrinks below total mins, sidebar collapses first (auto-collapse to icon-only at 60 px); then inspector closes.
- "Fit content" double-click on handle: pane resizes to natural content width (capped at max).

## 5. Collapse / expand

- Each pane has a collapse toggle in its header.
- Collapsed sidebar: 60 px icon strip; tooltip on hover.
- Collapsed inspector: hidden; toggle button on right edge.
- Animation: 180 ms ease; respects reduced-motion.

## 6. Keyboard

| Shortcut | Action |
|---|---|
| `[` | Toggle left sidebar |
| `]` | Toggle right inspector |
| `Cmd+\` | Toggle bottom preview |
| `Cmd+Shift+R` | Reset all panel sizes |

Alt+drag on a handle gives 1 px precision.

## 7. Touch / mobile

- Resizing disabled on screens < 1024 px.
- Panes become bottom-sheets / drawers.
- Sidebar swipe-from-edge to reveal.
- Inspector becomes modal sheet.

## 8. Accessibility

- Drag handles have `role="separator"` `aria-orientation` `aria-valuenow` `aria-valuemin` `aria-valuemax`.
- Keyboard: focus the handle → arrow keys resize ±10 px; Shift+arrow ±50 px; Home/End to min/max.
- Screen reader announces new size.
- High-contrast theme: 2 px solid handle line always visible.

## 9. Performance

- Resize uses `requestAnimationFrame`; no layout thrash.
- Heavy children (mind-map, virtualized list) debounce relayout to drag-end (`pointerup`).
- During drag: ghost guideline only; child panes don't re-render.
- Final size committed → single layout pass.

## 10. Persistence sync

- Local change: write `localStorage.layout` immediately.
- Debounced 2 s → sync to `account.preferences` via `PATCH /v1/account/preferences`.
- Cross-device: subscribed via realtime channel; remote changes apply with subtle 200 ms tween.

## 11. Telemetry

- `layout.resized` `{ region, from_px, to_px }`
- `layout.collapsed` `{ region }`
- `layout.expanded` `{ region }`
- `layout.reset`
- `layout.auto_collapsed_due_to_viewport` `{ region }`

## 12. Edge cases

| Case | Behavior |
|---|---|
| Saved size exceeds current viewport | Clamped to max on load; not overwritten until user drags |
| Two devices write conflicting sizes | Last-write-wins; no merge needed (single value) |
| Drag onto pane edge then release outside window | Treat as `pointercancel`; revert to pre-drag size |
| Pane content overflows after resize | Internal scroll engages; no horizontal page scroll |
| Drag while heavy mind-map renders | Debounce mind-map relayout to drag-end |

## 13. Tests

- Drag precision at 1 px, 10 px, 100 px deltas.
- Min/max constraints across viewport sizes.
- Persistence write debounce timing.
- Cross-device sync round-trip.
- Reduced-motion behavior.
- Keyboard resize accuracy.
- Collapse animation correctness.
