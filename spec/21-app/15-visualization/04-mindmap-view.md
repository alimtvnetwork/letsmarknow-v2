# Mind-map View

Force-directed bubble graph showing the spatial relationships between Spaces, Collections, Groups, and Tags. Lets users *see* their workspace.

---

## 1. Purpose

Lists hide structure. The mind-map reveals:
- Which Collections cluster around which Tags.
- Orphan items (no tag, no group).
- Density hotspots ("I have 400 items tagged `ai` — should I split?").
- Cross-connections (an item tagged with two tag-clusters acts as a bridge).

## 2. Node types

| Node | Shape | Default color | Size |
|---|---|---|---|
| Space | Hexagon | Space color | × log(items+1) |
| Collection | Filled circle | Collection color | × √(items+1) |
| Group | Outlined circle | Inherits Collection | × √(items+1) |
| Tag | Pill | Auto-hashed from name | × log(usage+1) |
| Item (drill) | Tiny dot | Favicon dominant color | fixed 6 px |

Items not rendered until user zooms past 1.5× — graph stays readable.

## 3. Edges

- Collection → Group: solid line, weight 1.
- Item → Tag: dashed, weight 0.3 (only when item drill enabled).
- Item → Collection (containment): not drawn (implied by clustering).
- Tag co-occurrence: thin curve, weight = `count(items_with_both) / max_count`.

## 4. Layout engine

- D3-force or Cytoscape.js (decision logged in ADR `15-visualization-engine.md`).
- Forces:
  - Charge: -180 (repulsion).
  - Link distance: 80 px scaled by edge weight.
  - Center: 0.05.
  - Collision: node radius + 4 px padding.
- Stable after ~300 ticks; user-pinned nodes never moved by engine.
- WebGL renderer for > 500 nodes; Canvas2D fallback.

## 5. Interactions

| Action | Result |
|---|---|
| Click node | Sidebar opens with node details + items list |
| Double-click | Drill into node (zoom + filter) |
| Drag node | Pin to position (sticky); double-click to unpin |
| Scroll | Zoom (centered on cursor) |
| Right-click | Context menu (rename, change color, delete, export subgraph as image) |
| Lasso | Draw freehand to multi-select nodes; bulk actions appear |
| `Space` + drag | Pan canvas |

## 6. Filters

Top-bar chips:
- Show: Spaces | Collections | Groups | Tags | Items
- Color by: Container | Tag | Recency | Author
- Min item count: slider (hide low-volume nodes)
- Search: highlight matching nodes (others fade to 30%)

## 7. Saved layouts

- "Save current view" snapshots node positions + filter state.
- Listed in sidebar under "Mind-map views".
- Per-Account; sharable read-only with team.

## 8. Performance

| Item count | Target |
|---|---|
| < 200 nodes | Smooth 60 fps; SVG renderer |
| 200-2000 | Canvas2D; 50+ fps |
| 2000-10k | WebGL; 30+ fps; level-of-detail (hide labels when zoomed out) |
| > 10k | Aggregate small clusters into "+N" super-nodes |

Web worker runs the force simulation off main thread.

## 9. Accessibility

- Mind-map is **complementary**, never the only path to data.
- Each node has a screen-reader label.
- Tab cycles through nodes in deterministic order (top-to-bottom by Y).
- Reduced motion: animations disabled; layout snaps instead of tweens.
- Keyboard zoom: `+` / `-`; pan with arrow keys.

## 10. Export

- "Export as PNG / SVG" — current viewport, current zoom, with legend.
- "Export as JSON" — node + edge data (Pro+).
- Resolution presets: 1× / 2× / 4×; max 8000 px width.

## 11. Empty / minimal state

- < 5 nodes: show a friendly illustration "Mind-map needs more items to be useful — add a few more saves".
- Hidden by view-mode picker until ≥ 5 nodes exist (Org-level guard).

## 12. Telemetry

- `view.mindmap.opened` `{ node_count, edge_count, render: svg | canvas | webgl }`
- `view.mindmap.node_clicked` `{ kind }`
- `view.mindmap.layout_saved`
- `view.mindmap.exported` `{ format }`
- `view.mindmap.lasso_used` `{ count }`
- `view.mindmap.fps_p50` (sampled)

## 13. Edge cases

| Case | Behavior |
|---|---|
| All nodes overlap | Engine repulsion bumped; warn after 10 s "Layout busy" |
| Disconnected components | Each component gets its own gravity well; no inter-component force |
| Very long tag name | Pill ellipsis; full on hover |
| User drags node off-canvas | Soft boundary; snap back |
| Switch Org while mind-map open | Reset graph; show loading skeleton |
| Color-blind user | "Use shapes instead of color" toggle in view options |

## 14. Tests

- Force-simulation determinism (same seed → same final layout).
- Pan/zoom accuracy on touch devices.
- WebGL fallback chain.
- Lasso selection bounding-box correctness.
- Saved layout restores within 5 px node tolerance.
- 10k-node stress: no crash, ≥ 25 fps.
