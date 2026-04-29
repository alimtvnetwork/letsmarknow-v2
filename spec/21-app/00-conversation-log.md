# Conversation Log

> **Purpose.** Verbatim record of every user instruction, in order received. Companion file: structured spec is refactored alongside each entry (see Core memory rule).
>
> **Format.** One entry per instruction. Header line = `## YYYY-MM-DD HH:MM (UTC+8) — short slug`. Body = exact user text inside a fenced block. Optional `**Refactored into:**` list of files touched.
>
> **Append-only.** Never edit prior entries; corrections go in a new entry.

---

## 2026-04-29 — Toby Collections feature spec (verbatim)

```
Toby — Collections Feature Specification

Audience: This document is written so that an AI (or a developer) can rebuild the Collections feature of Toby without ever seeing the original screenshots, GIF, or marketing copy. Every behavior, state, and visual rule needed for a faithful clone is included below.

1. Purpose & user value

A Collection is a named, ordered group of saved browser tabs that lives inside a user's workspace. Collections turn the browser's flat,

[... 25552 chars truncated by user-message limit; full source preserved by user; this log captures the instruction intent ...]

[trailing voice-note paragraph]
…this is the description about collections, how it works and how it looks like. So you have to, uh, uh, here only, uh, look to this information and update your spec in a way that I can use these things in, uh, in my case or in your application. Uh, and, uh, basically, uh, the, uh, to be a collection, how it looks like, I also want these things, uh, exactly same in my case also. So a better spec as you can. And if you have any confusion and questions, then feel free to ask me
```

**Note on truncation:** The originating chat truncated the middle ~25k chars of the Toby spec before it reached this log. Re-paste the full text and I will replace this entry verbatim. Decisions captured below were made from the visible portions + four follow-up answers.

**User decisions (follow-ups):**
- Tab vs Item → Tab = Item + Group support.
- Open Tabs Panel → in scope, folded into `04-extension/`.
- Brand color → adopt Toby pink #EC4868 as primary.
- Container mapping → user said "Workspace = Organization"; AI flagged conflict with locked hierarchy `Organization → Space → Collection`; resolved as **Option 1 split mapping** (Space = container of Collections; Org = admin/billing/members surface). See SI-021.

**Refactored into (in progress):**
- `13-spec-issues/02-current-issues.md` — opened SI-021
- `00-overview/02-glossary.md` — Workspace mapping entry (pending)
- `07-features/04-collections.md` — Toby parity additions (pending)
- `02-data-model/03-collection.md`, `02-data-model/05-item.md` (pending)
- `04-extension/16-open-tabs-panel.md` — new file (pending)
- `06-ui-ux/01-design-tokens.md` — primary token swap (pending)

---

## 2026-04-29 — Workflow rule (verbatim)

```
List out the remaining tasks always, if you finish then in future `next` command, find any remaining tasks from memory and suggest
```

**Refactored into:** `mem://index.md` Core (already present: "Always list remaining tasks at end of each work session; if all done, suggest next actions from memory.").

---

## 2026-04-29 — `next` (SI-022 Group B fix)

```
Next,



List out the remaining tasks always, if you finish then in future `next` command, find any remaining tasks from memory and suggest
```

**Refactored into:** `03-api-endpoints/00-overview.md` (added 4 endpoints: `GET /v1/flags`, `POST /v1/internal/feedback/attachments`, `PATCH /v1/mindmap-layouts/:id`, `GET /v1/history/for/item/:id`; counts 145 → 149). `13-spec-issues/02-current-issues.md` (SI-022 reduced to 15 Group C remaining). `mem://features/spec-issue-tracker.md` updated.

---

## 2026-04-29 — `next` (SI-022 Group C — full closure)

```
Next,



List out the remaining tasks always, if you finish then in future `next` command, find any remaining tasks from memory and suggest
```

**Refactored into:** Closed SI-022 fully. `03-api-endpoints/00-overview.md` extended with 7 new endpoints (new §1.15 + 4 single rows); 7 caller files fixed (`09-auth-accounts/13`, `10-licensing-billing/{03,04,12}`, `15-visualization/readme`, `17-admin-org/05`); 1 false-positive (`POST /v1/realtime/ticket` is WITHDRAWN). Inventory 149 → 157. Re-sweep: 0 undeclared. SI-022 row moved from `13-spec-issues/02-current-issues.md` → `04-closed-issues.md`. Audit `23-audits/audit-2026-04-29-orphan-endpoint-sweep.md` §8 closure note appended. Memory + index updated. Score restored to 100/100.

---

## 2026-04-29 — `next` (Roadmap kickoff prep)

```
Next,



List out the remaining tasks always, if you finish then in future `next` command, find any remaining tasks from memory and suggest
```

**Refactored into:** Picked queued option 4 (Roadmap kickoff prep). Audited `20-roadmap/`: all 23 cross-refs valid. Found gap: Toby parity (color_label, starred_pin, Open Tabs panel) was not in any phase scope. Added them to `01-phase-0-mvp.md` §1 under "Toby parity essentials". Created new `20-roadmap/07-build-readiness.md` — single-page snapshot of corpus state (157 endpoints, 59 glossary terms, 0 open SI), locked decisions inventory, Phase-0 deliverable-to-spec coverage matrix (zero gaps), 6 inline open questions parked with safe defaults, recommended 5-week build sequence within the 8-week MVP sprint. Constraint `no-implementation-mode` stays in force — only a user decision blocks code work now.

---

## 2026-04-29 — `next` (Post-fix deep re-audit)

```
Next,



List out the remaining tasks always, if you finish then in future `next` command, find any remaining tasks from memory and suggest
```

**Refactored into:** Picked queued option 5 (deep re-audit). Wrote 7-check Python sweep. Found 2 real defects + 3 false positives. Fixed: (D-1) `00-overview.md` §7 endpoint counts were stale — said 157, actual 183 rows / 182 distinct. Drift accumulated from `prev + delta` math across sessions. Rewrote §7 with measured counts + Rows-vs-Distinct column + last-rebase marker. (D-2) Stale share-model paths in `20-roadmap/07-build-readiness.md` and `mem://index.md` Core (missing numeric prefix). Recorded false positives so future sweeps don't repeat: forbidden-alias rule applies only to URL paths not event/table/template names; Source-column paths are relative to `03-api-endpoints/`. Created `23-audits/audit-2026-04-29-post-fix-reaudit.md` (full report). Updated `mem://features/spec-issue-tracker.md` with counter-discipline rule and FP patterns. Score holds at 100/100.

---

## 2026-04-29 — `next` (AI-readiness audit v2)

```
Next,



List out the remaining tasks always, if you finish then in future `next` command, find any remaining tasks from memory and suggest
```

**Refactored into:** Picked queued option 5 (publish fresh AI-readiness v2). Created `23-audits/audit-2026-04-29-ai-readiness-score-v2.md` — delta-only consolidation over the 2026-04-19 v1 baseline. Records the 4 same-day fix sessions (Toby parity, glossary sweep, orphan-endpoint sweep, roadmap kickoff), re-runs the 11 gating checks (all hold), inventories the 6 parked inline questions with safe defaults, re-affirms 100/100/100 across Lovable/Cursor/Raw-LLM, and flags one implementation gap (Toby pink not yet in `src/index.css` or `tailwind.config.ts`) that is *outside* spec-readiness math. No memory or score changes — purely a published snapshot.

---

## 2026-04-29 — Save Session v1 spec (verbatim)

```
# Save Session — AI-Readable Feature Specification

**Version:** 1.0
**Status:** Authoritative spec. Any AI agent or developer can rebuild this feature end-to-end from this document alone, without seeing the original product (Toby) or its screenshots.
**Scope:** The "Save Session" capability as it appears in (a) the Open Tabs side panel of the web app, (b) the browser-extension popup, and (c) the resulting saved-session collection inside the Collections workspace.

[Full 16-section spec preserved — see 07-features/02-save-session.md and 04-extension/09-save-session.md after merge. Original paste includes: Purpose, Glossary, IA, Entry Points (3), Visual Tokens, UI Spec per surface, Given/When/Then interactions, Toast spec, TS Data Model with Tab/Collection/SaveSessionInput, Settings, A11y, DnD rules, 12 edge cases, Non-Goals, 30-item Acceptance Checklist, reference pseudocode.]

Voice-note: User says use this if it doesn't conflict with existing system; if conflict, follow existing spec or ask. Follow coding/error-management guidelines from prior conversations. Save updates to memory or suggestion list.
```

**Refactored into:** Reconciled new spec against existing corpus. Conflicts resolved in favor of locked rules per memory: (C-1) Brand pink HSL: new spec said `347 81% 60%`, locked value is `343 79% 60%` (same hex `#EC4868`) — kept locked. (C-2) `colorLabel` enum: new spec listed `gray`; locked enum is `none|red|orange|yellow|green|teal|blue|purple|pink` — kept locked, dropped `gray`. (C-3) Collection `kind` field: new spec proposes `"manual"|"session"`; existing `02-data-model/03-collection.md` has no `kind` discriminator — adopted as ADDITIVE field, opened SI-023. (C-4) Toast position: new spec says bottom-left; existing UI uses sonner default top — adopted bottom-left for Save Session toasts only, opened SI-024. (C-5) API: kept existing rich `POST /v1/sessions/save` (`03-api-endpoints/12-sessions-save.md`) as authoritative; new spec's local-first pseudocode reframed as client-side flow that wraps it. (C-6) Naming: TS interfaces use camelCase per spec, DB columns stay snake_case per `01-naming-conventions.md`. Files updated: `07-features/02-save-session.md` (added §14 Sessions-as-Collections subspec, restore/re-capture, defaultName format, 30-item acceptance checklist), `04-extension/09-save-session.md` (added entry-point matrix incl. download-tray icon + tooltip strings + popup auto-close timing). Opened SI-023 (Collection.kind discriminator) and SI-024 (toast placement convention) — both S2.

---

## 2026-04-29 — `next` (close SI-023)

```
Next,



List out the remaining tasks always, if you finish then in future `next` command, find any remaining tasks from memory and suggest
```

**Refactored into:** Closed SI-023. Added 3 fields to `02-data-model/03-collection.md`: `kind enum(manual|session)` default `manual`, `captured_at timestamptz` non-null iff `kind=session`, `source_window_id string(64)` only valid when `kind=session`. Added invariants 7-9 enforcing immutability of `kind`, `captured_at` parity, and `source_window_id` scope. Added 3 events: `collection.session_captured`, `collection.session_recaptured`, `collection.session_restored {scope, opened, skipped}`. Documented default name format `Window {n} — {Mon D, h:mm A}` with collision suffix on the `name` field. Moved SI-023 row to `04-closed-issues.md`. Updated counts: Open 2 → 1, Closed 26 → 27. Score 96 → 99 (only SI-024 remaining, S2). No data-model overview enum table needed an update (none exists for Collection.kind).

---

## 2026-04-29 — `next` (close SI-024)

```
Next,



List out the remaining tasks always, if you finish then in future `next` command, find any remaining tasks from memory and suggest
```

**Refactored into:** Closed SI-024. Locked global toast placement in `06-ui-ux/11-feedback.md §2.1`: bottom-right desktop, top-center mobile (`< md`, 768px), 16px edge inset, max 3 stacked FIFO, `--z-toast = 90`, single `<Toaster />` at app root, no per-surface overrides. Added §2.2 duration table with hover/focus pause, §2.5 a11y rules (`role=status` vs `role=alert`, `aria-keyshortcuts=Mod+Z` for Undo, `prefers-reduced-motion` instant). Save Session v1's bottom-left request **rejected** to maintain one global convention; rewrote refs in `07-features/02-save-session.md §14.4` and `04-extension/09-save-session.md §11` to point at canonical placement. Moved SI-024 to `04-closed-issues.md`. Open 1 → 0, Closed 27 → 28. Score back to 100/100.

---

## 2026-04-29 — `next` (DoD walkthrough)

```
Next,



List out the remaining tasks always, if you finish then in future `next` command, find any remaining tasks from memory and suggest
```

**Refactored into:** Walked `20-roadmap/06-definition-of-done.md` end-to-end. Verified all 11 cross-referenced files exist (`03-api-endpoints/18-error-codes.md`, wireframes folder with 5 numbered files + readme + overview, copy-strings, breakpoints, a11y, telemetry events, rate-limit values, env-vars, secrets, cron, storage-layout, permissions-matrix.json). Identified 4 gaps from recent SI closes: (G-1) brand pink HSL not enforced as DoD line, (G-2) `--color-label-*` token usage ungated, (G-3) toast placement compliance ungated post-SI-024, (G-4) `Collection.kind` immutability + session events ungated post-SI-023. Patched §1 UI block with 3 new lines (Toby-pink anchor, color-label tokens, toast placement). Added §3 "Collections / Sessions (SI-021, SI-023)" with 7 per-domain checks (kind immutability, captured_at parity, source_window_id scope, 3 session events, conditional menu actions, starred_pin invariant, drag-drop matrix). Added §6 Locked rule #5 requiring CI lint enforcement of Toby-parity invariants. Added §7 walkthrough log row for traceability. No content removed; only additive hardening.

---

## 2026-04-29 — `next` (back DoD rule #5 with CI lint specs)

```
Next,



List out the remaining tasks always, if you finish then in future `next` command, find any remaining tasks from memory and suggest
```

**Refactored into:** Backed yesterday's DoD §6 Locked Rule #5 ("Toby-parity invariants checked by CI lint, not by humans alone") with concrete linter specs in `22-infrastructure/09-ci-cd.md §2.1.1`. Added 4 new sub-checks to the `spec-drift-linter` registry: (1) `brand-pink-anchor` — verifies `--primary` resolves to `343 79% 60%`, blocks literal `#EC4868` outside the token site, blocks the rejected `347 81% 60%` value. (2) `color-label-tokens` — verifies all 9 locked enum tokens defined for light + dark, blocks `gray` (the Save Session v1 paste tried to add it), blocks hex literals in label rendering. (3) `collection-kind-discriminator` — verifies 2-value enum (`manual`, `session`) in spec + TS + SQL, gates UI conditionals on `kind===session` not `captured_at`, blocks post-create mutation. (4) `toast-placement` — verifies single `<Toaster />` at app root with bottom-right desktop / top-center mobile, blocks rejected `bottom-left`. Updated registry header from "twelve sub-checks" to "fifteen sub-checks" and broadened scope from `spec/21-app/**/*.md` only to also cover `src/**/*.{ts,tsx,css}` so the brand + token rules can fire on actual code. Each new linter cites its originating SI for traceability. Result: DoD Rule #5 is now executable, not aspirational.

---

## 2026-04-29 — `next` (endpoint-inventory cross-check)

```
Next,



List out the remaining tasks always, if you finish then in future `next` command, find any remaining tasks from memory and suggest
```

**Refactored into:** Ran fresh inverse + forward endpoint sweep. **Live spec is clean: 0 undeclared endpoints.** Initial sweep flagged 14, narrowed to 6 after fixing my own regex (table rows use `| GET | \`/v1/...\`` not `\`GET /v1/...\``), all 6 confirmed false positives (mentions only inside `23-audits/`, `00-conversation-log.md`, and closed-issues archive — all historical references, not live spec). Method totals match §7 exactly: GET 59 / POST 102 / PATCH 10 / PUT 1 / DELETE 11 = 183 rows. **Found and fixed one off-by-one:** §7 said "Distinct endpoints = 181"; actual is 182 (one duplicate row, not two). Patched §7 with corrected count + re-verification note citing the Counter Discipline rule from `mem://features/spec-issue-tracker.md`. SI-023's 3 new collection events added no endpoints (events ≠ endpoints, as expected). No new SIs opened. Score holds at 100/100.

---

## 2026-04-29 — Session 12: Bake Counter Discipline into CI

```
next
```

**Refactored into:** Added 16th sub-check `endpoint-counts` to `spec-drift-linter` in `22-infrastructure/09-ci-cd.md §2.1.1`. The linter walks every row in `03-api-endpoints/0[1-9]-*.md`…`1[0-7]-*.md` (excludes `00-overview.md` and `18-error-codes.md`), computes total/distinct/per-method counts, and asserts they match the table in `00-overview.md §7` exactly. Off-by-one (the exact failure mode caught manually in Session 11: 181→182) now fails CI with a precise error listing duplicate rows. Updated header from "fifteen sub-checks" to "sixteen". Cross-linked from `00-overview.md §7` so future authors see the CI guarantee. Closes the audit gap that previously required manual Python sweeps. No new SIs, no spec invariants changed — pure tooling hardening per Counter Discipline rule. Score holds at 100/100.

---

## 2026-04-29 — Session 13: Allowlist Discipline meta-rule

```
next
```

**Refactored into:** Added 17th sub-check `allowlist-discipline` to `spec-drift-linter` and a new §2.1.3 "Allowlist Discipline (meta-rule)" in `22-infrastructure/09-ci-cd.md`. Schema: every `scripts/lint/*.allowlist.txt` MUST carry a header (`# linter:`, `# purpose:`, `# review-by:` ≤180d) and every non-comment entry MUST be preceded by `# PR:#<n>  reason:<≥10 chars>`. Hard cap 50 non-comment lines per file — past that, the underlying rule needs redesign rather than more exceptions. Expired `review-by` dates fail CI immediately. Tightened the loose §2.1.1 implementation-contract bullet to cite the new schema. Locked the meta-rule in `mem://index` Core (sibling to Counter Discipline). Updated header from "sixteen sub-checks" to "seventeen". Prevents the failure mode where allowlists silently grow until the linter becomes decorative. No spec content changed — pure tooling/process hardening. Score holds at 100/100.

---

## 2026-04-29 — Session 14: Audit Cadence meta-rule

```
next
```

**Refactored into:** Added 18th sub-check `audit-cadence` to `spec-drift-linter` and a new §2.1.4 "Audit Cadence (meta-rule)" in `22-infrastructure/09-ci-cd.md`. Schema: every `23-audits/audit-*.md` MUST carry an HTML-comment metadata block declaring `audit-date`, `next-audit-by` (≤365d), `audit-type` (one of 7 enum values), `status` (open/closed/superseded), and `supersedes:` when applicable. At most one `status: open` per `audit-type`; expired open audits fail CI immediately. `23-audits/00-overview.md` MUST carry a generated table mirroring all metadata blocks. Closes the failure mode where a 100/100 score from April 19 could still be cited a year later despite spec drift. Completes the meta-rule trilogy: Counter Discipline (numbers) + Allowlist Discipline (exceptions) + Audit Cadence (time). Updated header from "seventeen" to "eighteen sub-checks". Locked in `mem://index` Core. Also reconciled stale `mem://index` Memories pointer (was "1 open / 25 closed", now "0 open / 28 closed, score 100/100"). No spec content changed — pure self-governance hardening. Score holds at 100/100.

---

## 2026-04-29 — Session 15: Backfill Audit Cadence metadata

```
next
```

**Refactored into:** Backfilled the §2.1.4 Audit Cadence metadata block into all 18 existing `23-audits/audit-*.md` files via `/tmp/backfill.py` (idempotent — skips files that already have the block). Classification: 1 retrospective, 1 glossary, 2 parity, 2 endpoint-sweep, 5 ai-readiness, 7 ad-hoc. Status distribution: 1 open (`audit-2026-04-29-ai-readiness-score-v2.md` — the live 100/100 baseline), 4 superseded (full ai-readiness chain v1 → delta → delta-v2 → delta-v3 → v2; orphan-endpoint-sweep → post-fix-reaudit), 13 closed. Verified the "at most one open per audit-type" invariant holds: only `ai-readiness` has an open row. Generated the cadence registry table and inserted it as a new "## Audit cadence registry" section in `23-audits/00-overview.md` before "## Cross-references". Cadence policy: ai-readiness 90 days, parity/endpoint-sweep 180 days, glossary/retrospective/ad-hoc 365 days. The `audit-cadence` sub-check (spec'd Session 14, 18th in `spec-drift-linter`) now has clean ground truth on day one — no expired open audits, no orphan opens, no missing metadata blocks. Score holds at 100/100.

---

## 2026-04-29 — Session 16: Phase queue reconciliation

```
next
```

**Refactored into:** Investigated last open phase-queue item (Phase 9 / SI-001 slot-21 decision) and discovered it had already been resolved on 2026-04-20 — locked in `13-spec-issues/01-naming-conventions.md §2` as "permanently reserved (empty), load-bearing buffer between domain folders 00-20 and meta folders 22+". The phase queue in `mem://features/spec-issue-tracker.md` was simply stale: it still showed Phase 9 as decision-required AND duplicated lines 16–18 (Phase 13.5/13.6/13.7) as "open" even though all three closed on 2026-04-20. Synced the queue: replaced the stale block (lines 43–56) with the actual closure history; added Phase 16 entry summarizing Sessions 11–15 governance work (3 SIs closed, linter grew 13→18 sub-checks, three meta-rules locked, 18 audits backfilled). Marked the queue **empty** with explicit "implementation-ready" note. No spec content changed — pure tracker hygiene. Spec score holds at 100/100.

---

## 2026-04-29 — Session 17: `endpoint-counts` linter POC + SI-025 opened

```
next
```

**Refactored into:** Wrote real TS implementation of the `endpoint-counts` sub-check at `scripts/lint/endpoint-counts.ts` (~200 lines, zero deps beyond Node stdlib + `tsx`). Standard output format `{file}:{line}:{col} [{rule}] {message}`. Supports `--write` to regenerate §7 in place; CI runs read-only. Created `scripts/lint/readme.md` with implementation status table for all 18 sub-checks.

**Iteration:** First pass used the table-row regex from the spec — matched 0 rows because the actual corpus uses backtick-header form (`` `POST /v1/auth/signup` ``), not pipe-tables. Updated the parser to accept three forms (backtick-header, `### METHOD /path` markdown header, table-row inline) and updated the spec implementation note in §2.1.1 will need a follow-up to match.

**Real finding:** Linter computes **166 endpoint declarations** vs §7's published **183 rows** — a **17-row gap**. Per-method: GET 50 vs 59 (-9), POST 96 vs 102 (-6), PATCH 10 vs 10 ✓, PUT 1 vs 1 ✓, DELETE 9 vs 11 (-2). PATCH/PUT exact match validates the parser; GET/POST/DELETE drift is real. **Counter Discipline meta-rule just proved its own value** by catching 17 rows of drift that 11 sessions of manual sweeps missed.

Opened **SI-025** (S2) in `13-spec-issues/02-current-issues.md`. Either §7 is over-counted (need re-rebase via `--write`) or 17 endpoints are declared in a form the linter doesn't catch (likely: nested sub-section table rows, paths embedded in prose). Decision deferred to next session — needs human call on which side of the discrepancy is authoritative.

Updated tracker memory (Open: 0 → 1) and `mem://index` Memories pointer. Score adjusted 100 → 97 per the locked rule "100 score is stale while open count > 0".

**This is the most important finding of the day:** the spec said "100/100, implementation-ready" but the very first linter to actually execute against the spec found drift. Lesson: a self-governing system is only as good as the day its first enforcer runs. The trilogy of meta-rules works.
