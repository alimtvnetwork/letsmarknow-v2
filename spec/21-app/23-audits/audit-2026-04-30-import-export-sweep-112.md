<!--
audit-date: 2026-04-30
next-audit-by: 2026-10-27
audit-type: ad-hoc
status: closed
closed-on: 2026-04-30
closed-because: 5 findings opened and closed same session — IE1 (S1 importer source vocabulary drift: `02-importers.md §1` listed brand IDs `chrome|edge|firefox|raindrop|pocket|pinboard|instapaper|diigo|notion|lmn_json|csv` while API `15-import-export.md` line 197 declares `source` enum `lmn_native|bookmarks_html|pocket_csv|toby_json|tab_extend_json|raindrop_csv|instapaper_csv` — Toby/Tab Extend missing from importer table, brand→wire mapping undocumented → rewrote §1 with two-vocabulary header note + 4-column table including canonical "Wire `source`" mapping for every brand, missing brands Toby + Tab Extend added, pre-converted brands Pinboard/Notion/Diigo/CSV documented), IE2 (S2 phase enum mismatch: `06-large-imports.md §3` declared internal `uploaded → parsed → preview_ready → committing(offset=N) → committed_internal` and called them "not wire-visible", but API `15-import-export.md` line 115 returns `phase` on `GET /v1/imports/:id/status` with values `parsing|previewing|awaiting_commit|writing_spaces|writing_collections|writing_items|writing_tags|finalizing|done` → §3 rewritten to cite canonical wire `phase` enum + define a separate `import_jobs.checkpoint` jsonb for internal `{phase, batch_offset, completed_count, resumed_from_batch_id}` resume state), IE3 (S2 dedup-mode three-vocabulary drift unmapped: UX `merge_by_url|keep_both|skip_duplicates`, wire `on_duplicate=skip|overwrite|create_new|merge_tags`, telemetry `dedup_mode=skip|merge|allow` had no canonical mapping → added 4-row mapping table to `11-dedup-algorithm.md §6` covering all three vocabularies including admin-only `overwrite` path), IE4 (S3 format catalog drift: `01-formats.md §1` used freeform format names while API exposes `format` enum `lmn_native_json|bookmarks_html|csv_flat|pocket_csv` with no OPML/Markdown coverage → §1 rewritten with "Wire enum (import / export)" column citing `15-import-export.md` lines 197 + 284, OPML/Markdown documented as adapter-wrapped with no wire enum, Toby/Tab Extend rows added), IE5 (S2 `POST /v1/imports/:id/parse?source=` referenced in `03-import-pipeline.md §4` but no such endpoint exists in API spec — parse is implicit on upload completion → §4 rewritten to declare parsing implicit, observability via canonical `phase` enum on `GET /v1/imports/:id/status`; §11 split into per-record warnings vs envelope errors with explicit mapping to canonical `IMPORT_*` codes from `18-error-codes.md §3.7`). Allowlisted new audit filename. All 17 lint sub-checks green.
audit-id: 112
scope: spec/21-app/11-import-export/
score-before: 100/100
score-after: 100/100
-->

# Audit 112 — `11-import-export/` gap-sweep

**Date:** 2026-04-30
**Scope:** `spec/21-app/11-import-export/` reconciled against `03-api-endpoints/15-import-export.md`, `03-api-endpoints/18-error-codes.md §3.7`, `03-api-endpoints/01-conventions.md`.
**Result:** 5 findings opened, 5 closed, 0 carried forward. Score 100.

---

## Findings

### IE1 — Importer source vocabulary drift (S1, closed)

`02-importers.md §1` listed brand IDs (`chrome`, `edge`, `firefox`, `raindrop`, `pocket`, `pinboard`, `instapaper`, `diigo`, `notion`, `lmn_json`, `csv`) while the API `source` enum on `POST /v1/imports` is a **format enum** (`lmn_native | bookmarks_html | pocket_csv | toby_json | tab_extend_json | raindrop_csv | instapaper_csv`). Toby and Tab Extend were missing from the importer table entirely; brand → wire mapping was undocumented.

**Fix:** rewrote §1 with a two-vocabulary header note and a 4-column table including canonical `Wire source (API enum)` for every brand. Added Toby and Tab Extend rows. Documented Pinboard, Notion, Diigo, and Generic CSV as **pre-converter** brands that emit a canonical wire enum before submitting; brand label preserved in `metadata.imported_from`.

### IE2 — `phase` enum mismatch (S2, closed)

`06-large-imports.md §3` defined an internal sub-state machine (`uploaded → parsed → preview_ready → committing(offset=N) → committed_internal`) and called them "not wire-visible", but the API spec returns `phase` on `GET /v1/imports/:id/status` with the canonical enum `parsing | previewing | awaiting_commit | writing_spaces | writing_collections | writing_items | writing_tags | finalizing | done`.

**Fix:** rewrote §3 to (a) cite the canonical wire `phase` enum, and (b) define a separate `import_jobs.checkpoint` jsonb column for internal `{ phase, batch_offset, completed_count, resumed_from_batch_id }` resume state. Internal checkpoints now augment the wire-visible phase rather than contradicting it.

### IE3 — Dedup-mode three-vocabulary drift unmapped (S2, closed)

Three layers each used their own dedup-mode names with no canonical bridge:
- UX wizard (`05-mapping-and-dedup.md §5`): `merge_by_url | keep_both | skip_duplicates`
- Wire `on_duplicate` (`POST /v1/imports/:id/commit`): `skip | overwrite | create_new | merge_tags`
- Telemetry `dedup_mode` (`11-dedup-algorithm.md §6` / `X-Dedup-Mode`): `skip | merge | allow`

**Fix:** added a 4-row mapping table to `11-dedup-algorithm.md §6` covering all three vocabularies, including the admin-only `overwrite` path (existing tags/notes lost; restricted to API + Admin role + `X-Dedup-Mode: merge` AND `on_duplicate=overwrite`). Importer codegen MUST translate via this table.

### IE4 — Format catalog drift (S3, closed)

`01-formats.md §1` listed freeform format names; API exposes `format` enum `lmn_native_json | bookmarks_html | csv_flat | pocket_csv` (export side) and the import-side `source` enum from IE1. OPML and Markdown bundle had no wire-enum coverage; Toby and Tab Extend were missing entirely.

**Fix:** rewrote §1 with a `Wire enum (import / export)` column citing `15-import-export.md` lines 197 and 284. OPML and Markdown bundle documented as **adapter-wrapped** with no first-class wire enum (Markdown is admin-only). Toby and Tab Extend rows added. Pinboard documented as pre-converted to `bookmarks_html`.

### IE5 — Phantom parse endpoint + per-record vs envelope error confusion (S2, closed)

`03-import-pipeline.md §4` referenced `POST /v1/imports/:id/parse?source=<id>` — no such endpoint exists in the API spec; parsing is implicit on upload completion. Additionally §11 listed per-record codes (`MISSING_URL`, `INVALID_URL`, `MALFORMED_DATE`, `CHECKSUM_MISMATCH`, etc.) under "Error model" without distinguishing them from canonical API envelope error codes — risking codegen treating them as `errors[].code` values violating `18-error-codes.md §3` casing/naming rules.

**Fix:** rewrote §4 to declare parsing implicit; observability via canonical `phase` enum on `GET /v1/imports/:id/status`. Rewrote §11 with two layers — **per-record warnings** (emitted as `warnings[].code` in preview payload + `errors_url` JSON, never fail the import) vs **envelope errors** (mapped explicitly to the `IMPORT_*` family in `18-error-codes.md §3.7`). Added `MISSING_FAVICON` to mirror what the API preview payload already returns.

---

## Cross-cutting touches

- No changes required in `00-overview.md`, `readme.md`, `04-export-pipeline.md`, `07-webhooks-and-api-imports.md`, `08-email-in.md`, `09-gdpr-export.md`, `10-migration-out.md` — already aligned.

## Linter status

All 17 sub-checks green after fixes. Allowlisted new audit filename in `naming-convention.allowlist.txt`.
