# Resizable Sections

Drag-handle splitters between sidebar / main / inspector / preview panes. Phase 0.

> Folder-wide rules in `readme.md` §C1–C13. This file owns only the resizable-pane spec.

---

## 1. Resizable regions

| Region | Min | Default | Max |
|---|---|---|---|
| Left sidebar (Collections tree) | 200 px | 280 px | 480 px |
| Main canvas | flex | flex | flex |
| Right inspector (item details) | 280 px | 360 px | 560 px |
| Bottom preview (inline) | 120 px | 240 px | 50% viewport |
| Mind-map legend overlay (per `04-mindmap-view.md`) | 160 px | 200 px | 320 px |

## 2. Drag handle

- 4 px wide hot zone (8 px hit area for accessibility — meets WCAG 2.1 AA §3 by extending invisible padding).
- On hover: cursor `col-resize` / `row-resize`; soft accent-color line appears (`bg-accent/40`).
- On drag: line becomes solid `bg-primary`; ghost guideline follows pointer.
- Released: pane snaps to new size; size persisted (per §3).

## 3. Persistence

Stored per Account, per surface (web vs extension new tab) — NOT per Collection (panes are app-shell, not view-mode).

- Field: `account.preferences.layout: jsonb` shaped `{ web: { sidebar: 280, inspector: 360, ... }, extension: { ... } }`.
- API: `PATCH /v1/account/preferences` per `03-api-endpoints/04-organizations.md` (account-scoped section).
- Synced across devices via realtime channel `account:{account_id}` per `08-sharing-collab/14-realtime-transport.md` §2.
- Reset via Settings → Layout → "Restore default sizes" (PATCH with `null` → server applies defaults from §1).

## 4. Constraints

- Resizing one region never pushes another below its min.
- If the viewport shrinks below total mins, **sidebar collapses first** (auto-collapse to icon-only at 60 px); then **inspector closes**.
- "Fit content" double-click on handle: pane resizes to natural content width (capped at max). Computes via `scrollWidth` of pane's first child.

## 5. Collapse / expand

- Each pane has a collapse toggle in its header.
- Collapsed sidebar: 60 px icon strip; tooltip on hover (Tooltip component per `06-ui-ux/03-component-library.md`).
- Collapsed inspector: hidden; toggle button on right edge of viewport.
- Animation: 180 ms `ease-out`; respects `prefers-reduced-motion` per `readme.md` §C8.

## 6. Keyboard

| Shortcut | Action |
|---|---|
| `[` | Toggle left sidebar |
| `]` | Toggle right inspector |
| `Cmd+\` / `Ctrl+\` | Toggle bottom preview |
| `Cmd+Shift+R` / `Ctrl+Shift+R` | Reset all panel sizes |

`Alt+drag` on a handle gives 1 px precision (default snap is 8 px to align with grid). All shortcuts registered in `06-ui-ux/08-keyboard-input.md` §3.

## 7. Touch / mobile

- Resizing **disabled** on screens below `lg` breakpoint (1024 px) per `06-ui-ux/19-breakpoints.md` §1.
- Below `lg`: panes become bottom-sheets / drawers (Sheet component per `06-ui-ux/03-component-library.md`).
- Sidebar swipe-from-edge to reveal (16 px edge zone).
- Inspector becomes modal sheet on item click.

## 8. Accessibility

- Drag handles have `role="separator"` `aria-orientation="vertical|horizontal"` `aria-valuenow={px}` `aria-valuemin={min}` `aria-valuemax={max}`.
- Keyboard: focus the handle → arrow keys resize ±10 px; Shift+arrow ±50 px; Home/End to min/max.
- Screen reader announces new size on release: "Sidebar 320 pixels".
- High-contrast theme (per `06-ui-ux/02-theming.md`): 2 px solid handle line always visible.
- WCAG 2.1 AA per `06-ui-ux/20-accessibility-wcag.md` §3 — 8 px hit zone meets 24×24 minimum target via expanded interactive area.

## 9. Performance

- Resize uses `requestAnimationFrame`; no layout thrash.
- Heavy children (mind-map per `04-mindmap-view.md`, virtualized lists per `01-list-view.md` §9) debounce relayout to drag-end (`pointerup`).
- During drag: ghost guideline only; child panes don't re-render (CSS `pointer-events: none` on child while dragging).
- Final size committed → single layout pass.

| Metric | Budget (p95) |
|---|---|
| Drag-handle pointermove → ghost render | < 8 ms |
| Drag-end → final layout settled | < 50 ms |
| Persistence PATCH round-trip | < 250 ms |

## 10. Persistence sync

- Local change: write `localStorage["lmn.layout"]` immediately (zero-latency local UI).
- Debounced 2 s → sync to `account.preferences.layout` via `PATCH /v1/account/preferences`.
- Cross-device: subscribed via realtime channel `account:{account_id}` per `08-sharing-collab/14-realtime-transport.md`; remote changes apply with subtle 200 ms tween (respects reduced-motion).
- Conflict (two devices write at once): per `12-history-undo/03-conflict-resolution.md` §3, LWW by server timestamp on the JSONB blob — no field-level merge (single value).

## 11. Telemetry

Namespace `layout.*`. Catalog in `18-analytics-telemetry/03-events.md`.

- `layout.resized` `{ region, from_px, to_px }`
- `layout.collapsed` `{ region }`
- `layout.expanded` `{ region }`
- `layout.reset`
- `layout.auto_collapsed_due_to_viewport` `{ region }`

## 12. Edge cases

| Case | Behavior | Spec ref |
|---|---|---|
| Saved size exceeds current viewport | Clamped to max on load; not overwritten until user drags | §4 |
| Two devices write conflicting sizes | Last-write-wins; no merge needed (single value) | §10 + `12-history-undo/03-conflict-resolution.md` §3 |
| Drag onto pane edge then release outside window | Treat as `pointercancel`; revert to pre-drag size | — |
| Pane content overflows after resize | Internal scroll engages; no horizontal page scroll | — |
| Drag while heavy mind-map renders | Debounce mind-map relayout to drag-end (per §9) | `04-mindmap-view.md` §4 |
| Realtime layout update arrives mid-drag | Buffered; applied after user releases pointer | §10 |
| Server returns `403 FORBIDDEN` on PATCH (rare; account suspended) | Local change kept; toast copy-key `layout.sync_failed`; retry on next change | `03-api-endpoints/18-error-codes.md` |

## 13. Copy strings used

- `layout.sidebar_collapsed_aria`
- `layout.inspector_collapsed_aria`
- `layout.reset_confirm`
- `layout.sync_failed`
- `layout.size_announcement` (template: `"{region} {size} pixels"`)

## 14. Tests

- Drag precision at 1 px, 10 px, 100 px deltas.
- Min/max constraints across viewport sizes (`xs`–`3xl` per `06-ui-ux/19-breakpoints.md`).
- Persistence write debounce timing (200 changes in 2 s → exactly 1 PATCH).
- Cross-device sync round-trip via simulated `account:{account_id}` realtime event.
- Reduced-motion behavior (no tween on apply).
- Keyboard resize accuracy (10 / 50 / Home / End).
- Collapse animation correctness (no layout shift in surrounding panes).
- Touch device below `lg` → handles invisible; pane gestures swap to drawer pattern.
