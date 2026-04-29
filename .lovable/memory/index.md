# Project Memory

## Core
Spec lives in `spec/21-app/` — "By domain/feature" structure (00-overview/ … 20-roadmap/). Do not flatten or re-shape folders.
Conversation logging: append every user instruction verbatim to `spec/21-app/00-conversation-log.md` AND refactor the relevant structured spec file(s).
Instruction handling: write immediately. Only stop to ask when genuinely ambiguous (conflicting locked rules, missing data, multiple valid interpretations).
Identifiers: UUIDv7 everywhere. Never ULID.
Role enum is locked: owner, admin, editor, viewer, billing, guest, system. Do not introduce new roles without updating glossary + member.md together.
Share model v1 = single-table (`02-data-model/share.md`). `08-sharing-collab/share-model.md` is a v2 design note only.
File naming: `NN-name.md` numbered prefix convention.
Never touch `.release/` folder. Code changes must bump at least minor version.
User timezone: Malaysia (UTC+8). Milestone markers in readme.txt use format: `let's start now {date} {time}`.
Always list remaining tasks at end of each work session; if all done, suggest next actions from memory.
Do NOT append boilerplate "If you have any question..." or "Do you understand?..." blocks.
Brand primary = Toby pink #EC4868 (HSL `343 79% 60%`). Defined in `06-ui-ux/01-design-tokens.md` §1.1. Never hard-code; always reference `--primary` / `bg-primary` etc.
Toby "Workspace" maps SPLIT: container of Collections = our Space; admin/billing/members surface = our Organization. Never collapse Space into Org. See `00-overview/02-glossary.md` "External-product mappings" and SI-021.
Item `color_label` enum is locked: none, red, orange, yellow, green, teal, blue, purple, pink. Hex values resolved by `--color-label-*` tokens in `06-ui-ux/01-design-tokens.md` §1.6.
Counter Discipline: never increment a published count. Re-scan, then write. Enforced by `endpoint-counts` sub-check in `22-infrastructure/09-ci-cd.md §2.1.1`.
Allowlist Discipline: every `scripts/lint/*.allowlist.txt` entry needs PR# + reason + ≤180-day review-by date; ≤50 lines per file. Schema in `22-infrastructure/09-ci-cd.md §2.1.3`. Enforced by `allowlist-discipline` sub-check.
Audit Cadence: every `23-audits/audit-*.md` declares `audit-date`, `next-audit-by` (≤365d), `audit-type`, `status`. One open audit per type max. Schema in `22-infrastructure/09-ci-cd.md §2.1.4`. Enforced by `audit-cadence` sub-check.
Share has TWO URL surfaces: random `/t/{slug}` (globally unique, always available) AND optional memorable `/lmk/{org_handle}/{memorable_slug}` (Org-scoped uniqueness, Pro+, Toby-inspired). Resolver via extension omnibox `lmk` keyword OR full URL server-side. Reserved memorable-slugs include `lmk`, `t`, `new`, `edit`. Spec: `08-sharing-collab/13-share-link.md` §1.2 + §1.4. Data-model field: `02-data-model/07-share.md` `memorable_slug`.

## Memories
- [Spec issue tracker](mem://features/spec-issue-tracker.md) — **1 open / 32 closed.** SI-029 (S2, privacy-pack stub expansion, blocked on legal counsel). Session 59 (2026-04-29): drained D5 from `audit-2026-04-29-data-model-sweep.md` (4 of 9 closed: D1, D2, D4, D5). D5 propagated `search_tsv` GIN index pattern from `05-item.md` to `02-space.md`, `03-collection.md`, `04-group.md` per F-M17. Remaining: D3 (tag scope sentence), D6, D7, D8, D9 (all S3 polish, agent-resolvable). 17/17 linters green. Score 100/100.
- [Next feature](mem://features/next-feature.md) — Per-Account global to-do queue. Modeled as Collection kind=`next` (singleton). Done state on `next_item` join row. Realtime on `account:{account_id}:next`. Spec at `07-features/17-next-queue.md`.
