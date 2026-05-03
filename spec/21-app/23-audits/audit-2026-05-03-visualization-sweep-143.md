# Audit-143 — `15-visualization/` broad sweep

**Date:** 2026-05-03 (Session 143)
**Scope:** All 7 files + `flow-diagram.mmd` + `readme.md` in `spec/21-app/15-visualization/`. First broad sweep.

## Method

1. ULID → 1 hit, **intentional** rule citation in `05-tabextend-column-view.md:36` (corrects an earlier draft, references Core).
2. Hex → 0 hits.
3. Bare `workspace` → 1 real hit at `04-mindmap-view.md:3` ("see their workspace").
4. Non-`/v1/` paths → 1 real hit at `readme.md:147` (`PATCH /collections` shorthand).

## Findings

### F1 — `04-mindmap-view.md:3` "see their workspace" → fixed

Replaced with "see their Organization" per Core mapping rule.

### F2 — `readme.md:147` `PATCH /collections` shorthand → fixed

Replaced with canonical `PATCH /v1/collections/{id}` per `03-api-endpoints/00-overview.md` inventory.

## Patches applied

- `15-visualization/04-mindmap-view.md:3`
- `15-visualization/readme.md:147`

## Spec-issue tracker impact

No new SI. Score: **100/100**. Open: **1 / 25** (SI-029).

## Suggested next sweeps

- `17-admin-org/` — never broadly audited.
- `01-information-architecture/` — never broadly audited.
- `06-ui-ux/` — partial audits only; never folder-wide.
- `03-api-endpoints/` — never broadly audited (only sub-files referenced from other audits).
