<!-- audit-id: 111 | date: 2026-04-30 | scope: 14-search/ | score: 100 -->

# Audit 111 — `14-search/` gap-sweep

**Date:** 2026-04-30
**Scope:** `spec/21-app/14-search/` reconciled against `03-api-endpoints/13-search.md`, `02-data-model/05-item.md`, `03-api-endpoints/01-conventions.md`, `07-features/13-command-palette.md`.
**Result:** 4 findings opened, 4 closed, 0 carried forward. Score 100.

---

## Findings

### SR1 — Endpoint inventory mismatch (S2, closed)

`02-item-search.md §1` declared `GET /v1/items/search?...` with a bespoke `meta.total_estimate` shape. The canonical search family in `03-api-endpoints/13-search.md` is `/v1/search`, `/v1/search/quick`, `/v1/search/suggest`, `/v1/search/recent` — there is no `/v1/items/search`.

**Fix:** rewrote `02-item-search.md §1` as a pointer to the API spec; removed the bespoke endpoint; cited the cursor-only pagination rule (W-13).

### SR2 — Cross-Org capability contradiction (S2, closed)

`06-search-engine.md §5` listed cross-Org search as "impossible by design — RLS isolated", but `01-global-search.md §13`, `02-item-search.md §2` (scope `account`), and the entire `03-workspace-search.md` describe cross-Org search as a Pro+ feature.

**Fix:** rewrote `06-search-engine.md §5` to scope the limitation correctly — single-query cross-Org FTS is out, but cross-Org search is implemented as server-side fan-out (one FTS query per Org, merged + re-ranked). Engine vs. orchestration concerns now distinct.

### SR3 — Missing `search_tsv` schema for spaces/collections/groups (S3, closed)

`02-data-model/05-item.md §74` cites `14-search/06-search-engine.md §2.2` as the authoritative schema source for analogous `search_tsv` columns on `spaces`, `collections`, and `groups`, but §2.2 only defined `items.search_tsv`.

**Fix:** added the three analogous `alter table … generated always as … stored` definitions and matching GIN indexes in `06-search-engine.md §2.2`.

### SR4 — `total_estimate` violates W-13 (S2, closed)

`02-item-search.md §1` and §8 returned `total_estimate` (HLL approximation) in paginated responses. `03-api-endpoints/01-conventions.md §5` (W-13) forbids total counts in paginated lists; counts must come from dedicated `/count` endpoints.

**Fix:** removed `total_estimate` from §1 endpoint shape and §8 pagination; documented the cursor-only contract and pointed at `/count` for exact counts.

---

## Cross-cutting touches

- `01-global-search.md §11` — added explicit reference to `/v1/search/suggest` and `/v1/search/recent` API routes so the surface↔endpoint mapping is one click away.
- No changes required in `03-workspace-search.md`, `04-filters.md`, `05-jump-to-result.md`, `00-overview.md`, `readme.md`, or `07-features/13-command-palette.md` — already aligned.

## Linter status

All 17 sub-checks green after fixes (no new allowlist entries required).
