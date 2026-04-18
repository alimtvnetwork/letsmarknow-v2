# 15 — Visualization

How saved items are rendered. Five view modes + a resizable canvas system.

## Reading order

1. `list-view.md` — dense, scannable rows.
2. `grid-view.md` — image-forward cards.
3. `compact-view.md` — maximum density, single-line.
4. `mindmap-view.md` — bubble graph of Spaces / Collections / Groups.
5. `tabextend-column-view.md` — vertical kanban-style columns (Tab Extend parity).
6. `resizable-sections.md` — split panes, sidebars, drag-handles.

## Files

| File | Purpose |
|---|---|
| `list-view.md` | Row-based view |
| `grid-view.md` | Card grid |
| `compact-view.md` | One-line dense view |
| `mindmap-view.md` | Force-directed bubble graph |
| `tabextend-column-view.md` | Column / kanban layout |
| `resizable-sections.md` | Drag-to-resize panes |

## Locked rules

- **View mode is per-Collection** (persisted; defaults to user preference).
- **Switching modes never loses data** — only changes rendering.
- **Selection state persists across mode switches.**
- **Keyboard navigation works in every mode** (arrow keys move focus).
- **Drag-and-drop works in every mode** (per `06-ui-ux/drag-and-drop.md`).
- **Virtualized rendering** for any view with > 200 items.
- **60 fps scroll** on a mid-range laptop with 5,000 items.
- **Image lazy-loading** with blurhash placeholders.
- **Reduced motion** respected throughout.
