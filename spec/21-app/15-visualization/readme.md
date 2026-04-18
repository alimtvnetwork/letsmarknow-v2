# 15 — Visualization

How saved items are rendered. Five view modes + a resizable canvas system.

## Reading order

1. `01-list-view.md` — dense, scannable rows.
2. `02-grid-view.md` — image-forward cards.
3. `03-compact-view.md` — maximum density, single-line.
4. `04-mindmap-view.md` — bubble graph of Spaces / Collections / Groups.
5. `05-tabextend-column-view.md` — vertical kanban-style columns (Tab Extend parity).
6. `06-resizable-sections.md` — split panes, sidebars, drag-handles.

## Files

| File | Purpose |
|---|---|
| `01-list-view.md` | Row-based view |
| `02-grid-view.md` | Card grid |
| `03-compact-view.md` | One-line dense view |
| `04-mindmap-view.md` | Force-directed bubble graph |
| `05-tabextend-column-view.md` | Column / kanban layout |
| `06-resizable-sections.md` | Drag-to-resize panes |

## Locked rules

- **View mode is per-Collection** (persisted; defaults to user preference).
- **Switching modes never loses data** — only changes rendering.
- **Selection state persists across mode switches.**
- **Keyboard navigation works in every mode** (arrow keys move focus).
- **Drag-and-drop works in every mode** (per `06-ui-ux/09-drag-and-drop.md`).
- **Virtualized rendering** for any view with > 200 items.
- **60 fps scroll** on a mid-range laptop with 5,000 items.
- **Image lazy-loading** with blurhash placeholders.
- **Reduced motion** respected throughout.
