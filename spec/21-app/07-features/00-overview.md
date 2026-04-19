# 00 — Features Folder Overview

> **Purpose.** Define each **user-facing capability** as a self-contained behavioural spec. A "feature" here is a verb the user can perform (save a tab, find an item, tag in bulk) — not a page and not a table. Pages live in `05-web-app/`; tables live in `02-data-model/`; this folder describes *what the user can do* and the rules governing that doing.

---

## 1. Responsibilities

1. **Behavioural contract** for every capability: trigger → preconditions → state changes → side effects → error states → undo behaviour.
2. **Cross-surface consistency.** Each feature usually has multiple surfaces (web app, extension popup, command palette, keyboard shortcut). This folder defines the rules; surfaces in `05-web-app/` and `04-extension/` consume them.
3. **Feature-flag rules.** Which features are gated, by plan tier, by rollout %, by org-level toggle.
4. **Undo expectations.** Which actions are undoable, for how long, via which surface.

---

## 2. File-by-file behaviour

| File | Owns |
|---|---|
| `01-save-tab.md` | Save current tab from popup, context menu, keyboard, omnibox. Destination defaulting; tag suggestion; duplicate handling. |
| `02-save-session.md` | Save entire window or selected tab group as one Item set. |
| `03-quick-find.md` | Type-to-find across the user's items; ranking; jump action; recent boost. |
| `04-collections.md` | Create, rename, move, archive Collections. Slug rules, cascade rules. |
| `05-groups.md` | Group creation within a Collection; reorder; multi-Group membership for Items. |
| `06-tags.md` | Tag creation, autocomplete, rename-with-merge, deletion-with-detach. |
| `07-notes-and-descriptions.md` | Per-Item notes (markdown subset); per-Collection description. |
| `08-view-modes.md` | List / Grid / Compact / Mind-map / Column view selection per Collection; remembered per user. |
| `09-hover-to-jump.md` | Hover preview that lets the user open a target without leaving the current screen. |
| `10-bulk-operations.md` | Multi-select, bulk move, bulk tag, bulk delete; selection persistence rules. |
| `11-starring-and-pinning.md` | Star (personal) vs Pin (org-visible) and where each surfaces. |
| `12-embeds-and-previews.md` | OG-card preview generation, embeddable widget shape. |
| `13-command-palette.md` | Global ⌘K palette: navigate, run action, search; keyboard contract. |
| `14-extensions-os-integrations.md` | macOS share-sheet (Phase 2+), Windows context targets. |
| `15-feature-flags-and-rollouts.md` | Flag definitions, default values, rollout percentages, kill switches. |
| `16-delete-with-undo.md` | Soft-delete + 30-day Trash + undo toast contract; what bypasses Trash. |

---

## 3. Tasks performed by this folder

- **Lock per-feature behaviour** so multiple surfaces (web, popup, palette) cannot drift.
- **Define undo windows** uniformly (toast undo = 10s; Trash restore = 30d).
- **Define plan gating** per feature (consumed by `10-licensing-billing/02-entitlements-engine.md`).
- **Provide the canonical feature-flag list** that `15-feature-flags-and-rollouts.md` enumerates and the runtime config service honours.

---

## 4. What this folder is NOT

- **Not pages.** Where a feature lives is in `05-web-app/`.
- **Not tables.** What gets stored when a feature runs is in `02-data-model/`.
- **Not API.** Endpoints triggered by a feature are in `03-api-endpoints/`.
- **Not a roadmap.** Phase ordering is in `20-roadmap/`.

---

## 5. Cross-references

- Plan gating engine: `10-licensing-billing/02-entitlements-engine.md`.
- Keyboard chord conflicts: `06-ui-ux/08-keyboard-input.md`.
- Audit/event log entries written by features: `12-history-undo/01-event-log.md`.
- Search ranking that powers quick-find: `14-search/06-search-engine.md`.
- Trash UI consumed by delete-with-undo: `05-web-app/09-trash.md`.
