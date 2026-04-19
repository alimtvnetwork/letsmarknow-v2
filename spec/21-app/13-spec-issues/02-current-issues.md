# 02 — Current Issues (Open)

> **Purpose.** Every open spec defect, with stable ID, severity, evidence, and the file(s) that own the fix. Append-only. Move closed rows to `04-closed-issues.md`.

**Severity legend:** `S0` blocks AI codegen · `S1` causes wrong output · `S2` causes ambiguity · `S3` cosmetic.

**Discovered:** 2026-04-19 (post 100/100 claim).

---

## Open issues

| ID | Sev | Title | Evidence | Owning file(s) for fix | Rule violated (`01-naming-conventions.md` §) |
|---|---|---|---|---|---|
| SI-001 | S1 | Folder sequence has gap `21` | `ls spec/21-app/` shows `…20, 22, 23`. Slot `13` filled by this folder. | `13-spec-issues/01-naming-conventions.md §2` (slot `21` documented as Reserved/empty) | §2 |
| SI-008 | S2 | "TBD" markers remain in 2 locked spec files | `00-overview/04-competitive-analysis.md` line 13, `readme.md` line 327. (`22-infrastructure/03-env-vars.md` line 93 allowed — describes a linter pattern. `23-audits/*` allowed — historical audit prose.) | `00-overview/04-competitive-analysis.md`, `readme.md` | §7 |
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
