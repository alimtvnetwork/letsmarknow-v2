<!--
audit-date: 2026-04-30
next-audit-by: 2027-04-30
audit-type: ad-hoc
status: closed
closed-on: 2026-04-30
closed-because: Second-pass sweep of 04-extension/ — drift fixes applied.
-->
# Audit — 04-extension/ second-pass sweep (Session 122)

**Date:** 2026-04-30
**Scope:** All 21 files in `spec/21-app/04-extension/` (2,441 lines). Second pass after audit-108. Checks: (a) endpoint canonicality, (b) sync param + error-code drift, (c) ULID/role/Workspace label leakage, (d) realtime SoT conformance.

---

## 1. Findings

| # | Sev | File | Issue | Fix |
|---|---|---|---|---|
| F1 | S2 | `10-sync-and-offline.md §5` | Pull-sync used `?org=<id>&etag=<last_etag>` query params with `next_etag`. Conflicts with canonical `/v1/sync/since?cursor=<opaque>` declaration in `03-api-endpoints/00-overview.md §1.15` and `01-conventions.md §16` rule that org context comes from `bearer+org`, not query. | Rewrote example to `?cursor=<opaque>` + `next_cursor`; removed `?org=` param. |
| F2 | S2 | `10-sync-and-offline.md §5` | References `/v1/sync/full` for full re-pull, but path is undeclared in canonical inventory. Same orphan-endpoint class as SI-022. | Added inventory row `GET /v1/sync/full` to `03-api-endpoints/00-overview.md §1.15`. |
| F3 | S2 | `10-sync-and-offline.md §5` | Stale-cursor `410 GONE` returned with no canonical error code. Inconsistent with locked rule (`mem://index.md`): clients switch on `code`, not `http_status` alone. | Added `GONE_CURSOR_STALE` to `03-api-endpoints/18-error-codes.md §3.3` (toast key `toast.gone.cursor_stale`, details `cursor`, `recovery_endpoint`). Updated extension reference. |
| F4 | none | All files | `grep -nE 'team owner\|team admin\|team member\|ULID\|01H\|Workspace'` → 0 matches. Locked enum + Workspace-split holding. |
| F5 | none | `03-service-worker.md`, `04-popup.md`, `11-auth-bridge.md` | All `/v1/auth/...` references canonical. `signout`, `signout-all`, `token`, OAuth `start`/`callback` all declared. |
| F6 | none | `10-sync-and-offline.md §7` | Realtime correctly cites Supabase Realtime SoT; withdrawn endpoints clearly struck through. |

---

## 2. Verification

- `npx tsx scripts/lint/endpoint-counts.ts` → 172/172, 0 drift, 0 duplicates.
- `npx tsx scripts/lint/error-code-casing.ts` → clean, 91 codes (90 → 91 with new `GONE_CURSOR_STALE`).
- `grep -rnE 'org=<id>|since_etag|next_etag' spec/21-app/04-extension/` → 0 matches.

## 3. Outcome

3 drift fixes (F1, F2, F3) applied. New canonical endpoint `/v1/sync/full` and new error code `GONE_CURSOR_STALE` declared. Error-code registry: 90 → **91 codes** across 11 families. Open SI count = 1 (SI-029, blocked).

## 4. Suggested next sweeps

1. `07-features/` deeper sweep beyond audit-116 (light pass only — many files).
2. `02-data-model/` broad sweep — never broadly audited this cycle.
3. `10-licensing-billing/` sweep — touched only via webhook contracts.
4. `11-import-export/` sweep — broad touchpoint coverage but never audit-targeted.
