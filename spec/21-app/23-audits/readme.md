# 23 — Audits

> **Purpose.** Folder index for every spec audit, gap-analysis, scoring document, and retrospective. Audit files are append-only history; they document the state of the spec at a point in time, not a current rule. For current rules see `13-spec-issues/01-naming-conventions.md`. For the current open issue list see `13-spec-issues/02-current-issues.md`.

---

## Reading order

Audit files are dated, not numbered. Read in chronological order:

1. `audit.md` — original seed audit. The W-/M-/F-/B- issue families originate here.
2. `gap-analysis.md` — living closure tracker for the W-/M-/F- families.
3. `audit-2026-04-18.md` — first dated full-corpus audit.
4. `audit-2026-04-19-spec-internal.md` — internal-consistency audit.
5. `audit-2026-04-19-spec-wide.md` — definitive W-issues catalogue (W-1 … W-13).
6. `audit-2026-04-19-m-gaps.md` — M-issue closures (M1 … M14, F-M*).
7. `audit-2026-04-19-impl-vs-spec.md` — implementation-vs-spec drift report.
8. `audit-2026-04-19-decisions-needed.md` — open decisions surfaced but not yet locked.
9. `audit-2026-04-19-sequencing.md` — fix-order recommendation.
10. `audit-2026-04-19-weakest-files-plan.md` — per-file remediation plan.
11. `audit-2026-04-19-rescore-delta.md` — v1 rescore (lowest-4 domains).
12. `audit-2026-04-19-rescore-delta-v2.md` — v2 rescore (all 21 domains → 100).
13. `audit-2026-04-19-ai-readiness-score.md` — **canonical scoreboard.** Live Issue Tracker + per-domain scores.
14. `audit-2026-04-19-100-retrospective.md` — closing narrative once the corpus hit 100/100/100.
15. `audit-2026-04-20-rescore-delta-v3.md` — v3 rescore (post-100 backlog fully closed; 24 SI-NNN issues resolved across Phases 1–9 + 13.1–13.7g; 100/100/100 restored).

## Files

| File | Role |
|---|---|
| `00-overview.md` | What this folder owns. |
| `audit.md` | Seed audit (historical). |
| `gap-analysis.md` | Living closure tracker for the historical W-/M-/F- chain. |
| `audit-YYYY-MM-DD-{topic}.md` | Dated audit reports — append-only. |
| `flow-diagram.mmd` | Audit lifecycle diagram. |

## Locked rules

- **Audit-file naming exemption.** Audit reports use `audit-YYYY-MM-DD-{topic}.md` and **DO NOT** require an `NN-` numbered prefix. They are append-only history, not a sequenced document set. This exemption is locked in `13-spec-issues/01-naming-conventions.md §1`.
- **Append-only.** Never edit a historical audit retroactively. To update a finding, write a new dated file or update the live tracker in `audit-2026-04-19-ai-readiness-score.md`.
- **Live tracker is canonical.** When a W-/M-/F- issue is fixed, update the Live Issue Tracker table in `audit-2026-04-19-ai-readiness-score.md` per `mem://preference/audit-tracker-protocol`. Do not edit the original catalogue row.
- **Score is a snapshot.** The `100/100/100` declared on 2026-04-19 reflects only the W-/M-/F- chain that existed at that moment. Subsequent issues live in `13-spec-issues/02-current-issues.md` and invalidate the score until closed.
- **Scope.** This folder critiques the spec. It does not set rules. Rules live in `13-spec-issues/01-naming-conventions.md` and the per-domain folders.

## Cross-references

- `13-spec-issues/02-current-issues.md` — current open spec defects (post-100 backlog).
- `13-spec-issues/01-naming-conventions.md` — the rule set audits compare against.
- `mem://preference/audit-tracker-protocol` — how to update the Live Issue Tracker.
