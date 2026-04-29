# 00 — Overview Folder Overview

> **Purpose.** This folder is the **front door of the entire spec corpus**. Anyone — human contributor, Lovable, Cursor, Claude-Code, raw LLM, future engineering hire — should read this folder *first*, in order, before opening any other domain. Nothing in here is implementation; it is the *frame* that makes every later folder coherent.

---

## 1. Responsibilities

This folder owns five things and nothing else:

1. **Vision** — what "Let's Mark Now" *is*, who it serves, and what success looks like at v1, v2, and v4.
2. **Glossary** — the canonical vocabulary. Every term used anywhere in `spec/21-app/**` is defined here exactly once. Drift in terminology elsewhere is a bug.
3. **Personas** — the named user archetypes that all UX, copy, feature scoping, and pricing decisions reference. New features must declare which persona(s) they serve.
4. **Competitive analysis** — the market landscape that justifies feature prioritisation, pricing tiers, and positioning. Used as the primary input for `10-licensing-billing/01-plans-matrix.md` and `05-web-app/13-marketing-site.md`.
5. **Browser scope** — the **locked v1 surface** (Chrome only) and the explicit deferral matrix for Edge / Brave / Arc / Opera / Firefox / Safari. Authoritative; no other folder may contradict.

---

## 2. File-by-file behaviour

| File | What it does | Who reads it first |
|---|---|---|
| `01-vision.md` | Product thesis, problem statement, north-star metric, non-goals. | Every contributor on day 1. |
| `02-glossary.md` | Lockdown of every domain term (Organization, Space, Collection, Group, Item, Tag, Share, Member, License, Role enum, etc.). | Anyone unsure what a word means; any AI before generating spec or code. |
| `03-personas.md` | Named personas with goals, frustrations, plan tier, device profile, key flows. | UX writers, marketing, feature owners. |
| `04-competitive-analysis.md` | Direct, indirect, and adjacent competitors; feature-by-feature gap matrix; pricing comparison. | Pricing, positioning, roadmap planning. |
| `05-browser-scope.md` | **Locked rule:** Chrome only for v1. Deferral schedule for other browsers tied to `20-roadmap/05-phase-4-cross-browser.md`. | Anyone proposing extension work; any AI tempted to "support all browsers". |
| `readme.md` | Reading order + one-liners for the files above. | Newcomer entering the folder. |

---

## 3. Tasks performed by this folder

- **Define vocabulary once.** All other folders reference glossary terms; they do not redefine them.
- **Lock v1 scope at the browser level.** Prevents scope creep into Firefox/Safari before Phase 4.
- **Anchor persona references.** `06-ui-ux/14-copy-voice.md`, `07-features/**`, and `10-licensing-billing/**` all cite personas defined here.
- **Justify the pricing matrix.** `04-competitive-analysis.md` is the upstream source for `10-licensing-billing/01-plans-matrix.md`.
- **Set the north-star metric** that `18-analytics-telemetry/03-events.md` instruments.

---

## 4. What this folder is NOT

- **Not implementation.** No code, no SQL, no API contracts, no env vars.
- **Not a roadmap.** Roadmap lives in `20-roadmap/`. This folder describes *what* and *why*; the roadmap describes *when*.
- **Not UI.** No wireframes, no design tokens, no copy strings beyond product taglines.
- **Not a changelog.** Vision evolution is captured by versioned audit notes (`23-audits/audit-2026-04-19-*`), not by editing vision.md without trace.

---

## 5. Cross-references

- Roadmap consuming this scope: `20-roadmap/01-phase-0-mvp.md` → `20-roadmap/05-phase-4-cross-browser.md`
- Pricing derived from competitive analysis: `10-licensing-billing/01-plans-matrix.md`
- Persona-driven copy: `06-ui-ux/14-copy-voice.md`, `06-ui-ux/17-copy-strings.md`
- Browser-scope enforcement in extension spec: `04-extension/01-manifest.md`
