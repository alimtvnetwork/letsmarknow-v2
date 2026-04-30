<!--
audit-date: 2026-04-30
next-audit-by: 2026-10-27
audit-type: ad-hoc
status: closed
closed-on: 2026-04-30
closed-because: 2 endpoint-canonicality findings opened and closed same session in 07-features/ (19 files, ~2.4k lines) — FT1 (S2 02-save-session.md:33 step 6 referenced bare `/v1/sessions` which is not in registry; line 149 of same file already used canonical `POST /v1/sessions/save` → unified to canonical with cross-ref to 03-api-endpoints/12-sessions-save.md), FT2 (S3 13-command-palette.md:46 used generic `/v1/search?limit=8` for omnibox quick-find; registry designates `/v1/search/quick` as latency-optimized variant for popup/palette consumers per 03-api-endpoints/13-search.md → switched to `GET /v1/search/quick?limit=8`). No ULID, role-enum, color-label, brand, or share-model drift detected. All 60+ cross-folder file refs resolved. All 17 lint sub-checks green.
audit-id: 116
scope: spec/21-app/07-features/
score-before: 100/100
score-after: 100/100
-->

# Audit 116 — `07-features/` broad sweep

**Date:** 2026-04-30 (Session 116, Malaysia ~23:20 UTC+8)
**Folder:** `spec/21-app/07-features/`
**Files reviewed:** 19 markdown files (`00-overview.md` … `18-add-item-hover-button.md` + `readme.md`)

## Method

1. ULID / legacy-error / non-canonical role grep — clean.
2. Endpoint extraction → cross-checked against `03-api-endpoints/00-overview.md` registry.
3. Cross-folder file refs (60+ unique) → all resolve.
4. Role / workspace / color-label / hex usage → conformant to locked enums.

## Findings

| ID | Sev | File | Issue | Fix |
|----|-----|------|-------|-----|
| FT1 | S2 | `02-save-session.md:33` | Step 6 referenced bare `/v1/sessions` (no such endpoint in registry); contradicts step at line 149 (`POST /v1/sessions/save`). | Replaced with canonical `POST /v1/sessions/save` + cross-ref to `12-sessions-save.md`. |
| FT2 | S3 | `13-command-palette.md:46` | Used generic `/v1/search?limit=8` for the omnibox quick-find; registry designates `/v1/search/quick` as the latency-optimized variant for popup/palette consumers. | Switched to `GET /v1/search/quick?limit=8` with §-ref to `03-api-endpoints/13-search.md`. |

No S0/S1 issues. No drift on UUIDv7, role enum, color-label enum, brand color, or share-model v1.

## Outcome

2 endpoint-canonicality fixes (1×S2, 1×S3). No new error codes. No registry changes. All 17 linters green.

## Cross-cutting observations

- `07-features/` is in excellent shape post-prior cycles (next-queue, view-modes, command-palette already had dedicated audits).
- Endpoint references throughout the folder consistently use backtick + method + path form — easy to grep.
- No need for an immediate re-sweep.
