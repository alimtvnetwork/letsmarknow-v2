# Audit-153 — `02-data-model/` broad sweep

- **Date:** 2026-05-03 (Malaysia, UTC+8)
- **Scope:** `spec/21-app/02-data-model/` (14 entity files + `readme.md` + `flow-diagram.mmd`)
- **Driver:** `next` rotation; folder previously only spot-touched, never broadly audited.

## Method

1. `rg` sweep for `workspace`, `ULID`, hard-coded `#RRGGBB`.
2. Cross-checked surviving "workspace" hits against canonical filenames (`14-search/03-workspace-search.md`) and SI-021 split.
3. Verified UUIDv7 lock statement in `00-overview.md §2`.

## Findings

| # | File | Issue | Action |
|---|------|-------|--------|
| 1 | `01-organization.md` §Purpose | Called the Org bubble a "workspace bubble" — violates SI-021 split rule (Workspace ≠ Organization alone). | Rewrote line 5 to "Organization bubble" + added explicit SI-021 reminder. |
| 2 | `readme.md` index table | Same "workspace bubble" phrasing in entity index. | Patched to "Org bubble in the left rail". |
| 3 | `02/03/04/05` (space/collection/group/item) GIN-index notes mention "workspace search" | **Legitimate** — refers to canonical scope file `14-search/03-workspace-search.md`. | No change. |

## Verification

- ✅ Zero ULID leakage.
- ✅ Zero hard-coded hex colors (only token names like `avatar_color` / palette refs).
- ✅ Zero non-`/v1/` API paths (no API paths in this folder).
- ✅ UUIDv7 lock present in `00-overview.md §2`.

## Outcome

2 patches applied, no new spec issues opened.
