<!--
audit-date: 2026-04-30
next-audit-by: 2026-10-27
audit-type: ad-hoc
status: closed
closed-on: 2026-04-30
closed-because: 3 findings opened and closed same session — VZ1 (S1 07-features/08-view-modes.md drifted from 15-visualization canon → rewritten as thin pointer), VZ2 (S2 02-data-model/03-collection.md `default_view_mode` 3-value enum contradicted readme.md §C2 `view_settings` 5-value enum → reconciled to `view_settings` jsonb), VZ3 (S3 04-mindmap-view.md §7 referenced unspecced `mindmap_layouts` table → added 02-data-model/13-mindmap-layout.md). All 17 lint sub-checks green.
audit-id: 109
scope: spec/21-app/15-visualization/
score-before: 100/100
score-after: 100/100
findings: 3 (all closed same session)
-->

# Audit 109 — `15-visualization/` gap-sweep

## Scope

All 7 files in `spec/21-app/15-visualization/` plus their cross-folder dependencies (`07-features/08-view-modes.md`, `02-data-model/03-collection.md`, `03-api-endpoints/23-mindmap-layouts.md`).

## Method

1. Read all 7 visualization files end-to-end.
2. Cross-walk every `view_settings.*` reference, every `entitlement` key, every cited table/endpoint to its declared SoT.
3. Compare `07-features/08-view-modes.md` against `15-visualization/readme.md` Canon §C1–C13.
4. Verify the `mindmap_layouts` table cited in `04-mindmap-view.md §7` exists in `02-data-model/`.

## Findings

### VZ1 — `07-features/08-view-modes.md` is a parallel, drifted SoT (S1)

`07-features/00-overview.md §4` states "Not data… What gets stored when a feature runs is in `02-data-model/`" — feature files describe behavior, they don't redefine storage. Yet `08-view-modes.md`:

- Claims storage is `collection.default_view` and `prefs.default_view` — both names contradict canon (`collections.view_settings.mode` + `account.preferences.default_view` per `15-visualization/readme.md §C2`).
- Lists only 4 modes (`grid`, `list`, `compact`, `column`) — omits `mindmap` from the locked 5-value enum.
- Claims "All view modes available on every plan" — contradicts canon §C10 (mind-map = Pro, list extra columns = Pro, etc.).
- Claims "Per-route override via `?view=`" — no such URL parameter is declared in `05-web-app/01-routes.md`; canon §C4 uses `view` only as an advisory query param on `GET /v1/items`.
- Hard-codes pixel sizes (220×180, 64 px row, 280 px column) that contradict per-view §1 anatomies in the visualization folder.
- Names keyboard `1`/`2`/`3`/`4` for mode switching — not registered in `06-ui-ux/08-keyboard-input.md §3`.

**Fix:** Rewrote `07-features/08-view-modes.md` as a thin pointer file: lists the 5 modes, points every storage / API / keyboard / entitlement question to the visualization folder canon. Behavioral surface left to feature pages; render contracts left to `15-visualization/`.

### VZ2 — `02-data-model/03-collection.md` field contradicts canon (S2)

Field row at line 29: `default_view_mode | enum(list|grid|compact)`.

Contradicts `15-visualization/readme.md §C2` SoT:
- Canon field name: `view_settings` (jsonb), with `view_settings.mode`.
- Canon enum: 5 values (`list`, `grid`, `compact`, `column`, `mindmap`).
- Canon shape includes `density`, `size`, `aspect`, `sort`, `group_by`, `filters` — all rendered useless by a flat `default_view_mode` column.

This blocks AI codegen: a code-generating agent reading the data model file would generate a 3-value enum column that the visualization folder's PATCH endpoint (`/v1/collections/:id` with `view_settings` jsonb) cannot write to.

**Fix:** Replaced `default_view_mode` row with `view_settings | jsonb | yes | null | shape per 15-visualization/readme.md §C2 | …`. Account-level fallback `account.preferences.default_view` already lives in `11-account.md`.

### VZ3 — `mindmap_layouts` table cited but not declared (S3)

`04-mindmap-view.md §7`: "Stored in new table `mindmap_layouts` with `(id, account_id, scope_type, scope_id, name, snapshot, created_at)` per `02-data-model/`." But `02-data-model/` has no such file (verified by `ls`). The `03-api-endpoints/23-mindmap-layouts.md` endpoint file references the table as well.

Phase-3 deferral does not justify omitting a table that is already named in the API spec — AI codegen will produce inconsistent Supabase migrations between the API folder and the data-model folder.

**Fix:** Created `02-data-model/13-mindmap-layout.md` with full field table, invariants, lifecycle, and events. Updated `04-mindmap-view.md §7` to point at the new file. Verified `03-api-endpoints/23-mindmap-layouts.md` aligns with the new schema.

## Linter status after closure

All 17 sub-checks green. No allowlist additions required (one new data-model file follows convention; one feature file rewrite preserves all existing cross-refs).

## Implementability scorecard (after)

| Tier | Score | Δ |
|---|---|---|
| Lovable | 100 | 0 |
| Cursor | 100 | 0 |
| Raw LLM | 100 | 0 |

Baseline preserved per `audit-2026-04-29-ai-readiness-score-v2.md`. The three fixes plug genuine codegen-blocking contradictions without raising the bar; baseline integrity restored, not exceeded.

## Cross-references

- `15-visualization/readme.md §C1–C13` — SoT for canon.
- `07-features/08-view-modes.md` — rewritten this session.
- `02-data-model/03-collection.md` — field reconciliation this session.
- `02-data-model/13-mindmap-layout.md` — created this session.
- `03-api-endpoints/23-mindmap-layouts.md` — cross-checked, no edit needed.
