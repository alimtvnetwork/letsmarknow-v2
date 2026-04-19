# 02 — Current Issues (Open)

> **Purpose.** Every open spec defect, with stable ID, severity, evidence, and the file(s) that own the fix. Append-only. Move closed rows to `04-closed-issues.md`.

**Severity legend:** `S0` blocks AI codegen · `S1` causes wrong output · `S2` causes ambiguity · `S3` cosmetic.

**Discovered:** 2026-04-19 (post 100/100 claim).

---

## Open issues

| ID | Sev | Title | Evidence | Owning file(s) for fix | Rule violated (`01-naming-conventions.md` §) |
|---|---|---|---|---|---|
| SI-001 | S1 | Folder sequence has gaps `13` and `21` | `ls spec/21-app/` shows `…12, 14, …20, 22, 23` | `13-spec-issues/` (this folder) fills 13; `21` slot needs decision (fill or reserve) | §2 |
| SI-002 | S1 | Folder `23-audits/` is missing `readme.md` | `ls spec/21-app/23-audits/` returns no `readme.md` | `23-audits/readme.md` (create) | §3 |
| SI-003 | S2 | 14 files in `23-audits/` violate `NN-name.md` numbered prefix rule | Files like `audit.md`, `gap-analysis.md`, `audit-2026-04-18.md` have no `NN-` prefix | `23-audits/` (rename or document audit-files exemption in `01-naming-conventions.md` §1) | §1 |
| SI-004 | S2 | Audit-file naming convention is undocumented | `01-naming-conventions.md` §1 lists `audit-YYYY-MM-DD-topic.md` but does not say whether they need `NN-` prefix or are exempt | `13-spec-issues/01-naming-conventions.md` (clarify) | §1 |
| SI-005 | S2 | `23-audits/` has no `00-overview.md` despite locked rule "every folder has one" | The CI sub-check `folder-overview` in `22-infrastructure/09-ci-cd.md` claims this is enforced — yet `23-audits/00-overview.md` exists, so this needs verification | re-verify; close if false-positive | §3 |
| SI-006 | S2 | `23-audits/` has no `flow-diagram.mmd` | Same locked rule as SI-005 | `23-audits/flow-diagram.mmd` (create) | §3 |
| SI-007 | S2 | `templates/` folder has no `readme.md`, `00-overview.md`, or `flow-diagram.mmd` | `ls spec/21-app/templates/` returns only `folder-overview.md` and `readme.md`-less | Document `templates/` as exempt in `01-naming-conventions.md` §3, OR add the files | §3 |
| SI-008 | S2 | "TBD" markers remain in 4 locked spec files | Found in `00-overview/04-competitive-analysis.md` line 13, `22-infrastructure/03-env-vars.md` line 93 (allowed — describes a check), `readme.md` line 327, `23-audits/*` (allowed — historical) | `00-overview/04-competitive-analysis.md`, `readme.md` | §7 |
| SI-009 | S3 | Audit chain claims 100/100 but issues SI-001 through SI-008 are now open | `23-audits/audit-2026-04-19-ai-readiness-score.md` lines 60-62 declare `100/100/100` | Add a `Score-invalidation note` row to the live tracker in that file once Phase 1 starts | n/a (process) |
| SI-010 | S2 | `15-feature-flags-and-rollouts.md` placement contradicts no-impl mode | Spec-only mode bans feature-flag implementation work, but `07-features/15-feature-flags-and-rollouts.md` is marked P0 in `07-features/readme.md` | `07-features/readme.md` (clarify: spec lives at P0, implementation deferred) | §7 |

---

## Discovery method

- `find spec/21-app -type d` and `ls` for sequence/file presence.
- `grep -rEho` for naming pattern violations.
- Cross-read with `23-audits/audit-2026-04-19-ai-readiness-score.md` Live Issue Tracker.

## What this list does NOT yet cover (will be added in next audit pass)

- Cross-reference link integrity (does every `02-data-model/05-item.md §3.1` actually point to a section that exists?).
- Per-file content drift (does `04-extension/10-sync-and-offline.md` actually reference `14-realtime-transport.md` after the W-2 closure?).
- Permissions-matrix.json vs `17-admin-org/03-roles.md` field-by-field parity.
- `01-information-architecture/01-hierarchy.md §3.5` (referenced by `07-features/16-delete-with-undo.md`) — does that section exist?
- `06-ui-ux/wireframes/` does it follow folder-overview rule for sub-folders?
- Every `flow-diagram.mmd` for additional unquoted reserved characters (only `08-sharing-collab` was checked).

> Each subsequent "next" from the user adds another batch of findings here, then groups them into a phase in `03-phase-plan.md`.
