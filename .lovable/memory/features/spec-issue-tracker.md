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

## Counts (updated 2026-04-19, UTC+8 — after Phase 3)

- Open: **3** (SI-001, SI-008, SI-010)
- Closed: 7 (SI-002 fixed; SI-003/004/007 closed by exemption clause; SI-005/006 false positives; SI-009 closed by process update)
- By severity (open): S0 = 0 · S1 = 1 · S2 = 2 · S3 = 0

## Phase queue

1. ✅ **Phase 1 — DONE 2026-04-19.** Locked rules in `01-naming-conventions.md` (Exemptions tables for audit files + templates folder + slot 21 reservation). Created `23-audits/readme.md`. Closed SI-002, 003, 004, 005, 006, 007.
2. ✅ **Phase 2 — collapsed into Phase 1** (rules + audit-naming were edited together).
3. ✅ **Phase 3 — DONE 2026-04-19.** Added Post-100 backlog row + score-invalidation note to `audit-2026-04-19-ai-readiness-score.md`. Closed SI-009.
4. **Phase 4** — TBD/TODO stub cleanup. Closes SI-008.
5. **Phase 5** — Re-audit sweep (will OPEN more issues).
6. **Phase 6** — Resolve SI-010 (P0 vs no-impl mode for feature flags).
7. **Phase 7** — Resolve SI-001 fully (slot 21 — currently documented as Reserved/empty).

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
