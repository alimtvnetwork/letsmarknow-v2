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

## Counts (updated 2026-04-19, UTC+8)

- Open: **10** (SI-001 through SI-010)
- Closed: 0
- By severity: S0 = 0 · S1 = 2 · S2 = 7 · S3 = 1

## Phase queue

1. **Phase 1** — Lock rules + fix folder structure (`13-`, `23-`). Touches `23-audits/readme.md`, `23-audits/flow-diagram.mmd`, `01-naming-conventions.md`.
2. **Phase 2** — Audit-file naming policy. Closes SI-003, SI-004.
3. **Phase 3** — Invalidate stale 100/100 score. Closes SI-009.
4. **Phase 4** — TBD/TODO stub cleanup. Closes SI-008.
5. **Phase 5** — Re-audit sweep (will OPEN more issues, not close).

## Rules

- Every "next" from the user advances **one** step inside the lowest-numbered open phase.
- After every fix: update this file's counts AND move the row in `02-current-issues.md` → `04-closed-issues.md`.
- The 100/100 score in `23-audits/audit-2026-04-19-ai-readiness-score.md` is **stale** while open count > 0. Phase 3 records that fact in the audit file itself.
- Never re-grade upward without closing the open list first.

## How to apply

When user says "audit" / "find more" / "dig" → append new SI-NNN rows to `02-current-issues.md`, do NOT fix.
When user says "next" → execute the next step in `03-phase-plan.md`, update both the issue file and this memory.
When user says "plan" / "re-plan" → rewrite `03-phase-plan.md` grouping into ≤ 5-issue phases.
