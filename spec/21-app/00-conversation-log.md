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
