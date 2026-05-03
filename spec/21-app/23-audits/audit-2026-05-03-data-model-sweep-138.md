# Audit-138 — `02-data-model/` broad sweep

**Date:** 2026-05-03 (Session 138)
**Scope:** 14 numbered markdown files + `flow-diagram.mmd` + `readme.md` + `templates/` in `spec/21-app/02-data-model/`. First broad sweep.

## Method

1. ULID leakage → 1 hit (`00-overview.md:10`), **intentional** rule citation.
2. Hard-coded hex → **0 hits**.
3. Bare `workspace` for our concepts → 9 hits, triaged below.
4. Non-`/v1/` API paths → **0 hits**.
5. Role enum drift → **0 hits** ("Member roles" prose is canonical).

## Findings

### F1 — `01-organization.md:60` UI label "Create new workspace" → fixed

UI-button quoted string referencing our Org-creation action. Should be "Create new Organization". **Patched.**

### F2 — `07-share.md:22` UI label "Save to my workspace" → fixed

Tooltip/button quoted string for share-clone action. Should be "Save to my Organization". **Patched.**

### Non-issues (verified, not patched)

- `01-organization.md:5` and `readme.md:63` — quoted phrase **"workspace bubble"** is the locked glossary-defined parenthetical for the Organization avatar UI element (see `00-overview/02-glossary.md` line 10). Correct.
- `02-space.md:44`, `03-collection.md:60`, `04-group.md:49`, `05-item.md:33,71` — "global / workspace search" refers to the **Workspace Search surface** (`14-search/03-workspace-search.md`). Per S111 audit log, this is an accepted Toby-legacy surface label retained as wire-format/telemetry; rename rejected (telemetry stability). Correct.

## Patches applied

- `02-data-model/01-organization.md:60` — UI string "Create new workspace" → "Create new Organization".
- `02-data-model/07-share.md:22` — UI string "Save to my workspace" → "Save to my Organization".

## Spec-issue tracker impact

No new SI. Score: **100/100**. Open: **1 / 25** (SI-029 still legal-blocked).

## Suggested next sweeps

- `09-auth-accounts/` — never broadly audited.
- `04-extension/` — never broadly audited.
- `10-licensing-billing/` — never broadly audited.
- `11-import-export/` — never broadly audited.
