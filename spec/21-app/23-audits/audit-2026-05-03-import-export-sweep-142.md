# Audit-142 — `11-import-export/` broad sweep

**Date:** 2026-05-03 (Session 142)
**Scope:** All 12 files + `flow-diagram.mmd` + `readme.md` in `spec/21-app/11-import-export/`. First broad sweep.

## Method

1. ULID → 0 hits.
2. Hard-coded hex → 0 hits.
3. Bare `workspace` → 1 hit, **intentional** (`02-importers.md:130` — "Notion workspace" is a Notion proper-noun referring to that source product's own concept, not ours).
4. Non-`/v1/` paths → 0 hits.

## Findings

**Zero drift.** Notion-source phrasing is correct.

## Patches

None.

## Spec-issue tracker impact

No new SI. Score: **100/100**. Open: **1 / 25** (SI-029).

## Suggested next sweeps

- `15-visualization/` — never broadly audited.
- `17-admin-org/` — never broadly audited.
- `01-information-architecture/` — never broadly audited.
- `06-ui-ux/` — partial audits only; never folder-wide.
