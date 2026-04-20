---
name: Spec Issue Tracker
description: Live counts and pointer for the 13-spec-issues/ folder. Mirror of 02-current-issues.md so the audit state survives across sessions.
type: feature
---

# Spec Issue Tracker

**Source of truth:** `spec/21-app/13-spec-issues/02-current-issues.md`
**Phase plan:** `spec/21-app/13-spec-issues/03-phase-plan.md`
**Closed archive:** `spec/21-app/13-spec-issues/04-closed-issues.md`
**Naming rules:** `spec/21-app/13-spec-issues/01-naming-conventions.md`

## Counts (updated 2026-04-20, UTC+8 — after Phase 12)

- Open: **4** (SI-001 decision-pending; SI-018/019/020 from endpoint parity sweep)
- Closed: 16 (SI-002 fixed; SI-003/004/007 by exemption; SI-005/006 false positives; SI-009 process; SI-008 TBD cleanup; SI-011 role-scope doc; SI-012/013 Mermaid; SI-014 verification; SI-010 spec-vs-impl; SI-016/017 Phase-10 false positives; SI-015 allowed-TBD doc)
- By severity (open): S0 = 0 · S1 = 2 (SI-001, SI-020) · S2 = 2 (SI-018, SI-019) · S3 = 0

## Phase queue

1. ✅ **Phase 1 — DONE 2026-04-19.** Locked rules + exemptions. Closed SI-002, 003, 004, 005, 006, 007.
2. ✅ **Phase 2 — collapsed into Phase 1.**
3. ✅ **Phase 3 — DONE 2026-04-19.** Score-invalidation note. Closed SI-009.
4. ✅ **Phase 4 — DONE 2026-04-20.** TBD cleanup. Closed SI-008.
5. ✅ **Phase 5 — DONE 2026-04-20.** Re-audit sweep opened SI-011, 012, 013, 014.
6. ✅ **Phase 6 — DONE 2026-04-20.** Role-scope documentation. Closed SI-011.
7. ✅ **Phase 7 — DONE 2026-04-20.** Mermaid label safety across 13 diagrams. Closed SI-012, 013, 014.
8. ✅ **Phase 8 — DONE 2026-04-20.** Spec-vs-Impl phase clarification. Closed SI-010.
9. **Phase 9** — DECISION REQUIRED on SI-001 (slot 21 — keep Reserved permanently / fill / renumber).
10. ✅ **Phase 10 — DONE 2026-04-20.** Deep re-audit: 16 cross-refs verified, wireframes exemption verified, endpoint inventory captured. Opened SI-015; closed SI-016/017 as false positives on discovery.
11. ✅ **Phase 11 — DONE 2026-04-20.** Closed SI-015 by adding `15-sku-map.md` to allowed-TBD table in `01-naming-conventions.md §7`.
12. ✅ **Phase 12 — DONE 2026-04-20.** Endpoint parity sweep: 145 declared vs 192 referenced. Opened SI-018 (`{id}` vs `:id` style, 4 endpoints, S2), SI-019 (7 alias paths, S2), SI-020 (38 truly-missing endpoints, S1).
13. **Phase 13** — Endpoint parity remediation. Lock path-style + alias policy in `01-conventions.md`, then add the 38 missing rows. Plan in `03-phase-plan.md`.
14. **Phase 14** — Optional: glossary term coverage sweep across feature files.

## Rules

- Every "next" from the user advances **one phase** at a time.
- After every phase: update this file's counts AND move closed rows from `02-current-issues.md` → `04-closed-issues.md`.
- The 100/100 score in `23-audits/audit-2026-04-19-ai-readiness-score.md` is **stale** while open count > 0 in `02-current-issues.md`.
- Never re-grade upward without closing the open list first.
- **False positives** are recorded in `04-closed-issues.md` with evidence so the same detection error is not repeated.

## How to apply

When user says "audit" / "find more" / "dig" → append new SI-NNN rows to `02-current-issues.md`, do NOT fix.
When user says "next" → execute the next un-done phase in `03-phase-plan.md`, update both the issue file and this memory.
When user says "plan" / "re-plan" → rewrite `03-phase-plan.md` grouping into ≤ 5-issue phases.
