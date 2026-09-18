# 00 — Visualization Folder Overview

> **Purpose.** Define every **view mode** a user can apply to a Collection: list, grid, compact, mind-map, TabExtend-style column. Each view mode is a different rendering of the same underlying Group/Item data. View choice is per-user-per-Collection and remembered.

---

## 1. Responsibilities

1. **Per-view-mode spec.** Layout zones, density, what fields surface, what interactions are available.
2. **P0/P2 split.** v1 ships List + Grid + Compact + Column (P0). Mind-map is P2 (Phase 3). Locked in `readme.md` §C5 (Sub: 15-visualization closure).
3. **Resizable sections.** Common resizable pane primitive used by Column and Mind-map views.
4. **Persistence.** Per-user preferred view per Collection.
5. **Consistency.** Selection, drag-and-drop, keyboard navigation behave the same across view modes (handoff to `06-ui-ux/`).

---

## 2. File-by-file behaviour

| File | Owns |
|---|---|
| `01-list-view.md` | Dense vertical rows: title, URL host, tag chips, last-visited; bulk-select. |
| `02-grid-view.md` | Card grid with thumbnail (favicon or OG image), title, host. |
| `03-compact-view.md` | Smallest density: single-line per Item; keyboard-heavy. |
| `04-mindmap-view.md` | Phase-3 P2: tree/graph layout with zoom + pan; nodes = Items, edges = Groups. |
| `05-tabextend-column-view.md` | Horizontal columns = Groups; cards = Items; drag between columns. |
| `06-resizable-sections.md` | Shared resizable pane behaviour; persistence of pane sizes. |

---

## 3. Tasks performed by this folder

- **Define each view mode** as an independent rendering contract.
- **Lock P0 vs P2 split** so Phase 1 doesn't accidentally pull mind-map into scope.
- **Provide the resizable pane primitive** consumed by Column and Mind-map.
- **Define per-Collection view preference persistence**.

---

## 4. What this folder is NOT

- **Not data.** Item/Group rows live in `02-data-model/`.
- **Not features.** "View-mode picker" UX is in `07-features/08-view-modes.md`.
- **Not the design system.** Tokens used by the renderings are in `06-ui-ux/`.

---

## 5. Cross-references

- View-mode picker feature: `07-features/08-view-modes.md`.
- Drag-and-drop affordance reused across views: `06-ui-ux/09-drag-and-drop.md`.
- Mind-map phase target: `20-roadmap/04-phase-3-mindmap-ai.md`.
- Pagination contract used by all list-style views: `03-api-endpoints/01-conventions.md` §5 (`limit` lock).
