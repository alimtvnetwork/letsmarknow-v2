# 13 — Spec Issues

> **Purpose.** Living catalogue of every spec-quality issue found during ongoing audits. Issues are filed here BEFORE any fix, so the user can approve a phase-by-phase remediation plan instead of being surprised by sweeping edits.

This folder is the **inbox**. The fix work happens in the affected folders (`02-data-model/`, `06-ui-ux/`, etc.) once the user says "next" on a phase.

---

## Reading order

1. `00-overview.md` — what this folder owns and how issues flow through it.
2. `01-naming-conventions.md` — the locked spec-writing rules every audit checks against.
3. `02-current-issues.md` — the live, ungrouped list of every open finding (the "long list").
4. `03-phase-plan.md` — issues grouped into small, safe, sequential phases (the "do-list").
5. `04-closed-issues.md` — issues that have been fixed, with date + commit/file reference.

## Files

| File | Owns |
|---|---|
| `00-overview.md` | What this folder is for, who writes to it, how issues are added/closed. |
| `01-naming-conventions.md` | The spec-style rules (file naming, identifier casing, link style, diagram style). The single source of truth audits compare against. |
| `02-current-issues.md` | Every open issue with ID, severity, evidence, and affected files. Append-only until closed. |
| `03-phase-plan.md` | Sequential remediation phases. Each phase ≤ 5 issues so a single "next" command can complete safely. |
| `04-closed-issues.md` | Closed issues with closure date and link to the fix. Never delete; always move from `02-` to `04-`. |

## Locked rules

- **No fixes happen in this folder.** This folder only catalogues and plans. Edits land in the owning folder (e.g. a naming fix lands in `02-data-model/`).
- **One issue = one ID.** Format: `SI-NNN` (Spec Issue, three-digit). IDs never get reused.
- **Severity scale:** `S0` (blocks AI codegen), `S1` (causes wrong output), `S2` (causes ambiguity), `S3` (cosmetic / doc hygiene).
- **Phases are short.** Max 5 issues per phase, max 1 folder touched per phase where possible. Goal: every phase succeeds on first "next".
- **Issues never disappear.** They are moved from `02-current-issues.md` to `04-closed-issues.md` with a date and fix-reference. Nothing is deleted.
