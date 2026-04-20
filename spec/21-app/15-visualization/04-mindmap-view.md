# Mind-map View

Force-directed bubble graph showing the spatial relationships between Spaces, Collections, Groups, and Tags. Lets users *see* their workspace.

> **Phase 3** per `20-roadmap/04-phase-3-mindmap-ai.md`. Specced now so the data model and API are reserved.
>
> Folder-wide rules in `readme.md` §C1–C13. This file owns only mind-map-specific spec.

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
| Space | Hexagon | `space.color` | base × log(items+1) |
| Collection | Filled circle | `collection.color` | base × √(items+1) |
| Group | Outlined circle | inherits Collection | base × √(items+1) |
| Tag | Pill | auto-hashed from name (deterministic; see §2.1) | base × log(usage+1) |
| Item (drill) | Tiny dot | favicon dominant color | fixed 6 px |

Items not rendered until user zooms past 1.5× — graph stays readable.

### 2.1 Tag color hashing

Deterministic so reloads produce stable colors. Algorithm:
```
hash = SHA-1(tag.name).slice(0, 6)        // 24 bits
hue  = (parseInt(hash, 16) % 360)
sat  = 65   // %
light = 55  // %
color = `hsl(${hue} ${sat}% ${light}%)`
```
This algorithm MUST also be implemented identically in the export pipeline so PNG/SVG exports match in-app colors.

## 3. Edges

- Collection → Group: solid line, weight 1.
- Item → Tag: dashed, weight 0.3 (only when item drill enabled).
- Item → Collection (containment): not drawn (implied by clustering).
- Tag co-occurrence: thin curve, weight = `count(items_with_both_tags) / max_count_in_org`.

## 4. Layout engine

> **Decision (locked, was orphan-ADR ref):** **D3-force** for v1. Cytoscape.js was evaluated and rejected because (a) D3-force is already in the bundle for charts (`@/components/ui/chart`); (b) Cytoscape adds ~250 KB; (c) we don't need Cytoscape's graph algorithms (BFS, shortest-path) at v1.

Forces:
- `forceManyBody().strength(-180)` (repulsion).
- `forceLink().distance(80).strength(<edge_weight>)`.
- `forceCenter(0, 0).strength(0.05)`.
- `forceCollide(<node_radius> + 4)`.

Stable after ~300 ticks; `simulation.alphaMin(0.001)`. User-pinned nodes use `node.fx = ...; node.fy = ...` and are not repositioned.

Renderer selection per node count:

| Nodes | Renderer | Rationale |
|---|---|---|
| < 200 | SVG (React) | Easiest to debug, accessible-by-default |
| 200 – 2,000 | Canvas2D (custom render loop) | SVG fps drops below 30 |
| > 2,000 | WebGL via PixiJS | Canvas2D fps drops below 30 |

Web Worker runs `forceSimulation`; main thread does only render. Comm via `Atomics`-backed SharedArrayBuffer of `[x, y, vx, vy]` floats.

## 5. Interactions

| Action | Result |
|---|---|
| Click node | Sidebar opens with node details + items list |
| Double-click | Drill into node (zoom + filter) |
| Drag node | Pin to position (sticky); double-click to unpin |
| Scroll wheel / pinch | Zoom (centered on cursor) |
| Right-click | Context menu (rename, change color, delete, export subgraph as image) |
| Lasso | Hold `L`, draw freehand to multi-select nodes; bulk actions appear |
| `Space` + drag | Pan canvas |

All mutations route through standard endpoints in `03-api-endpoints/`:
- Rename node → `PATCH /v1/{collections|groups|tags|spaces}/{id}` per the entity's API file.
- Color change → same endpoints.
- Delete → `DELETE` of same; cascades per `02-data-model/`.
- Bulk operations → `POST /v1/bulk/items` per `07-features/10-bulk-operations.md`.

## 6. Filters

Top-bar chips:
- Show: Spaces | Collections | Groups | Tags | Items
- Color by: Container | Tag | Recency | Author
- Min item count: slider (hide low-volume nodes)
- Search: highlight matching nodes (others fade to 30% opacity)

Filter state persisted at `collections.view_settings.mindmap_filters` per `readme.md` §C2.

## 7. Saved layouts

Entitlement: `view.mindmap.access` (Pro). See `readme.md` §C10.

- "Save current view" snapshots `(node positions, filter state, zoom, pan)`.
- Stored in new table `mindmap_layouts` with `(id, account_id, scope_type, scope_id, name, snapshot, created_at)` per `02-data-model/`.
- API: `POST /v1/mindmap-layouts`, `GET /v1/mindmap-layouts?scope_type=collection&scope_id=...`, `DELETE /v1/mindmap-layouts/{id}`.
- Per-Account; sharable read-only with team via the standard share model `02-data-model/07-share.md` (scope: `mindmap_layout`).

## 8. Performance

| Item count | Target |
|---|---|
| < 200 nodes | Smooth 60 fps; SVG renderer |
| 200 – 2,000 | Canvas2D; ≥ 50 fps |
| 2,000 – 10,000 | WebGL; ≥ 30 fps; level-of-detail (hide labels when zoomed out) |
| > 10,000 | Aggregate small clusters into "+N" super-nodes; ≥ 25 fps |

Web Worker runs the force simulation off main thread (see §4).

## 9. Accessibility

- Mind-map is **complementary**, never the only path to data — users MUST always be able to do everything they can in the mind-map via list / grid / compact too. WCAG 2.1 AA per `06-ui-ux/20-accessibility-wcag.md`.
- Each node has a screen-reader label rendered in a hidden `<ul>` mirror tree (`role="tree"`).
- Tab cycles through nodes in deterministic order (top-to-bottom by Y, then left-to-right by X).
- `prefers-reduced-motion`: animations disabled; layout snaps instead of tweens. Per `readme.md` §C8.
- Keyboard zoom: `+` / `-`; pan with arrow keys.
- High-contrast theme: nodes get 2 px solid outline regardless of color (per `06-ui-ux/02-theming.md`).

## 10. Export

Entitlement: `view.mindmap.export_json` for JSON; PNG/SVG free.

- "Export as PNG / SVG" — current viewport, current zoom, with legend.
- "Export as JSON" — node + edge data (Pro+); shape:
  ```json
  {
    "version": "1",
    "exported_at": "2026-04-19T08:00:00Z",
    "scope": { "type": "collection", "id": "01J..." },
    "nodes": [ { "id", "kind", "label", "x", "y", "color", "size" } ],
    "edges": [ { "from", "to", "kind", "weight" } ]
  }
  ```
- Resolution presets: 1× / 2× / 4×; max 8000 px width.
- Routed through `11-import-export/04-export-pipeline.md` for delivery.

## 11. Empty / minimal state

- < 5 nodes: show illustration + copy `view.mindmap.too_sparse.headline` ("Mind-map needs more items to be useful").
- Hidden by view-mode picker until ≥ 5 nodes exist (Org-level guard, computed server-side and returned in `GET /v1/collections/{id}` response as `mindmap_eligible: bool`).

## 12. Telemetry

Namespace `view.mindmap.*`. Catalog in `18-analytics-telemetry/03-events.md`.

- `view.mindmap.opened` `{ node_count, edge_count, render: "svg" | "canvas" | "webgl", collection_id }`
- `view.mindmap.node_clicked` `{ kind: "space" | "collection" | "group" | "tag" | "item" }`
- `view.mindmap.layout_saved` `{ layout_id }`
- `view.mindmap.exported` `{ format: "png" | "svg" | "json" }`
- `view.mindmap.lasso_used` `{ count }`
- `view.mindmap.fps_p50` `{ value, node_count }` (sampled 1%)

## 13. Edge cases

| Case | Behavior |
|---|---|
| All nodes overlap | `forceManyBody.strength` bumped to -300; warn after 10 s "Layout busy" toast (copy key `view.mindmap.layout_busy`) |
| Disconnected components | Each component gets its own gravity well; no inter-component force |
| Very long tag name | Pill ellipsis at 24 chars; full on hover Tooltip |
| User drags node off-canvas | Soft boundary at viewport-edge ± 200 px; snap back |
| Switch Org while mind-map open | Reset graph; show loading skeleton |
| Color-blind user | "Use shapes instead of color" toggle in view options; persisted at `account.preferences.colorblind_safe=true` |
| Free user opens mind-map URL | Server returns `BILLING_QUOTA_EXCEEDED`; client shows upsell modal with copy `upgrade.modal.feature_locked` substituting `feature="mind-map view"` |
| Realtime: Collection deleted while mind-map open | Node removed with fade; if it was the focused node, focus moves to its parent Space |

## 14. A11y interactions table

| Visual interaction | Keyboard equivalent |
|---|---|
| Click node | Enter on focused node |
| Drag pin | Cmd+Arrow (4 px steps) |
| Lasso select | Shift+Arrow extends selection to next node |
| Pan | Arrow keys when no node focused |
| Zoom | `+` / `-` |

## 15. Copy strings used

- `view.mindmap.too_sparse.headline`
- `view.mindmap.too_sparse.sub`
- `view.mindmap.layout_busy`
- `view.mindmap.export_started`
- `view.mindmap.layout_saved_toast`
- `upgrade.modal.feature_locked` (shared)

## 16. Tests

- Force-simulation determinism (same seed → same final layout).
- Pan/zoom accuracy on touch devices.
- Renderer fallback chain (SVG → Canvas2D → WebGL based on `node_count` thresholds).
- Lasso selection bounding-box correctness.
- Saved layout restores within 5 px node tolerance.
- 10k-node stress: no crash, ≥ 25 fps.
- A11y: keyboard-only user can complete all §5 interactions.
- Free user attempting to open mind-map → upsell modal renders, no force-simulation work started (CPU saved).
