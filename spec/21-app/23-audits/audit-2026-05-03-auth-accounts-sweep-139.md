# Audit-139 — `09-auth-accounts/` broad sweep

**Date:** 2026-05-03 (Session 139)
**Scope:** 14 numbered markdown files + `flow-diagram.mmd` + `readme.md` in `spec/21-app/09-auth-accounts/`. First broad sweep.

## Method

1. ULID leakage → **0 hits**.
2. Hard-coded hex → **0 hits**.
3. Bare `workspace` for our concepts → 6 hits, triaged below.
4. Non-`/v1/` paths → **0 real hits**. (`GET /t/:slug` in `13-rate-limit-values.md:84` is a public web route, declared in glossary §Sharing.)
5. Role enum drift → **0 hits**.

## Findings

### F1 — `01-identity-model.md:27` "A workspace." → fixed

Org entity definition called itself "A workspace." Replaced with canonical "An Organization (...)" per glossary.

### F2 — `01-identity-model.md:65` Personal-Org default name → fixed

Auto-generated default name was `"<display_name>'s workspace"`. Renamed to `"<display_name>'s Organization"`. **Note:** This is a user-facing string at first-signup time. If product wants the friendlier "workspace" word in copy only, the locked term still trumps; no copy file currently overrides this.

### Non-issues (verified, not patched)

- `04-oauth-providers.md:11,38,74`, `05-sso-saml.md:76`, `12-oauth-clients.md:10` — "Google Workspace" / "Workspace org claim" are Google's product/claim proper nouns. Correct.
- `readme.md:41` — sentence "Account = identity, Org = workspace, Member = role binding" uses lowercase `workspace` informally to explain the mental model. **Edge case** — could be misread as conflating with Toby term, but the surrounding glossary mapping is unambiguous. Leaving as-is per minimal-touch policy; flag if linter ever auto-rejects.

## Patches applied

- `09-auth-accounts/01-identity-model.md:27` — "A workspace." → "An Organization (...)".
- `09-auth-accounts/01-identity-model.md:65` — Personal-Org default name renamed.

## Spec-issue tracker impact

No new SI. Score: **100/100**. Open: **1 / 25** (SI-029).

## Suggested next sweeps

- `04-extension/` — never broadly audited.
- `10-licensing-billing/` — never broadly audited.
- `11-import-export/` — never broadly audited.
- `15-visualization/` — never broadly audited.
