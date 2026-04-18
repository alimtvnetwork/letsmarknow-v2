# 07 — Features

This folder catalogs every user-facing feature in v1, with rules, edge cases, and entitlement gating. Anything mentioned in `00-overview/01-vision.md` becomes a file here.

Files in this folder describe **what** a feature does end-to-end. Implementation specifics (API shape, UI, storage) live in their respective folders (`02-data-model/`, `03-api-endpoints/`, `04-extension/`, `05-web-app/`, `06-ui-ux/`).

## Reading order

1. `01-save-tab.md` — single-tab save (the primary action).
2. `save-session.md` — multi-tab "save this window".
3. `03-quick-find.md` — Cmd+K / omnibox / popup search.
4. `collections.md` — create, rename, move, duplicate, archive.
5. `groups.md` — clusters of items inside a Collection.
6. `tags.md` — flat, org-scoped tags + filtering.
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

| File | Purpose |
|---|---|
| `01-save-tab.md` | Save 1 tab |
| `save-session.md` | Save N tabs |
| `03-quick-find.md` | Search across saves |
| `collections.md` | Collection lifecycle |
| `groups.md` | Group lifecycle |
| `tags.md` | Tag lifecycle |
| `07-notes-and-descriptions.md` | Content fields |
| `08-view-modes.md` | Display modes |
| `09-hover-to-jump.md` | Open-tab detection |
| `10-bulk-operations.md` | Multi-select actions |
| `11-starring-and-pinning.md` | Favorites |
| `12-embeds-and-previews.md` | Rich previews |
| `13-command-palette.md` | Cmd+K |
| `14-extensions-os-integrations.md` | OS-level hooks |
| `15-feature-flags-and-rollouts.md` | Rollout system |

## Locked rules

- Every feature lists its **entitlement gate** (Free / Pro / Team / Lifetime tier).
- Every feature lists its **telemetry events**.
- Every feature has a **reduced-functionality fallback** for offline mode.
- No feature requires multiple consecutive network round-trips on the hot path.
- All destructive feature actions are reversible within 30 days (soft-delete) or 6 seconds (Undo toast), whichever is longer.
- Features that depend on the extension MUST also work (with reduced UX) in the web app alone.
