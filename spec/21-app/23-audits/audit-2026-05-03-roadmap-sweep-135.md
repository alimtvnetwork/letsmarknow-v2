# Audit-135 — `20-roadmap/` broad sweep

**Date:** 2026-05-03 (Session 135)
**Scope:** 8 markdown files + `flow-diagram.mmd` + `readme.md` in `spec/21-app/20-roadmap/`. Never audit-targeted before.

## Method

1. ULID leakage → 1 hit, **intentional** (`07-build-readiness.md:25` cites the locked rule "UUIDv7 everywhere. Never ULID").
2. Hard-coded hex → 2 hits, **both intentional** (`06-definition-of-done.md:24` and `07-build-readiness.md:29` document the brand-token anchor `#EC4868` ↔ `343 79% 60%`; both correctly forbid downstream hard-coding).
3. Bare `Workspace` for our concepts → 0 real hits. (`03-phase-2-collab.md:53,111` = "Google Workspace" SSO proper noun; `07-build-readiness.md:30` = explicit Toby-mapping rule citation.)
4. Non-`/v1/` API paths → 0 hits.
5. Role enum drift → 0 hits.

## Findings

**Zero drift.** All flagged terms are intentional rule citations or proper nouns, not violations. Folder is a roadmap/policy surface and correctly references locked rules from Core memory.

## Patches

None.

## Spec-issue tracker impact

No new SI. Score: **100/100**. Open: **1 / 25** (SI-029 still legal-blocked).

## Suggested next sweeps

- `08-sharing-collab/` — folder-wide sweep pending.
- `07-features/` — never broadly audited.
- `02-data-model/` — never broadly audited.
- `09-auth-accounts/` — never broadly audited.
