# 03 — Phase Plan

> **Purpose.** The sequential do-list. Each phase is small (≤ 5 issues, ≤ 2 folders touched) so a single "next" from the user can complete cleanly. Phases are executed in order; nothing skips ahead.

---

## Sequencing principle

1. Lock the rules first (Phase 1) so every later phase has an objective standard.
2. Fix structural defects (folders, indexes, sequence) before content drift.
3. Fix S0/S1 before S2/S3.
4. Each phase ends with a memory update (`mem://features/spec-issue-tracker.md`) and an updated readiness-score note.

---

## Phase 1 — Lock the rules and fix folder structure

**Touches:** `13-spec-issues/`, `23-audits/`
**Issues closed:** SI-001 (partial — fills slot 13), SI-002, SI-005 (verify), SI-006, SI-007 (decide policy)

| Step | Action | File | Owns rule |
|---|---|---|---|
| 1.1 | Verify `23-audits/00-overview.md` exists (SI-005 verification) | `23-audits/00-overview.md` | §3 |
| 1.2 | Create `23-audits/readme.md` listing every audit file in chronological order | `23-audits/readme.md` | §3 |
| 1.3 | Create `23-audits/flow-diagram.mmd` (audit lifecycle: discover → score → close → re-score) | `23-audits/flow-diagram.mmd` | §3 + §6 |
| 1.4 | Document `templates/` as exempt from the readme/overview/flow-diagram rule in `01-naming-conventions.md` §3, OR add the files | `13-spec-issues/01-naming-conventions.md` | §3 |
| 1.5 | Decide slot `21` policy (fill, reserve, or document gap) and update `01-naming-conventions.md` §2 reservation list | `13-spec-issues/01-naming-conventions.md` | §2 |

**Definition of done for Phase 1:** Every `S0` and structural rule is either satisfied or explicitly documented as an exemption. No file moves required outside `13-` and `23-`.

---

## Phase 2 — Audit-file naming policy

**Touches:** `13-spec-issues/`, `23-audits/`
**Issues closed:** SI-003, SI-004

| Step | Action |
|---|---|
| 2.1 | In `01-naming-conventions.md` §1, add an explicit "Audit reports" exemption clause: audit files use `audit-YYYY-MM-DD-topic.md` and do NOT need an `NN-` prefix because they are append-only history, not a sequenced document set. |
| 2.2 | Add a one-line note to `23-audits/readme.md` (created in Phase 1) restating the exemption so the rule is discoverable in-folder. |

**Definition of done for Phase 2:** SI-003 and SI-004 close without renaming any historical audit file (history preserved).

---

## Phase 3 — Invalidate the stale 100/100 score

**Touches:** `23-audits/`, `mem://`
**Issues closed:** SI-009 (process item)

| Step | Action |
|---|---|
| 3.1 | Add a row to the Live Issue Tracker in `23-audits/audit-2026-04-19-ai-readiness-score.md` titled "Post-100 spec-issues backlog" referencing `13-spec-issues/02-current-issues.md` open count. |
| 3.2 | Add a Score-progression entry "After Phase-1+2 (post-100 backlog opened): TBR" so readers know the 100 was a snapshot, not a permanent state. |
| 3.3 | Update `mem://features/spec-issue-tracker.md` open/closed counts. |

---

## Phase 4 — Stub-cleanup pass

**Touches:** `00-overview/`, root `readme.md`
**Issues closed:** SI-008

| Step | Action |
|---|---|
| 4.1 | Replace TBD on `00-overview/04-competitive-analysis.md` line 13 with the canonical free-tier cap from `10-licensing-billing/01-plans-matrix.md`. |
| 4.2 | Replace TBD on `readme.md` line 327 the same way. |
| 4.3 | Confirm the remaining `TBD/TODO` references in `22-infrastructure/03-env-vars.md` and the `23-audits/*` files are intentional (audit-history / linter-pattern descriptions). Document any that survive in §7 of `01-naming-conventions.md` as allowed cases. |

---

## Phase 5 — Re-audit pass (find more issues)

**Touches:** read-only sweep, results land in `02-current-issues.md`
**Issues closed:** none — issues OPENED.

| Step | Action |
|---|---|
| 5.1 | Cross-reference link integrity sweep: every `§N.N` reference exists in the linked file. |
| 5.2 | `flow-diagram.mmd` reserved-character sweep across all 22 diagrams. |
| 5.3 | `permissions-matrix.json` vs `17-admin-org/03-roles.md` parity check. |
| 5.4 | `01-information-architecture/01-hierarchy.md §3.5` existence check (referenced by `07-features/16-delete-with-undo.md`). |
| 5.5 | Append every new finding as `SI-011`, `SI-012`, … in `02-current-issues.md`. |

After Phase 5 we re-plan Phases 6+ from the expanded list.

---

## Phases pending (placeholders, will be detailed after Phase 5)

- **Phase 6:** Cross-reference repairs.
- **Phase 7:** Diagram-label safety sweep.
- **Phase 8:** Roles/permissions parity reconciliation.
- **Phase 9:** Hierarchy reference repairs.

---

## How to advance

User types **"next"** → I do the next un-done step in the lowest-numbered open phase, then update `02-current-issues.md`, `04-closed-issues.md`, and `mem://features/spec-issue-tracker.md` in one batch. If a step needs a clarifying decision, I stop and ask before changing anything.
