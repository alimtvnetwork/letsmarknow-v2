# Drag & Drop

Cards, sidebar tree, file uploads — one consistent grammar.

---

## 1. Library

`@dnd-kit/core` + `@dnd-kit/sortable` for in-app DnD. Native HTML5 drag for file drops only (cross-window).

## 2. Draggable surfaces

| Source | Target | Action |
|---|---|---|
| Item card | Other item card (same Collection) | Reorder |
| Item card | Group block | Add to Group |
| Item card | Collection in sidebar | Move item |
| Item card | Space header | Move to default Collection of Space |
| Item card | Trash icon | Soft-delete |
| Group block | Other Group | Reorder |
| Group block | Collection in sidebar | Move group |
| Collection in sidebar | Other Collection | Reorder |
| Collection in sidebar | Space | Move collection |
| Space rail icon | Other Space rail icon | Reorder Spaces |
| Tab from browser | Dashboard / Collection | Save as item (extension only) |
| File from OS | Import page | Start import |

## 3. Pickup gesture

- Mouse: 6 px movement threshold (avoids accidental drags on click).
- Keyboard: `Space` to pick up, arrows to move, `Space` to drop, `Escape` to cancel.
- Touch: 250 ms long-press to pick up.

## 4. Visual states

| State | Style |
|---|---|
| Pickup | Source: `scale-[1.02]`, `shadow-md`, `opacity-90`, custom drag preview |
| Hover over valid target | Target: 3 px `border-primary` outline; insertion line for reorder |
| Hover over invalid target | Cursor `not-allowed`; no outline change |
| Hover over Trash | Trash icon scales 1.1, color `--destructive` |
| Drop landing | 200 ms spring settle |
| Cancel | Source returns to origin with 200 ms `inout` |

## 5. Custom drag preview

`<DragGhost>` component renders:
- Single item: condensed card (favicon + title, 240 px wide)
- Multi-select: stacked cards with `+N more` badge
- Collection: tile preview
- Group: small block with icon + count

Dragging via OS (file drop) uses native preview.

## 6. Drop indicators

- **Reorder within a list**: 2 px primary line at insertion index.
- **Move into container**: container outline pulses.
- **Multiple valid targets**: only nearest highlighted.

## 7. Multi-drag

- Selecting N cards then dragging one drags all.
- Counter chip on drag preview ("3 items").
- Drop applies same operation to each (with single optimistic mutation batch).

## 8. Cross-Org safety

- Cannot drag items between Orgs (would silently leak data).
- If user attempts: drag preview turns red with tooltip "Items can't move between organizations. Use Export/Import."

## 9. Permission gating

- Viewer role: cannot drag. Items show `cursor-default`; no pickup.
- Editor: can drag within Spaces they have write access to.
- Admin/Owner: unrestricted within Org.

## 10. Conflict & undo

- All DnD operations are optimistic with server PATCH (`position_hint`, `parent_id`).
- Failure → rollback + toast "Couldn't move. Retry?".
- Successful operations show undo toast for 6 s.

## 11. Auto-scroll

- Edge auto-scroll within scrollable containers (sidebar, column view).
- 60 px hot zone, accelerating from 60 px/s to 600 px/s as cursor nears edge.

## 12. Accessibility

- Live region announces: "Picked up Item: <title>", "Over Collection: <name>", "Dropped on Group: <name>".
- Each draggable has `aria-roledescription="draggable"`.
- Keyboard DnD fully equivalent to mouse.

## 13. Performance

- Virtualized lists pause virtualization while dragging (avoids item disappearing mid-drag).
- DragOverlay uses `transform` only (no layout reflow).
- Sortable uses `restrictToVerticalAxis` modifier in list view to constrain motion.

## 14. File drops (Import)

- Whole `/org/:id/import` page is a drop zone.
- Multi-file accepted (queued).
- Type detected by extension + magic bytes; mismatched → reject with toast.
- Drop indicator: dashed `border-primary` overlay with "Drop to import" text.

## 15. Telemetry

- `dnd.started` `{ source_type, count }`
- `dnd.completed` `{ source_type, target_type, count, duration_ms }`
- `dnd.canceled`
- `dnd.cross_org_blocked` (rare; useful for finding confused users)

## 16. Forbidden

- No DnD-only operations (every move must also be available via right-click → Move…).
- No drag-to-reveal (would surprise screen-reader users).
- No drag handles smaller than 16 px.
