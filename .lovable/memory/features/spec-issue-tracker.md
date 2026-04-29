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

## Counts (updated 2026-04-29 Session 28, UTC+8 — after SI-027 close)

- Open: **0**
- Closed: 31
- ✅ **SI-025 CLOSED** Session 18. §7 rebased 183/182 → 171/171 via `--write`. Counter Discipline meta-rule earned its keep on day one. Endpoint inventory: 171 canonical declarations, 0 duplicates, linter green.
- ✅ **SI-026 CLOSED** Session 23. `money-units` linter caught surviving `discount_minor` after W-10 sweep claimed clean.
- ✅ **SI-027 CLOSED** Session 28. `pricing-source` linter caught 2 W-3 drifts in `06-ui-ux/14-copy-voice.md` and `10-licensing-billing/10-coupons-and-promotions.md` — both restating plan prices inline. Rewritten to `{plan.price}` template tokens with link-back to `01-plans-matrix.md §1`. **Linter tally: 11 of 19 sub-checks ✅** (real-drift catch rate 4/11 = 36%).

## Counter discipline (lesson from 2026-04-29 re-audit)

**Never increment `00-overview.md` §7 counts.** Always re-scan and rewrite the table from a fresh row count. Audit `23-audits/audit-2026-04-29-post-fix-reaudit.md` D-1 documents how 26 rows of drift accumulated silently across 3 sessions doing `prev + delta` math.

## False-positive patterns (do not re-flag)

Recorded in `23-audits/audit-2026-04-29-post-fix-reaudit.md` §2:
- FP-1/FP-2: §16 forbidden-alias rule (`sign_in`, `magic_link`, etc.) applies **only to `/v1/...` URL path segments**, not to event names, table names, or email template ids. Anchor any forbidden-alias regex to URL paths.
- FP-3: `00-overview.md` Source-column paths are relative to `03-api-endpoints/` (no `../` prefix).

## Phase queue

1. ✅ **Phase 1 — DONE 2026-04-19.** Locked rules + exemptions. Closed SI-002, 003, 004, 005, 006, 007.
2. ✅ **Phase 2 — collapsed into Phase 1.**
3. ✅ **Phase 3 — DONE 2026-04-19.** Score-invalidation note. Closed SI-009.
4. ✅ **Phase 4 — DONE 2026-04-20.** TBD cleanup. Closed SI-008.
5. ✅ **Phase 5 — DONE 2026-04-20.** Re-audit sweep opened SI-011, 012, 013, 014.
6. ✅ **Phase 6 — DONE 2026-04-20.** Role-scope documentation. Closed SI-011.
7. ✅ **Phase 7 — DONE 2026-04-20.** Mermaid label safety across 13 diagrams. Closed SI-012, 013, 014.
8. ✅ **Phase 8 — DONE 2026-04-20.** Spec-vs-Impl phase clarification. Closed SI-010.
9. ✅ **Phase 9 — DONE 2026-04-20.** Slot-21 decision: keep Reserved permanently as load-bearing buffer between domain folders (`00-`–`20-`) and meta folders (`22-`+). Locked in `13-spec-issues/01-naming-conventions.md §2`. Closed SI-001 at S3 cosmetic. Future "find more" sweeps must NOT re-open.
10. ✅ **Phase 10 — DONE 2026-04-20.** Deep re-audit: 16 cross-refs verified, wireframes exemption verified, endpoint inventory captured. Opened SI-015; closed SI-016/017 as false positives on discovery.
11. ✅ **Phase 11 — DONE 2026-04-20.** Closed SI-015 by adding `15-sku-map.md` to allowed-TBD table in `01-naming-conventions.md §7`.
12. ✅ **Phase 12 — DONE 2026-04-20.** Endpoint parity sweep: 145 declared vs 192 referenced. Opened SI-018/019/020.
13. ✅ **Phase 13.1+13.2 — DONE 2026-04-20.** Locked path-param style + aliases policy. Closed SI-018/019.
14. ✅ **Phase 13.3 — DONE 2026-04-20.** Reclassified SI-020 into SI-020a/b/c/d after per-endpoint origin trace. SI-020 closed as "split".
15. ✅ **Phase 13.4 — DONE 2026-04-20.** SI-020d phantoms verified as real alias defects in `17-admin-org/`. Folded into SI-020b. SI-020d closed.
16. ✅ **Phase 13.5 — DONE 2026-04-20.** Added §9 "Withdrawn endpoints" marker convention. Closed SI-020a.
17. ✅ **Phase 13.6 — DONE 2026-04-20.** Rewrote §16 with 17 verified canonical mappings; swept 11 referencing files; reconciled `items:batch` contradiction. Closed SI-020b.
18. ✅ **Phase 13.7a-g — DONE 2026-04-20.** Added 24 missing endpoint declarations across 7 sub-phases; +5 new endpoint files; rebased count to 145. Closed SI-020c.
19. ✅ **Phase 14 — DONE 2026-04-29.** Glossary term coverage sweep. 6 real gaps closed. Glossary 53 → 59. Audit: `audit-2026-04-29-glossary-sweep.md`.
20. ✅ **Phase 15 — DONE 2026-04-29.** Toby Collections parity (SI-021). 8 sub-tasks. Audit: `audit-2026-04-29-toby-parity-delta.md`.
21. ✅ **Phase 16 — DONE 2026-04-29 (Sessions 11–15).** Linter/governance hardening. Closed SI-022/023/024. Endpoint inventory rebased to 183 rows / 182 distinct. `spec-drift-linter` grew from 13 → 18 sub-checks. Three meta-rules locked: Counter Discipline (§2.1.1 `endpoint-counts`), Allowlist Discipline (§2.1.3 + `allowlist-discipline`), Audit Cadence (§2.1.4 + `audit-cadence`). All 18 audit files backfilled with cadence metadata; 1 open (`audit-2026-04-29-ai-readiness-score-v2.md`), 4 superseded, 13 closed. Spec corpus is now self-governing across content, process, and time.

**Phase queue is empty. No open phases. No open SIs. Spec is implementation-ready.**

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
