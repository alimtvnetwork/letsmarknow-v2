# 00 — {Folder Name} Folder Overview

> **Purpose.** One-paragraph statement of what this folder owns and why it exists. State the **upstream truth** this folder provides to the rest of the spec. If two folders disagree on a topic this folder owns, this folder wins.

---

## 1. Responsibilities

Numbered list of every distinct responsibility. Each item is one sentence, declarative, no hedging. Aim for 5–14 items. If you have fewer than 5 the folder is probably under-scoped; if you have more than 14 the folder is probably doing two jobs.

1. **Capitalised noun phrase.** One-sentence elaboration.
2. **Capitalised noun phrase.** One-sentence elaboration.
3. …

---

## 2. File-by-file behaviour

Table — one row per file in this folder (excluding `readme.md` and this `00-overview.md`). The "Owns" column states what each file is the source of truth for. No vague verbs ("handles", "manages") — use "defines", "specifies", "lists", "locks".

| File | Owns |
|---|---|
| `01-{name}.md` | What this file is the source of truth for. |
| `02-{name}.md` | … |
| … | … |

---

## 3. Tasks performed by this folder

Bulleted list of the concrete, verifiable jobs the folder performs at runtime, build time, or in the spec process. Each bullet is a verb-led action with a measurable outcome. These are the things that would break if this folder vanished.

- **Verb-led action.** Outcome statement.
- **Verb-led action.** Outcome statement.
- …

---

## 4. What this folder is NOT

Explicit non-responsibilities. Each line names a topic this folder does NOT own and points to the folder/file that does. This section prevents scope creep and reader confusion. Aim for 3–6 items.

- **Not the {topic}.** Lives in `{folder}/{file}.md`.
- **Not the {topic}.** Lives in `{folder}/{file}.md`.
- …

---

## 5. Cross-references

Bulleted list of every other spec location that consumes or feeds this folder. Each line is `{topic}: {path/to/file.md} [§section if useful]`. Paths must be relative to `spec/21-app/` and MUST resolve (the `spec-drift-linter` `link-check` and `folder-overview` sub-checks enforce this — see `22-infrastructure/09-ci-cd.md` §2.1.1).

- {Topic}: `{folder}/{file}.md`.
- {Topic}: `{folder}/{file}.md` §{section}.
- …

---

## Authoring checklist (delete before commit)

- [ ] H1 follows pattern `# 00 — {Folder Name} Folder Overview`.
- [ ] All five required sections present in order: Responsibilities, File-by-file behaviour, Tasks, What this folder is NOT, Cross-references.
- [ ] File ≥ 40 lines (proxy for "not a stub" — enforced by `folder-overview` linter sub-check).
- [ ] Every file in the folder appears exactly once in §2.
- [ ] Every cross-folder ref in §2 / §5 uses the full `NN-folder/NN-file.md` path (sibling-only refs are OK if they resolve in this folder).
- [ ] No price strings outside `10-licensing-billing/01-plans-matrix.md` (W-3 / `pricing-source` linter).
- [ ] No `_annual`, `amount_minor`, `page_size`, `<id>`, `:id` (W-6, W-10, W-13, W-4 linters).
- [ ] Role enum references match the canonical 7 values (W-1 / `role-enum` linter).
- [ ] Removed this checklist block.

---

## Notes for authors

- **Tone.** Match the rest of `spec/21-app/`: declarative, locked-rule voice. No "we will", "could", "might". Use "does", "is", "MUST".
- **Length.** Target 40–120 lines. Below 40 trips the linter; above 120 usually means content belongs in a sub-file, not the overview.
- **Sequence.** Sections are ordered Responsibilities → File map → Tasks → Non-responsibilities → Cross-refs. Do not reorder; the linter checks heading order in v2.
- **Linter contract.** Spec PRs that add a new folder under `spec/21-app/` MUST also add a `00-overview.md` based on this template, or the `folder-overview` sub-check (`22-infrastructure/09-ci-cd.md` §2.1.1) fails the PR. F-FOLDER-OVERVIEW closure is non-regressable.
- **Source of truth for this template.** This file. If you change the required sections, update the linter assertion in the same PR and bump the audit tracker.
