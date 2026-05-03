# Audit-137 — `07-features/` broad sweep

**Date:** 2026-05-03 (Session 137)
**Scope:** 19 numbered markdown files + `flow-diagram.mmd` + `readme.md` in `spec/21-app/07-features/`. First broad sweep.

## Method

1. ULID leakage → **0 hits**.
2. Hard-coded hex → 1 hit (`04-collections.md:216`), **intentional** brand-token citation (`#EC4868` shown alongside HSL anchor with rule reference).
3. Bare `Workspace` for our concepts → 1 hit (`04-collections.md:121`), **intentional** glossary mapping citation.
4. Non-`/v1/` API paths → **0 hits**.

## Findings

**Zero drift.** Both flagged hits are intentional rule citations, not violations.

## Patches

None.

## Spec-issue tracker impact

No new SI. Score: **100/100**. Open: **1 / 25** (SI-029 still legal-blocked).

## Suggested next sweeps

- `02-data-model/` — never broadly audited.
- `09-auth-accounts/` — never broadly audited.
- `04-extension/` — never broadly audited.
- `10-licensing-billing/` — never broadly audited.
