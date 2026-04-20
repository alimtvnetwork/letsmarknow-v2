# 04 — Closed Issues (Archive)

> **Purpose.** Permanent record of fixed spec defects. Rows move here from `02-current-issues.md` once the corresponding phase step in `03-phase-plan.md` completes. Never delete a row.

| ID | Closed | Sev | Title | Fix reference |
|---|---|---|---|---|
| SI-002 | 2026-04-19 | S1 | `23-audits/` missing `readme.md` | Created `spec/21-app/23-audits/readme.md` (Phase 1.2) |
| SI-003 | 2026-04-19 | S2 | 14 audit files violate `NN-` numbered prefix rule | Closed by exemption — `13-spec-issues/01-naming-conventions.md §1` Exemptions table now lists `audit-YYYY-MM-DD-{topic}.md`, `audit.md`, and `gap-analysis.md`. No file renamed (history preserved). (Phase 1.4) |
| SI-004 | 2026-04-19 | S2 | Audit-file naming convention undocumented | Closed in same edit as SI-003: `13-spec-issues/01-naming-conventions.md §1` Exemptions table + `23-audits/readme.md` Locked rules section. (Phase 1.4) |
| SI-005 | 2026-04-19 | S2 | `23-audits/` missing `00-overview.md` | **False positive** — file already exists at `spec/21-app/23-audits/00-overview.md` (3939 bytes). Detection error in initial Phase-0 sweep. (Phase 1.1) |
| SI-006 | 2026-04-19 | S2 | `23-audits/` missing `flow-diagram.mmd` | **False positive** — file already exists at `spec/21-app/23-audits/flow-diagram.mmd` (15 lines, `flowchart TD`). Detection error in initial Phase-0 sweep. (Phase 1.1) |
| SI-007 | 2026-04-19 | S2 | `templates/` folder missing required `readme.md`/`overview`/`diagram` | Closed by exemption — `13-spec-issues/01-naming-conventions.md §3` Exempt-folders table now lists `templates/` (process-meta, not a domain). No files added. (Phase 1.4) |
| SI-009 | 2026-04-19 | S3 | Audit chain claims 100/100 but post-100 backlog exists | Added "Post-100 backlog" row to Live Issue Tracker + score-invalidation note in Score-progression table. `audit-2026-04-19-ai-readiness-score.md` lines 40, 62. (Phase 3) |
| SI-008 | 2026-04-20 | S2 | "TBD" markers remain in 2 locked spec files | Replaced TBDs in `00-overview/04-competitive-analysis.md` line 13 + `readme.md` line 327 with canonical free-tier cap (50 items). Documented remaining allowed TBDs in `01-naming-conventions.md §7`. (Phase 4) |

---

## Closure rules

- A row is moved here only when the fix is committed to the owning file.
- The "Fix reference" column links to the file path + section number where the fix landed.
- Severity is preserved at closure (do not downgrade after the fact).
- Phase number is recorded in parentheses.
- **False positives** (defects that turned out not to exist) ARE recorded here with the evidence so the same detection error is not repeated.
