# Audit-157 — `14-search/` broad sweep

- **Date:** 2026-05-03 (Malaysia, UTC+8)
- **Scope:** `spec/21-app/14-search/` (7 files + `readme.md` + `flow-diagram.mmd`)
- **Driver:** `next` rotation; folder previously only spot-touched.

## Method

`rg` sweep for `workspace`, `ULID`, hex colors, non-`/v1/` API paths.

## Findings

| # | Hit | Verdict |
|---|-----|---------|
| 1 | `03-workspace-search.md` filename + all "workspace search" references | **Legit canonical scope name** — refers to the cross-Org search surface, established across multiple cross-references (`02-data-model/*`, `06-search-engine.md`, `00-overview.md`). Not the SI-021 product-hierarchy term. |
| 2 | `workspace_search.*` analytics events | **Legit** — namespaced after the canonical scope file. |

Zero ULID, zero hex, zero non-`/v1/` API paths.

## Note on terminology

"Workspace search" here is a **search-scope name**, distinct from Toby's "Workspace" container concept (which SI-021 splits into Space + Organization). The two uses do not collide because:
- SI-021 governs the product hierarchy / nav surfaces.
- "Workspace search" describes a scope = "all Orgs the Account belongs to".

This distinction is implicit in the spec but **not explicitly called out**. Considered opening a low-priority spec issue to add a glossary disambiguation, but downgrading to a roadmap candidate — current readers are unlikely to be confused given the file `03-workspace-search.md` opens with "across all Orgs".

## Outcome

Zero patches. Score 100/100.
