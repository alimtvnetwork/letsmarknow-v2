# 00 — Spec Issues Folder Overview

> **Purpose.** This folder is the **inbox and triage board** for spec-quality defects discovered after the 2026-04-19 "100/100 readiness" claim. The previous audit chain (`23-audits/`) declared the spec ready; subsequent re-reads are uncovering issues that score missed. This folder exists so we never silently re-grade — every new finding gets an ID, an owner file, and a phase before it is fixed.

---

## 1. Responsibilities

1. **Catalogues every open spec defect** with a stable `SI-NNN` ID.
2. **Locks the spec-writing rules** (`01-naming-conventions.md`) so every future audit has an objective standard.
3. **Groups issues into small phases** so the user can approve work one chunk at a time.
4. **Preserves history** of closed issues with date + fix reference.
5. **Forces fixes to happen in the owning folder**, not here. This folder is metadata only.
6. **Feeds the readiness score honestly** — each open `S0`/`S1` here invalidates any prior 100/100 claim until closed.

---

## 2. File-by-file behaviour

| File | Owns |
|---|---|
| `01-naming-conventions.md` | The locked spec-writing rules audits compare against. |
| `02-current-issues.md` | The live list of open issues. Append-only. |
| `03-phase-plan.md` | The sequential do-list. |
| `04-closed-issues.md` | The archive of resolved issues. |

---

## 3. Tasks performed by this folder

- **Receive new audit findings.** Each new finding gets an `SI-NNN` row appended to `02-current-issues.md`.
- **Plan small phases.** When the user says "plan", group the next safest 3–5 issues in `03-phase-plan.md`.
- **Track closure.** When the user says "next" and a phase completes, move the closed rows from `02-` to `04-` with date + fix link.
- **Block premature 100/100 claims.** Any open `S0` or `S1` in `02-current-issues.md` means the readiness score in `23-audits/audit-2026-04-19-ai-readiness-score.md` is stale.

---

## 4. What this folder is NOT

- **NOT** a place to write the actual fix. Fixes land in the affected folder.
- **NOT** a duplicate of `23-audits/`. `23-audits/` holds historical audit reports; `13-spec-issues/` holds the current open list and the plan.
- **NOT** a place for implementation tasks. Spec-only mode is locked (`mem://constraints/no-implementation-mode`).

---

## 5. Cross-references

- `mem://features/spec-issue-tracker.md` — memory mirror of the open issue list.
- `23-audits/audit-2026-04-19-ai-readiness-score.md` — the score that this folder's open count invalidates.
- `templates/folder-overview.md` — template every `00-overview.md` follows.
