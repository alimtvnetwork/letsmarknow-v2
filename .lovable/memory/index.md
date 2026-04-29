# Memory: index.md
Updated: just now

# Project Memory

## Core
Spec lives in `spec/21-app/` — "By domain/feature" structure (00-overview/ … 20-roadmap/). Do not flatten or re-shape folders.
Conversation logging: append every user instruction verbatim to `spec/21-app/00-conversation-log.md` AND refactor the relevant structured spec file(s).
Instruction handling: write immediately. Only stop to ask when genuinely ambiguous (conflicting locked rules, missing data, multiple valid interpretations).
Identifiers: UUIDv7 everywhere. Never ULID.
Role enum is locked: owner, admin, editor, viewer, billing, guest, system. Do not introduce new roles without updating glossary + member.md together.
Share model v1 = single-table (`02-data-model/07-share.md`). `08-sharing-collab/01-share-model.md` is a v2 design note only.
File naming: `NN-name.md` numbered prefix convention. Locked rules in `spec/21-app/13-spec-issues/01-naming-conventions.md`.
Spec issues: open list at `spec/21-app/13-spec-issues/02-current-issues.md`. Phase plan at `03-phase-plan.md`. Never fix in `13-`, fixes land in owning folder.
The 100/100 readiness score in `23-audits/audit-2026-04-19-ai-readiness-score.md` is STALE while `13-spec-issues/02-current-issues.md` open count > 0.
Never touch `.release/` folder. Code changes must bump at least minor version.
User timezone: Malaysia (UTC+8). Milestone markers in readme.txt use format: `let's start now {date} {time}`.
Always list remaining tasks at end of each work session; if all done, suggest next actions from memory.
Do NOT append boilerplate "If you have any question..." or "Do you understand?..." blocks.

## Memories
- [Spec issue tracker](mem://features/spec-issue-tracker.md) — Live counts + phase queue mirror of `spec/21-app/13-spec-issues/`. Open=0, Closed=26. SI-022 closed 2026-04-29 (inventory 145 → 157, 0 undeclared, score 100/100). Build-readiness summary at `spec/21-app/20-roadmap/07-build-readiness.md`.
- [Gap analysis state](mem://features/gap-analysis-state.md) — Older closure tracker for the original W-/F-/M- issue chain.
- [Audit tracker protocol](mem://preference/audit-tracker-protocol.md) — Rules for updating the readiness-score audit file after each fix.
- [No implementation mode](mem://constraints/no-implementation-mode.md) — Spec-only mode is permanent. Never write code.
