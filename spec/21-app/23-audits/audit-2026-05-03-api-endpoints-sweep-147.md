# Audit-147 — API Endpoints Sweep

**Date:** 2026-05-03 (Session 147)
**Scope:** `spec/21-app/03-api-endpoints/` — 24 files + `flow-diagram.mmd`.
**Trigger:** User `next`; folder never broadly audited.

## Method

- `rg` for `workspace`, `ULID`/`01J...` placeholders, hex colors, non-`/v1/` paths.
- Cross-checked placeholder convention against `23-mindmap-layouts.md` (uses canonical UUIDv7 form).

## Findings

| # | Sev | File | Issue | Action |
|---|---|---|---|---|
| F1 | S2 | `15-import-export.md:50` | "does NOT mutate the workspace" | Patched → "Space" |
| F2 | **S1** | 21 files | **162 occurrences of `"01J..."` ULID-shaped placeholders** (`05`, `02`, `11`, `17`, `10`, `09`, `16`, `08`, `15`, `04`, `07`, `01`, `06`, `03`, `22`, `13`, `19`, `14`, `20`, `12`, `00`). Violates Core rule "UUIDv7 everywhere. Never ULID." Risk: AI codegen consuming these as fixtures will emit ULIDs into client SDKs and tests. | **Filed as SI-030** (too broad to fix safely in single session; needs phased plan + lint rule) |

## Verifications (no defect)

- ✅ Hex colors only inside example JSON payloads showing `color`/`avatar_color` field shape (allowed — illustrating user-set custom values, not brand tokens).
- ✅ Apparent non-`/v1/` paths are: (a) shorthand inside §descriptions like `POST /:id/move` (acceptable in narrative), (b) third-party Paddle endpoint `GET /transactions/{id}/invoice`, (c) Mermaid label `POST /items endpoint`. None are spec-declared client routes — clean.
- ✅ Endpoint inventory still 157 declared (per SI-022 closure).

## Result

1 S2 patch applied. **1 new S1 issue opened (SI-030)** — score 100 → 96.

## Files changed

- `spec/21-app/03-api-endpoints/15-import-export.md`
- `spec/21-app/13-spec-issues/02-current-issues.md` (SI-030 added)
- `spec/21-app/00-conversation-log.md`
- `spec/21-app/23-audits/audit-2026-05-03-api-endpoints-sweep-147.md` (new)

## Suggested SI-030 phase plan (for next session)

1. Phase A: Add `scripts/lint/naming-convention.ts` rule banning `"01J..."` pattern (allowlist `23-mindmap-layouts.md` UUIDv7 stub).
2. Phase B: Bulk-replace `"01J..."` → `"0190a4f1-6c5e-7c2a-9b3f-1234567890ab"` across all 21 files (sed; idempotent).
3. Phase C: Re-run lint to confirm exit 0; close SI-030.
