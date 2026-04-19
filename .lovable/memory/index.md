# Memory: index.md
Updated: just now

# Project Memory

## Core
Spec lives in `spec/21-app/` — "By domain/feature" structure (00-overview/ … 20-roadmap/). Do not flatten or re-shape folders.
**PERMANENT spec-only mode (hardened 2026-04-19).** Default-deny on ALL implementation: no `src/` edits, no Cloud/Supabase, no migrations, no npm installs, no edge functions, **no tests, no fixtures, no seed data**. Job = audit spec, find gaps, write spec in more detail. Suggestion buttons must NEVER offer "lift no-impl", "switch to build phase", "create tests", "add fixtures", or "seed data". Implementation only when user explicitly types "lift no-impl for this turn." See `mem://constraints/no-implementation-mode`.
Conversation logging: append every user instruction verbatim to `spec/21-app/00-conversation-log.md` AND refactor the relevant structured spec file(s).
Instruction handling: write immediately. Only stop to ask when genuinely ambiguous (conflicting locked rules, missing data, multiple valid interpretations).
Identifiers: UUIDv7 everywhere. Never ULID.
Role enum is locked: owner, admin, editor, viewer, billing, guest, system. Do not introduce new roles without updating glossary + member.md together.
Share model v1 = single-table (`02-data-model/share.md`). `08-sharing-collab/share-model.md` is a v2 design note only.
**Browser scope v1 = Chrome only.** Edge / Brave / Arc / Opera / Firefox / Safari all postponed to Phase 4. Authoritative file: `spec/21-app/00-overview/browser-scope.md`. Never propose multi-browser work for v1.
File naming: `NN-name.md` numbered prefix, lowercase + hyphens. Every spec/21-app/<folder>/ file is sequenced 01.. NN by folder reading-order; folder index stays as `readme.md` (no number).
**Audit files location (moved 2026-04-19):** All `audit*.md` and `gap-analysis.md` live in `spec/21-app/23-audits/`. Folder overview at `spec/21-app/23-audits/00-overview.md`. Never reference them at `spec/21-app/` root — that path is stale.
Never touch `.release/` folder. Code changes must bump at least minor version.
User timezone: Malaysia (UTC+8). Milestone markers in readme.txt use format: `let's start now {date} {time}`.
Always list remaining tasks at end of each work session; if all done, suggest next actions from memory **within spec-only scope** (audit, gap-close in spec form, rewrite weak spec). Never suggest tests/fixtures/seeds/implementation.
Do NOT append boilerplate "If you have any question..." or "Do you understand?..." blocks.

## Memories
- [No Implementation Mode](mem://constraints/no-implementation-mode) — PERMANENT spec-only. No src/, no Cloud, no migrations, no tests, no fixtures, no seeds. No "lift" buttons in suggestions.
- [Gap Analysis State](mem://features/gap-analysis-state) — v4 (2026-04-19): All majors closed (M1–M14). Deferred: B4, B7. Lovable 90 / Cursor 94 / Raw 68.
- [Inquiry PDF format](mem://preference/inquiry-pdf-format) — `/mnt/documents/inquiry.pdf` Q&A archive: extract core questions only (no verbatim), 2–3 sentence answers, no tables.
- [Audit tracker protocol](mem://preference/audit-tracker-protocol) — Never delete failing-issue text from `23-audits/audit-2026-04-19-ai-readiness-score.md` until 100/100; mark closed inline with date + fix ref.
- [Impl-vs-spec baseline 2026-04-19](spec/21-app/23-audits/audit-2026-04-19-impl-vs-spec.md) — Spec 2/100, impl 1/100, prod-ready 1/100. 11 failing findings (F-01,02,03,04,05,06,07,08,14,19,22). Re-score after any future "lift no-impl" turn.
