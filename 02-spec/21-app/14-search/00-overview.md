# 00 — Search Folder Overview

> **Purpose.** Define every search surface in the product (global ⌘K, per-Item search, per-workspace search), the shared filter language, the jump-to-result contract, and the engine choice that powers them. Search is a single capability with multiple front-ends — this folder pins the contract so they cannot diverge.

---

## 1. Responsibilities

1. **Surface inventory.** Global palette search, item search inside a Collection, workspace-wide search, omnibox keyword search (extension).
2. **Filter language.** Shared filter token grammar (`tag:foo`, `in:space/x`, `is:starred`, `before:2026-01-01`).
3. **Ranking.** Recency boost, frequency boost, exact-match boost, personal-pinned boost.
4. **Jump-to-result.** What "open this result" does in each surface (web vs extension vs palette).
5. **Engine.** Postgres FTS for v1; tokenisers, stemmers, language detection; index layout.

---

## 2. File-by-file behaviour

| File | Owns |
|---|---|
| `01-global-search.md` | ⌘K palette: scope, ranking, max results, keyboard navigation. |
| `02-item-search.md` | Per-Collection search input; matches title, URL, notes, tags. |
| `03-workspace-search.md` | Org-wide scope; permission-aware result set. |
| `04-filters.md` | Filter token grammar; allowed keys; combinator rules. |
| `05-jump-to-result.md` | What happens on selection: navigate vs open-tab vs open-source-URL. |
| `06-search-engine.md` | Postgres FTS config; `tsvector` columns; trigger to refresh on write; language config. |

---

## 3. Tasks performed by this folder

- **Lock one filter grammar** used by every search surface.
- **Lock one ranking formula** so palette and dashboard searches return consistent ordering.
- **Define index columns** that `02-data-model/` must declare (handoff contract).
- **Define jump-to-result behaviour** per surface so keyboard shortcuts feel uniform.

---

## 4. What this folder is NOT

- **Not the palette UI.** Palette component lives in `06-ui-ux/03-component-library.md`; palette feature lives in `07-features/13-command-palette.md`.
- **Not the search API.** Endpoint contract is in `03-api-endpoints/13-search.md`.
- **Not analytics on search.** Query logging (privacy-respecting) is in `18-analytics-telemetry/03-events.md`.

---

## 5. Cross-references

- Search API: `03-api-endpoints/13-search.md`.
- Palette feature: `07-features/13-command-palette.md`.
- Item table fields participating in FTS: `02-data-model/05-item.md`.
- Pagination contract (`limit` only — W-13): `03-api-endpoints/01-conventions.md` §5.
