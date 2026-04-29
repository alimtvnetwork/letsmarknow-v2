# 00 — Audit folder overview

> Single home for all audit, gap-analysis, scoring, sequencing, and retrospective documents that score or critique the spec corpus. Moved here on 2026-04-19 to keep `spec/21-app/` root clean and make audit history discoverable as a unit.

---

## Responsibilities

- Hold every **point-in-time audit** of the spec (dated `audit-YYYY-MM-DD-*.md`).
- Hold the **living gap-analysis tracker** (`gap-analysis.md`) and the **historical seed audit** (`audit.md`).
- Provide a stable, predictable location so CI linters, hand-off prompts, and future auditors all know where to look.
- Preserve traceability: every W-/M-/F-/B-class issue cited in domain folders resolves to a file under this folder.

## File-by-file behaviour

| File | Role |
|---|---|
| `audit.md` | Original seed audit — narrative critique that opened the W-/M-/F-/B- issue families. Historical baseline; do not edit retroactively. |
| `gap-analysis.md` | Living closure tracker. TL;DR scorecard + per-issue status. Updated on every fix PR. |
| `audit-2026-04-18.md` | First dated full-corpus audit. Historical snapshot. |
| `audit-2026-04-19-spec-internal.md` | Internal-consistency audit (cross-file contradictions). |
| `audit-2026-04-19-spec-wide.md` | W-issues catalogue (W-1 … W-13) — the definitive list of spec-wide drift items. |
| `audit-2026-04-19-m-gaps.md` | M-issue closures (M1 … M14, F-M*) — content gaps identified and fixes shipped. |
| `audit-2026-04-19-ai-readiness-score.md` | Per-domain `/100` scoring + Live Issue Tracker. **Canonical scoreboard.** Updated after every closure per `mem://preference/audit-tracker-protocol`. |
| `audit-2026-04-19-rescore-delta.md` | v1 delta: lowest-4 domains rescored after W-1/W-2/W-3 fixes. |
| `audit-2026-04-19-rescore-delta-v2.md` | v2 delta: cumulative all-21-domains baseline → 100/100/100. |
| `audit-2026-04-19-100-retrospective.md` | Closing narrative + maintenance contract once the corpus hit 100/100/100. Source of the F-FOLDER-OVERVIEW lock. |
| `audit-2026-04-19-decisions-needed.md` | Open product/architecture decisions surfaced by the audit but not yet resolved. |
| `audit-2026-04-19-sequencing.md` | Recommended fix-order across W-/M-/F- items based on dependency graph. |
| `audit-2026-04-19-weakest-files-plan.md` | Per-file remediation plan for files scoring below threshold. |

## Tasks performed

- **Tracking** — every audit issue (W-*, M-*, F-M*, B-*) has a row in `gap-analysis.md` and a status in `audit-2026-04-19-ai-readiness-score.md`.
- **Locking** — closed issues are pinned by `spec-drift-linter` sub-checks defined in `22-infrastructure/09-ci-cd.md` §2.1.1, which sources its rules from this folder.
- **Re-scoring** — when a domain folder is materially changed, append a new `rescore-delta-vN.md` rather than mutating prior deltas.
- **Decision capture** — open product questions land in `audit-2026-04-19-decisions-needed.md` until resolved into the relevant domain spec.

## What this folder is NOT

- **Not roadmap.** Sequencing here is fix-order, not feature-order. Roadmap lives in `20-roadmap/`.
- **Not a changelog.** Per-PR change history lives in git; this folder is audit-grade snapshots.
- **Not domain spec.** No feature definitions, data models, or API shapes — those live in numbered domain folders. Audit files only cite them.
- **Not editable history.** Dated audit files are immutable after publication; corrections go into a new dated file.


## Audit cadence registry

Auto-generated from the metadata block at the top of each `audit-*.md` file (see `22-infrastructure/09-ci-cd.md §2.1.4` Audit Cadence meta-rule). The `audit-cadence` sub-check of `spec-drift-linter` regenerates this table on every PR and fails on drift.

**Invariant:** at most ONE row may carry `status: open` per `audit-type`. Currently 1 open (`ai-readiness` — `audit-2026-04-29-ai-readiness-score-v2.md`).

| File | Type | Audit date | Next audit by | Status |
|---|---|---|---|---|
| `audit-2026-04-18.md` | ad-hoc | 2026-04-18 | 2027-04-18 | closed |
| `audit-2026-04-19-100-retrospective.md` | retrospective | 2026-04-19 | 2027-04-19 | closed |
| `audit-2026-04-19-ai-readiness-score.md` | ai-readiness | 2026-04-19 | 2026-07-18 | superseded |
| `audit-2026-04-19-decisions-needed.md` | ad-hoc | 2026-04-19 | 2027-04-19 | closed |
| `audit-2026-04-19-impl-vs-spec.md` | parity | 2026-04-19 | 2026-10-16 | closed |
| `audit-2026-04-19-m-gaps.md` | ad-hoc | 2026-04-19 | 2027-04-19 | closed |
| `audit-2026-04-19-rescore-delta-v2.md` | ai-readiness | 2026-04-19 | 2026-07-18 | superseded |
| `audit-2026-04-19-rescore-delta.md` | ai-readiness | 2026-04-19 | 2026-07-18 | superseded |
| `audit-2026-04-19-sequencing.md` | ad-hoc | 2026-04-19 | 2027-04-19 | closed |
| `audit-2026-04-19-spec-internal.md` | ad-hoc | 2026-04-19 | 2027-04-19 | closed |
| `audit-2026-04-19-spec-wide.md` | ad-hoc | 2026-04-19 | 2027-04-19 | closed |
| `audit-2026-04-19-weakest-files-plan.md` | ad-hoc | 2026-04-19 | 2027-04-19 | closed |
| `audit-2026-04-20-rescore-delta-v3.md` | ai-readiness | 2026-04-20 | 2026-07-19 | superseded |
| `audit-2026-04-29-ai-readiness-score-v2.md` | ai-readiness | 2026-04-29 | 2026-07-28 | open |
| `audit-2026-04-29-glossary-sweep.md` | glossary | 2026-04-29 | 2027-04-29 | closed |
| `audit-2026-04-29-orphan-endpoint-sweep.md` | endpoint-sweep | 2026-04-29 | 2026-10-26 | superseded |
| `audit-2026-04-29-post-fix-reaudit.md` | endpoint-sweep | 2026-04-29 | 2026-10-26 | closed |
| `audit-2026-04-29-toby-parity-delta.md` | parity | 2026-04-29 | 2026-10-26 | closed |

## Cross-references

- Linter that locks audit closures: `22-infrastructure/09-ci-cd.md` §2.1.1 (`spec-drift-linter`).
- Folder-overview rule (sub-check 12) sourced from: `23-audits/audit-2026-04-19-100-retrospective.md`.
- Issue families originate from: `23-audits/audit.md` and `23-audits/gap-analysis.md`.
- Memory pointer: `mem://features/gap-analysis-state` tracks open vs. closed gap items.
- Tracker-update protocol: `mem://preference/audit-tracker-protocol`.
