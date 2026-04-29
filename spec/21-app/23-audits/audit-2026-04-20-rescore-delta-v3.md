<!--
audit-date: 2026-04-20
next-audit-by: 2026-07-19
audit-type: ai-readiness
status: superseded
supersedes: (none — this file IS superseded BY audit-2026-04-29-ai-readiness-score-v2.md)
superseded-by: audit-2026-04-29-ai-readiness-score-v2.md
closed-on: 2026-04-29
closed-because: Replaced by audit-2026-04-29-ai-readiness-score-v2.md.
-->
# Audit — 2026-04-20 — Post-100 backlog full closure (rescore delta v3)

> **Purpose.** Companion to `audit-2026-04-19-ai-readiness-score.md`. Documents the closure of the post-100 backlog opened on 2026-04-19 evening, which had invalidated the 100/100/100 score for ≈ 24 hours.

## Summary

**Period:** 2026-04-19 evening → 2026-04-20.
**Phases executed:** 1 → 9 (linear) and 13.1 → 13.7g (endpoint-parity remediation, sub-phased).
**Issues opened during the cycle:** 24 (SI-001 through SI-020 with sub-letters a/b/c/d).
**Issues closed during the cycle:** 24.
**Open count at 2026-04-20 close-of-day (UTC+8):** **0**.
**Score:** invalidated → **100 / 100 / 100** restored.

## What changed in the spec

### Endpoint surface (largest delta)

| Metric | Before (2026-04-19) | After (2026-04-20) | Delta |
|---|---:|---:|---:|
| `00-overview.md` declared endpoints | 136 | 145 | +9 net |
| Endpoint contract files | 19 (`00-`–`18-`) | 24 (`00-`–`23-`) | +5 |
| Alias-table mappings (`§16`) | 8 | 17 + 3 (Phase 13.7d additions) = 20 | +12 |
| Conformance-grep coverage | 8 patterns | 13 patterns | +5 |
| Conformance-grep violations | 38 | 0 | −38 |

### New endpoint files (5)

| File | Endpoints | Source phase |
|---|---:|---|
| `19-account.md` | 2 (`PATCH /v1/account/preferences`, `POST /v1/me/gdpr-export`) | 13.7b |
| `20-jobs.md` | 1 (`GET /v1/jobs/:job_id`) | 13.7g |
| `21-flags.md` | 1 (`POST /v1/flags/evaluate`) | 13.7g |
| `22-internal.md` | 1 (`POST /v1/internal/feedback`) | 13.7g |
| `23-mindmap-layouts.md` | 5 (full CRUD + list) | 13.7g |

### Locked rules added during the cycle

| Rule | File | Phase |
|---|---|---|
| Path-param style `:name` (not `{name}`) is mandatory | `03-api-endpoints/01-conventions.md §1.1` | 13.1 |
| Endpoint aliases require canonical mapping in §16 | `03-api-endpoints/01-conventions.md §16` | 13.2 |
| Withdrawn endpoints use `~~WITHDRAWN: METHOD /v1/path~~` marker | `13-spec-issues/01-naming-conventions.md §9` | 13.5 |
| Slot `21-` is a permanent intentional buffer (not a gap) | `13-spec-issues/01-naming-conventions.md §2` | 9 |
| Audit-history `TBD/TODO` are allowed cases (documented) | `13-spec-issues/01-naming-conventions.md §7` | 4, 11 |

### Files swept (alias normalization)

11 files in Phase 13.6 (SI-020b) + 6 files in Phase 13.7d/g (SI-020c sub-sweeps):

`07-features/10-bulk-operations.md`, `08-sharing-collab/03-password-shares.md`, `09-auth-accounts/02-signup-and-signin.md`, `09-auth-accounts/06-sessions.md`, `09-auth-accounts/11-rate-limits-and-abuse.md`, `09-auth-accounts/13-rate-limit-values.md`, `10-licensing-billing/03-stripe-integration.md`, `10-licensing-billing/04-paddle-integration.md`, `11-import-export/07-webhooks-and-api-imports.md`, `11-import-export/09-gdpr-export.md`, `12-history-undo/01-event-log.md`, `15-visualization/04-mindmap-view.md`, `15-visualization/05-tabextend-column-view.md`, `15-visualization/06-resizable-sections.md`, `15-visualization/readme.md`, `17-admin-org/02-members-management.md`, `17-admin-org/05-data-export-delete.md`, `22-infrastructure/06-cdn-storage.md`.

## Per-target rescore math

| Target AI | v6 (post-m-gap) | v7 (post-100, 2026-04-19) | v7-invalidated (post-100 backlog) | **v8 (post-13.7g + Phase 9)** |
|---|---:|---:|---:|---:|
| Lovable | 91 | **100** | TBR | **100** |
| Cursor / Claude-Code | 95 | **100** | TBR | **100** |
| Raw-LLM | 70 | **100** | TBR | **100** |

**Why v8 holds at 100 (not >100 — there is no >100):**
The 24 closed issues were all defects against the rule set that earned 100/100/100 in the first place. Closing them returns the score to 100; it does not push it higher. What the cycle DID add is **resilience**: every closed issue has a conformance grep, an alias-table entry, or a documented exemption that prevents the same defect class from re-opening in a future audit.

## Defensible-100 evidence

Three signals must all be green for the 100/100/100 score to be claimable. As of 2026-04-20:

| Signal | State | Evidence |
|---|---|---|
| `13-spec-issues/02-current-issues.md` open count | **0** | `grep -cE '^\| SI-[0-9]+[a-z]? \| S[0-3] \\| (?!✅)' returns 0` |
| Conformance grep (`01-conventions.md §16.3`) violations | **0** | Phase 13.7g run, see closure note in `02-current-issues.md` |
| All "Live Issue Tracker" rows in `audit-2026-04-19-ai-readiness-score.md` | ✅ CLOSED or ⚪ DEFERRED | Includes the formerly-🟡 "Post-100 backlog" row, closed 2026-04-20 |

If any of the three flips, the 100 must be invalidated again per the audit-tracker protocol (`mem://preference/audit-tracker-protocol`).

## Maintenance contract (unchanged from v7)

- Every new spec PR passes `spec-drift-linter` (`22-infrastructure/09-ci-cd.md §2.1.1`).
- Every new folder ships its `00-overview.md` (template at `spec/21-app/templates/folder-overview.md`).
- Quarterly re-audit; any domain < 95 → P1 ticket. **Next due ≈ 2026-07-19.**
- New drift class → new sub-check in same PR (and a new SI-NNN in `02-current-issues.md`).
- New endpoint → row in `00-overview.md` AND a contract section in the owning `03-api-endpoints/NN-*.md` file (the §16.3 grep enforces this).
