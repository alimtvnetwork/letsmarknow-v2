# View Modes

> 📌 **Pointer file.** This is the *feature* entry — the user-facing capability "switch how my Collection is rendered". Render contracts, storage shape, persistence rules, entitlements, keyboard shortcuts, and telemetry all live in `15-visualization/`. This file enumerates the modes and routes the reader.

---

## 1. The 5 modes

| Mode | Surface spec | Phase |
|---|---|---|
| `list` | `15-visualization/01-list-view.md` | P0 (default) |
| `grid` | `15-visualization/02-grid-view.md` | P0 |
| `compact` | `15-visualization/03-compact-view.md` | P0 |
| `column` | `15-visualization/05-tabextend-column-view.md` | P1 |
| `mindmap` | `15-visualization/04-mindmap-view.md` | P3 |

Default mode is `list` (per `15-visualization/readme.md §C2`).

## 2. Storage

Per-Collection mode lives at `collections.view_settings.mode` (jsonb). Per-Account fallback lives at `account.preferences.default_view`. Schema, defaults, and merge rules are defined in **`15-visualization/readme.md §C2`** — never duplicate them here.

Data-model fields:
- `02-data-model/03-collection.md` `view_settings` (jsonb).
- `02-data-model/11-account.md` `preferences.default_view` (enum).

## 3. Switching the mode

User-facing affordances:
- View-mode switcher in Collection header (always visible).
- Command palette: `13-command-palette.md` action `view.set_mode`.
- Keyboard: shortcut bindings live in `06-ui-ux/08-keyboard-input.md §3` (registry is the single source of truth — do not invent shortcuts here).

API surface for the switch is `PATCH /v1/collections/:id` with body `{ view_settings: { mode: ... } }` per `15-visualization/readme.md §C3` and `03-api-endpoints/06-collections.md`.

## 4. Cross-mode behavior

The visualization folder canon (`readme.md §C1`, §C6) guarantees:
- Same `Item[]` payload underlies every mode (no data loss on switch).
- Selection state persists across mode switches (sessionStorage, per `readme.md §C6`).
- Drag-and-drop, multi-select, keyboard nav, right-click context menu, hover-to-jump work in every mode (per `06-ui-ux/09-drag-and-drop.md`, `06-ui-ux/08-keyboard-input.md`).

## 5. Plan gating

Mode availability and per-mode capability gates (custom covers, WIP limits, mind-map access, etc.) are tabulated in **`15-visualization/readme.md §C10`**. Entitlement keys flow from `10-licensing-billing/02-entitlements-engine.md`.

This file does NOT enumerate plan gates — it would drift. Read the canon table.

## 6. Telemetry

Mode-switch events live in the `view.*` namespace per `18-analytics-telemetry/03-events.md`:
- `view.mode_changed` `{ from, to, surface, collection_id }`

Per-mode events are enumerated in each view file's §12.

## 7. Cross-references

- Canon (storage / API / entitlements / keyboard / cache invalidation): `15-visualization/readme.md §C1–C13`.
- Per-mode render contracts: `15-visualization/01-list-view.md` … `15-visualization/06-resizable-sections.md`.
- Switcher UI affordance + dashboard placement: `05-web-app/03-dashboard.md`.
- Command palette: `07-features/13-command-palette.md`.
- Plan gating engine: `10-licensing-billing/02-entitlements-engine.md`.
