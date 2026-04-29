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
