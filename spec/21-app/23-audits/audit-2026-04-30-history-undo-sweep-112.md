<!--
audit-date: 2026-04-30
next-audit-by: 2026-10-27
audit-type: ad-hoc
status: closed
closed-on: 2026-04-30
closed-because: 3 findings opened and closed same session — HU1 (S2 invented error tokens UNDO_TARGET_GONE/TARGET_GONE/QUOTA_EXCEEDED/FORBIDDEN in 12-history-undo/02-undo-redo.md §8 → replaced with canonical GONE_HARD_DELETED/GONE_SOFT_DELETED/BILLING_QUOTA_EXCEEDED/PERM_DENIED + new HISTORY_* family), HU2 (S2 03-api-endpoints/14-history.md §undo used bare HTTP labels with details.reason discriminators violating "switch on code" locked rule → added 5-code HISTORY_* family in 18-error-codes.md §3.10, RT_* renumbered to §3.11, §undo errors block rewritten), HU3 (S3 02-undo-redo.md §8 lacked back-ref to canonical registry → added). Also fixed 03-conflict-resolution.md §10 TARGET_GONE → GONE_HARD_DELETED. All 17 lint sub-checks green.
audit-id: 112
scope: spec/21-app/12-history-undo/
score-before: 100/100
score-after: 100/100
-->

# Audit 112 — `12-history-undo/` gap-sweep

## Scope
Full-folder review of `12-history-undo/` (00-overview, 01-event-log, 02-undo-redo, 03-conflict-resolution) cross-checked against `03-api-endpoints/14-history.md`, `03-api-endpoints/18-error-codes.md`, `02-data-model/09-history-event.md`.

## Findings

### HU1 (S2) — Non-canonical error tokens in undo/redo spec — CLOSED
`12-history-undo/02-undo-redo.md §8` table referenced invented tokens `UNDO_TARGET_GONE`, `TARGET_GONE`, `QUOTA_EXCEEDED`, `FORBIDDEN`. None exist in the registry (`18-error-codes.md §3`). Frontend would have no toast key, telemetry would log unknown codes.
**Fix.** Rewrote §8 outcome table to use canonical codes: `GONE_HARD_DELETED`, `GONE_SOFT_DELETED`, `BILLING_QUOTA_EXCEEDED`, `PERM_DENIED`, plus new `HISTORY_*` family (see HU2). Also fixed `03-conflict-resolution.md §10` (`TARGET_GONE` → `GONE_HARD_DELETED`).

### HU2 (S2) — Bare HTTP-status labels in history API contract — CLOSED
`03-api-endpoints/14-history.md §undo` listed errors as `410 GONE` / `409 CONFLICT` / `422 BUSINESS_RULE_VIOLATION` / `403 FORBIDDEN` with `details.reason="..."` discriminators. Violates the locked rule "Frontend MUST switch on `code`, never on `message` or `http_status` alone" (`18-error-codes.md §6`).
**Fix.** Created new `HISTORY_*` family in `18-error-codes.md §3.10` (5 codes: `HISTORY_UNDO_WINDOW_EXPIRED`, `HISTORY_ALREADY_UNDONE`, `HISTORY_ENTITY_MODIFIED_AFTER_EVENT`, `HISTORY_NOT_UNDOABLE`, `HISTORY_REDO_NOT_AVAILABLE`) and rewrote `14-history.md §undo` errors block to reference them. Realtime section renumbered to §3.11.

### HU3 (S3) — Missing back-reference from undo spec to canonical registry — CLOSED
`02-undo-redo.md §8` did not point to the error-code registry. New §8 lead-in cites `03-api-endpoints/18-error-codes.md §3.10` explicitly.

## Files touched
- `spec/21-app/03-api-endpoints/18-error-codes.md` (+1 section, renumber)
- `spec/21-app/03-api-endpoints/14-history.md` (§undo error list rewrite)
- `spec/21-app/12-history-undo/02-undo-redo.md` (§8 table rewrite)
- `spec/21-app/12-history-undo/03-conflict-resolution.md` (§10 row)
- `scripts/lint/naming-convention.allowlist.txt` (+1 audit file)

## Lint status
All 17 sub-checks green.

## Implementability scorecard
Clarity 100 / Consistency 100 / Completeness 100 → **100/100/100** (no change; closed gaps were registry hygiene).
