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

## Counts (updated 2026-04-20, UTC+8 — after Phase 5 re-audit)

- Open: **5** (SI-001, SI-010, SI-011, SI-012, SI-013) — SI-014 verification-only, recorded but not counted
- Closed: 8 (SI-002 fixed; SI-003/004/007 closed by exemption; SI-005/006 false positives; SI-009 process; SI-008 TBD cleanup)
- By severity (open): S0 = 0 · S1 = 2 (SI-001, SI-011) · S2 = 3 (SI-010, SI-012, SI-013) · S3 = 0

## Phase queue

1. ✅ **Phase 1 — DONE 2026-04-19.** Locked rules, exemptions, slot 21 reserved. Closed SI-002, 003, 004, 005, 006, 007.
2. ✅ **Phase 2 — collapsed into Phase 1.**
3. ✅ **Phase 3 — DONE 2026-04-19.** Score-invalidation note added. Closed SI-009.
4. ✅ **Phase 4 — DONE 2026-04-20.** TBD cleanup. Closed SI-008.
5. ✅ **Phase 5 — DONE 2026-04-20.** Re-audit sweep opened SI-011, SI-012, SI-013, SI-014.
6. **Phase 6** — Resolve SI-011 (permissions-matrix.json role parity — 8 vs 7).
7. **Phase 7** — Resolve SI-012 + SI-013 (Mermaid label safety sweep across 10+5 diagrams).
8. **Phase 8** — Resolve SI-010 (P0 vs no-impl mode for feature flags).
9. **Phase 9** — Resolve SI-001 (slot 21 — keep Reserved or fill).
10. **Phase 10** — Optional re-audit: full cross-ref sweep, glossary coverage, endpoint parity.

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
