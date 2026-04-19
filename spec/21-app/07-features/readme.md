# 07 — Features

This folder catalogs every user-facing feature in v1, with rules, edge cases, and entitlement gating. Anything mentioned in `00-overview/01-vision.md` becomes a file here.

Files in this folder describe **what** a feature does end-to-end. Implementation specifics (API shape, UI, storage) live in their respective folders (`02-data-model/`, `03-api-endpoints/`, `04-extension/`, `05-web-app/`, `06-ui-ux/`).

## Reading order

1. `01-save-tab.md` — single-tab save (the primary action).
2. `02-save-session.md` — multi-tab "save this window".
3. `03-quick-find.md` — Cmd+K / omnibox / popup search.
4. `04-collections.md` — create, rename, move, duplicate, archive.
5. `05-groups.md` — clusters of items inside a Collection.
6. `06-tags.md` — flat, org-scoped tags + filtering.
7. `07-notes-and-descriptions.md` — Markdown-lite content fields.
8. `08-view-modes.md` — grid / list / compact / column behavior.
9. `09-hover-to-jump.md` — switch to existing tab on hover.
10. `10-bulk-operations.md` — multi-select + actions.
11. `11-starring-and-pinning.md` — favorites and pinned positions.
12. `12-embeds-and-previews.md` — Pro+ rich previews.
13. `13-command-palette.md` — Cmd+K registry + extensibility.
14. `14-extensions-os-integrations.md` — share-target, protocol handler, OS sheets.
15. `15-feature-flags-and-rollouts.md` — gradual feature exposure.

## Files

| File | Purpose | Phase |
|---|---|---|
| `01-save-tab.md` | Save 1 tab | P0 |
| `02-save-session.md` | Save N tabs | P1 |
| `03-quick-find.md` | Search across saves | P0 (basic) / P1 (operators) |
| `04-collections.md` | Collection lifecycle | P0 |
| `05-groups.md` | Group lifecycle | P0 |
| `06-tags.md` | Tag lifecycle | P1 |
| `07-notes-and-descriptions.md` | Content fields | P1 (plain) / P2 (CRDT bodies) |
| `08-view-modes.md` | Display modes | P0 (list+compact) / P1 (grid+column) / P3 (mindmap) |
| `09-hover-to-jump.md` | Open-tab detection | P3 |
| `10-bulk-operations.md` | Multi-select actions | P3 |
| `11-starring-and-pinning.md` | Favorites | P1 |
| `12-embeds-and-previews.md` | Rich previews | P1 (Pro) |
| `13-command-palette.md` | Cmd+K | P0 (basic) / P1 (operators) |
| `14-extensions-os-integrations.md` | OS-level hooks | P1 (omnibox/sidepanel) / P4 (Raycast/Alfred/CLI) |
| `15-feature-flags-and-rollouts.md` | Rollout system | P0 (foundational) |
| `16-delete-with-undo.md` | Trash + Undo | P0 (Trash) / P1 (Undo toast) |

> **Phase legend:** P0 = MVP, P1 = v1, P2 = Collab, P3 = Mindmap/AI, P4 = Cross-browser. Source of truth: `20-roadmap/`.

## Locked rules

- Every feature lists its **entitlement gate** (Free / Pro / Team / Lifetime tier).
- Every feature lists its **telemetry events**.
- Every feature has a **reduced-functionality fallback** for offline mode.
- No feature requires multiple consecutive network round-trips on the hot path.
- All destructive feature actions are reversible within 30 days (soft-delete) or 6 seconds (Undo toast), whichever is longer.
- Features that depend on the extension MUST also work (with reduced UX) in the web app alone.
