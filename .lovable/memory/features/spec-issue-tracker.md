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

## Counts (updated 2026-04-29, UTC+8 — after SI-021 opened)

- Open: **1** (SI-021, S1 — Toby Collections parity, 8 sub-tasks)
- Closed: 24
- By severity (open): S0 = 0 · S1 = 1 · S2 = 0 · S3 = 0
- ✅ **SI-001 CLOSED** at S3 (downgraded from S1). Slot `21-` is now a **permanent intentional buffer** between per-domain folders (`00-`–`20-`) and meta folders (`22-`, `23-`). Locked in `13-spec-issues/01-naming-conventions.md §2`. Future audits must NOT re-open this — read §2 first.
- 🆕 **SI-021 OPEN** — Toby Collections feature parity. Container mapping resolved as **split**: Space owns Collection hierarchy; Org owns admin/billing/members. 8 sub-tasks listed in `02-current-issues.md`.
- ✅ **SI-020c CLOSED** at Phase 13.7g — 24/24 endpoints declared; `00-overview.md` total: 136 → 145.

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
12. ✅ **Phase 12 — DONE 2026-04-20.** Endpoint parity sweep: 145 declared vs 192 referenced. Opened SI-018/019/020.
13. ✅ **Phase 13.1+13.2 — DONE 2026-04-20.** Locked path-param style + aliases policy. Closed SI-018/019.
14. ✅ **Phase 13.3 (classification) — DONE 2026-04-20.** Reclassified SI-020 into SI-020a/b/c/d after per-endpoint origin trace. SI-020 closed as "split". No spec rows added yet.
15. ✅ **Phase 13.4 — DONE 2026-04-20.** SI-020d phantoms verified as real alias defects in `17-admin-org/`. Folded into SI-020b (now 17 mappings instead of 14). SI-020d closed.
16. ✅ **Phase 13.5 — DONE 2026-04-20.** Added §9 "Withdrawn endpoints" marker convention (`~~WITHDRAWN: METHOD /v1/path~~`) to `01-naming-conventions.md` and applied to `04-extension/10-sync-and-offline.md:78`. Closed SI-020a.
17. ✅ **Phase 13.6 — DONE 2026-04-20.** Rewrote §16 with 17 verified canonical mappings, swept 11 referencing files, reconciled `items:batch` contradiction (canonical = `POST /v1/bulk/items`). §16.3 conformance grep clean. Closed SI-020b.
16. **Phase 13.5** — Resolve SI-020a (withdrawn-endpoint marker convention in `01-conventions.md` or `01-naming-conventions.md`).
17. **Phase 13.6** — Resolve SI-020b (extend §16 alias table with 14 mappings + sweep referencing files; reconcile `items:batch` contradiction).
18. **Phase 13.7** — Resolve SI-020c (add 17-24 new declared rows across 7-12 files). Largest, do last.
19. **Phase 14** — Optional: glossary term coverage sweep across feature files.

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
