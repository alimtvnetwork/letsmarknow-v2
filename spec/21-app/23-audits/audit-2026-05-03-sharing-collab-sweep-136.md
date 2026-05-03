# Audit-136 — `08-sharing-collab/` broad sweep

**Date:** 2026-05-03 (Session 136)
**Scope:** 14 numbered markdown files + `flow-diagram.mmd` + `permissions-matrix.json` + `readme.md` + `url-normalization.md` in `spec/21-app/08-sharing-collab/`. First broad sweep (folder previously touched only narrowly during S117 invite-share parity).

## Method

1. ULID leakage → **0 hits**.
2. Hard-coded hex → **0 hits**.
3. Bare `workspace` for our concepts → **1 real hit** at `05-permissions-matrix.md:70` ("Clone shared target to own workspace"). Should be "own Organization" per Core mapping rule.
4. Non-`/v1/` API paths → **0 real hits**. (`GET /t/{slug}?inv=…` in `04-invite-only-shares.md:37` is the public **share-viewer route**, not an API endpoint — declared in glossary §Sharing and `13-share-link.md`. Correct.)
5. Role enum drift → **0 hits**. Lowercase `member` usage is event-name (`member.role_changed`) or prose role-concept; canonical capitalized "Member" used in headings.

## Patches applied

- `08-sharing-collab/05-permissions-matrix.md:70` — "own workspace" → "own Organization".

## Spec-issue tracker impact

No new SI. Score: **100/100**. Open: **1 / 25** (SI-029 still legal-blocked).

## Suggested next sweeps

- `07-features/` — never broadly audited.
- `02-data-model/` — never broadly audited.
- `09-auth-accounts/` — never broadly audited.
- `04-extension/` — never broadly audited.
