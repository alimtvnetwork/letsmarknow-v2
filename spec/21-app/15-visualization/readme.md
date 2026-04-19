# 15 — Visualization

How saved Items are rendered. Five view modes plus a resizable canvas system.

> **Hand-off readiness rewrite (2026-04-19):** every file in this folder has been re-edited to be **self-contained** — no AI reading these files needs to invent decisions. All references are to specific sections in other spec files; all entitlement keys, copy-string keys, error codes, breakpoints, channel names, API endpoints, and data-model fields are named explicitly. Targets: Lovable 75 / Cursor 90 / Raw chat 65 (up from 45 / 55 / 25).

## Reading order

1. `01-list-view.md` — dense, scannable rows. **Default.**
2. `02-grid-view.md` — image-forward cards.
3. `03-compact-view.md` — maximum density, single-line, vim-friendly.
4. `04-mindmap-view.md` — force-directed bubble graph (**Phase 3 per `20-roadmap/04-phase-3-mindmap-ai.md`**).
5. `05-tabextend-column-view.md` — vertical kanban-style columns (Tab Extend parity).
6. `06-resizable-sections.md` — split panes, sidebars, drag-handles.

## Files

| File | Purpose | Phase |
|---|---|---|
| `01-list-view.md` | Row-based view | P0 |
| `02-grid-view.md` | Card grid | P0 |
| `03-compact-view.md` | One-line dense view | P0 |
| `04-mindmap-view.md` | Force-directed bubble graph | **P3** |
| `05-tabextend-column-view.md` | Column / kanban layout | P1 |
| `06-resizable-sections.md` | Drag-to-resize panes | P0 |

---

## Canon: data shape, persistence, transport

These rules apply to **every** view file in this folder. Each view file links back here rather than re-stating them.

### C1 — Underlying data is the same

Every view renders the same `Item[]` payload defined in `02-data-model/05-item.md`. **A view never has its own DB table.** Switching mode is a pure render change; no server round-trip required to switch.

### C2 — `view_mode` storage

The active view per Collection is stored on the **Collection** row, not on the Account.

- Field: `collections.view_settings` (`jsonb`, nullable). Schema:
  ```json
  {
    "mode": "list" | "grid" | "compact" | "column" | "mindmap",
    "density": "comfortable" | "cozy" | "compact",
    "size": "small" | "medium" | "large" | "xl",
    "aspect": "16:9" | "4:3" | "1:1" | "natural",
    "sort": { "column": "updated_at" | "created_at" | "title" | "manual", "direction": "asc" | "desc" },
    "group_by": null | "tag" | "date" | "domain" | "author",
    "filters": { ... }
  }
  ```
- Falls back to **Account default** in `account.preferences.default_view` when `view_settings.mode` is null.
- Defaults: `mode=list`, `density=comfortable`, `size=medium`, `aspect=16:9`, `sort={column:"updated_at",direction:"desc"}`.

### C3 — API surface for view changes

- `PATCH /v1/collections/{collection_id}` body: `{ "view_settings": { ... } }`. See `03-api-endpoints/06-collections.md`.
- `PATCH /v1/account/preferences` body: `{ "default_view": "..." }`. See `03-api-endpoints/04-organizations.md` (account-scoped section).
- Both return `200` with the updated record. Client applies optimistically per `12-history-undo/02-undo-redo.md` §5 and reconciles on response.

### C4 — Items payload for any view

`GET /v1/collections/{collection_id}/items?view=<mode>&page_size=50&cursor=<...>`

- See `03-api-endpoints/08-items.md` for full schema.
- The `view` query param is **advisory only**: it lets the server tune which fields to hydrate (e.g. `grid` triggers OG-image lookup; `compact` skips description). The shape returned is always a strict subset of `Item`.
- Pagination: cursor-based per `03-api-endpoints/01-conventions.md` §5. **Default `page_size=50`, max `200`.**
- Errors: `403 FORBIDDEN`, `404 NOT_FOUND`, `429 RATE_LIMITED`, `400 VALIDATION_FAILED` per `03-api-endpoints/18-error-codes.md`.

### C5 — Cache invalidation (P0) and realtime invalidation (P2)

**Phasing (per sequencing audit S-2, 2026-04-19):** Realtime infra is **P2 per `20-roadmap/03-phase-2-collab.md` §4**. Do **not** pull the Supabase Realtime client SDK into P0 to satisfy this canon — single-user single-device P0 has no other client to receive a broadcast.

**P0 — local invalidation (no realtime infra required):**
- TanStack Query refetch on window focus (`refetchOnWindowFocus: true`) for the active Collection.
- Optimistic mutations reconcile against the `PATCH` / `POST` response. No channel subscription.
- Multi-tab in the same browser: cross-tab `BroadcastChannel('lmn.invalidate')` postMessage carrying `{ collection_id, item_id?, kind }` — pure browser API, zero infra.

**P2 — cross-device realtime invalidation:** Item / Collection mutations broadcast on the channels per `08-sharing-collab/14-realtime-transport.md` §2:

- `collection:{collection_id}` — item add / remove / move / rename within the open collection.
- `item:{item_id}` — field-level updates (note, tag, star).
- `org:{org_id}` — bulk events (`bulk.tagged`, `bulk.deleted`), entitlement changes that gate views.

Transport: **Supabase Realtime** (locked per `14-realtime-transport.md`). No custom `wss://` endpoints — that path was withdrawn per F-M06. Subscription code is feature-flagged behind `realtime.enabled` per `07-features/15-feature-flags-and-rollouts.md`; flag flips on at P2 cutover.

### C6 — Selection state

A single in-memory `Set<item_id>` per Collection page, **persisted to `sessionStorage`** under key `lmn.selection.{collection_id}`. Survives view-mode switches per `mem://index.md` Core rule. Cleared on:
- Sign-out (`08-sharing-collab/12-revocation-and-expiry.md`-style cascade).
- Navigation away from the Collection.
- Explicit Esc with no items selected → no-op; Esc with items selected → clear.

### C7 — Virtualization

| Item count | Behavior |
|---|---|
| 0 – 200 | No virtualization; native scroll |
| 200 – 5,000 | Virtualized; library = `@tanstack/react-virtual`. Overscan 5 rows / 2 grid rows |
| > 5,000 | Virtualized + cursor-based pagination (load more on scroll) |

Mind-map has its own engine selection in `04-mindmap-view.md` §4.

### C8 — Animation / motion

- Default transition: `transition-all duration-200 ease-out` (per design tokens in `06-ui-ux/01-design-tokens.md` §6).
- All animations gated by `prefers-reduced-motion` per `06-ui-ux/20-accessibility-wcag.md` §4.
- Mind-map respects reduced-motion by snapping layout instead of tweening (per `04-mindmap-view.md` §9).

### C9 — Breakpoints

Every view's responsive behavior is defined by the breakpoints in `06-ui-ux/19-breakpoints.md` (`xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`). Per-view layout decisions are tabulated in `19-breakpoints.md` §3 (per-surface intended layouts).

### C10 — Entitlement gates per view

Entitlement keys come from `10-licensing-billing/02-entitlements-engine.md`. Per-view gates:

| Capability | Entitlement key | Required tier |
|---|---|---|
| List view extra columns | `view.list.extra_columns` | Pro |
| Grid view user-uploaded cover | `view.grid.custom_cover` | Pro |
| Grid view XL size | `view.grid.size_xl` | Pro |
| Compact view tabular alignment | `view.compact.tabular` | Free |
| Mind-map view (any access) | `view.mindmap.access` | Pro |
| Mind-map JSON export | `view.mindmap.export_json` | Pro |
| Column view WIP limits | `view.column.wip_limit` | Pro |
| Column view auto-archive | `view.column.auto_archive` | Pro |
| Column view per-column view-mode override | `view.column.per_column_mode` | Pro |
| Time travel restore (view-related) | `history.time_travel` | Pro |

Server enforces via `has_role` + entitlement check per `17-admin-org/03-roles.md` §4. Client hides UI affordances when entitlement absent (no-op confirm modal). On gated-action attempt, surface `BILLING_QUOTA_EXCEEDED` with upsell modal per `06-ui-ux/17-copy-strings.md` keys `upgrade.modal.*`.

### C11 — Copy-string keys

All visible English text in this folder MUST use keys defined in `06-ui-ux/17-copy-strings.md`. Each view file enumerates its keys in §15 (Copy strings). New string → add to `17-copy-strings.md` first, then reference here.

### C12 — Error codes used by view-mode endpoints

Used codes (full catalog in `03-api-endpoints/18-error-codes.md`):

- `VALIDATION_FAILED` — invalid `view_settings` shape, unknown sort column.
- `FORBIDDEN` — viewer trying to mutate `view_settings`.
- `NOT_FOUND` — collection deleted mid-edit.
- `RATE_LIMITED` — too many `PATCH /collections` from one client.
- `BILLING_QUOTA_EXCEEDED` — entitlement gate (e.g. mindmap on Free).
- `CONFLICT` — concurrent `view_settings` PATCH (handled per `12-history-undo/03-conflict-resolution.md` §3 → LWW).

### C13 — Telemetry namespace

All view telemetry events use the `view.*` namespace per `18-analytics-telemetry/03-events.md`. Each view file enumerates its events in §12.

---

## Locked rules (apply to every view)

- **View mode is per-Collection** — stored at `collections.view_settings.mode`, falling back to `account.preferences.default_view`. See C2.
- **Switching modes never loses data** — pure render change; no server mutation other than persisting the new mode. See C1, C3.
- **Selection state persists across mode switches** — backed by `sessionStorage` per C6.
- **Keyboard navigation works in every mode** (arrow keys move focus). Per-view shortcut tables MUST live under the file's §7. Conflicts arbitrated by the keyboard-shortcut registry in `06-ui-ux/08-keyboard-input.md` §3.
- **Drag-and-drop works in every mode** per `06-ui-ux/09-drag-and-drop.md`.
- **Virtualized rendering** for any view with > 200 items. See C7.
- **60 fps scroll target** on a mid-range laptop (M1 Air baseline) with 5,000 items.
- **Image lazy-loading** with blurhash placeholders per `02-data-model/05-item.md` `metadata.blurhash` field + `06-ui-ux/18-favicon-pipeline.md` for favicon fallback chain.
- **Reduced motion** respected throughout per C8.
- **Cache invalidation**: P0 = TanStack Query refetch + `BroadcastChannel`; P2 = Supabase Realtime channels per C5.
- **Entitlement gates** per C10 — server-enforced; client-hidden.
- **All visible text uses copy-string keys** per C11.

## Cross-references

- Data model: `02-data-model/05-item.md`, `02-data-model/03-collection.md`, `02-data-model/04-group.md`
- API: `03-api-endpoints/06-collections.md`, `03-api-endpoints/08-items.md`, `03-api-endpoints/13-search.md`
- Design tokens / breakpoints: `06-ui-ux/01-design-tokens.md`, `06-ui-ux/19-breakpoints.md`
- A11y: `06-ui-ux/20-accessibility-wcag.md`
- Keyboard: `06-ui-ux/08-keyboard-input.md`
- Drag & drop: `06-ui-ux/09-drag-and-drop.md`
- Copy strings: `06-ui-ux/17-copy-strings.md`
- Error codes: `03-api-endpoints/18-error-codes.md`
- Realtime: `08-sharing-collab/14-realtime-transport.md`
- History / undo: `12-history-undo/02-undo-redo.md`, `12-history-undo/03-conflict-resolution.md`
- Entitlements: `10-licensing-billing/02-entitlements-engine.md`
- Telemetry: `18-analytics-telemetry/03-events.md`
- Roadmap (mind-map = P3): `20-roadmap/04-phase-3-mindmap-ai.md`
