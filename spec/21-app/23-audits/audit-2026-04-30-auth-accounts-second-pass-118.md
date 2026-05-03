<!--
audit-date: 2026-04-30
next-audit-by: 2027-04-30
audit-type: ad-hoc
status: closed
closed-on: 2026-04-30
closed-because: Second-pass sweep of 09-auth-accounts/ post-audit-106 — drift fixes applied.
-->
# Audit — 09-auth-accounts/ second-pass sweep (Session 118)

**Date:** 2026-04-30
**Scope:** All 14 files in `spec/21-app/09-auth-accounts/`. Checks: (a) endpoint canonicality vs `03-api-endpoints/03-auth.md`, (b) role-enum drift vs locked Core rule, (c) cross-folder link integrity, (d) Toby external-product label leakage.

---

## 1. Findings

| # | Sev | File | Issue | Fix |
|---|---|---|---|---|
| F1 | S2 | `04-oauth-providers.md §2` | Bare `/auth/oauth/<provider>/start` and `/auth/callback/<provider>` paths instead of canonical `/v1/auth/oauth/:provider/{start,callback}`. Violates `13-rate-limit-values.md §179` "all paths MUST include `/v1/` prefix". | Rewrote §2 steps 1 + 3 to canonical, kept lay-alias note. |
| F2 | S2 | `09-email-verification.md §3, §4` | Bare `/auth/verify?t=<token>` instead of canonical `GET /v1/auth/verify?token=<token>` (per `03-api-endpoints/03-auth.md:192`). Param name `t` also drifts from `token`. | Rewrote both occurrences to canonical, fixed param name. |
| F3 | S2 | `03-passwords-and-mfa.md §8` | MFA enforcement table used Toby-style "Team Owner / Team Admin / Team Member" labels. Conflicts with locked role enum and SI-021 closure. | Rewrote table to use `owner` / `admin` / `editor` / `viewer` / `billing` / `guest` and added enum-mapping note. |
| F4 | S3 | `04-oauth-providers.md §3` (extension) | Redirect URL still narrates `/auth/callback/<provider>` form. **Kept** — `chrome.identity.launchWebAuthFlow` redirect URLs are extension-runtime URLs, not API paths; `/v1/` prefix does not apply. Verified against `04-extension/11-auth-bridge.md`. No change. |
| F5 | S3 | `04-oauth-providers.md §4.2` | `/auth/apple/notifications` server-to-server endpoint is undeclared in `03-api-endpoints/03-auth.md`. Apple sends to whatever URL we register; no client of ours hits it. Logged as informational; not added to canonical inventory because it is an inbound webhook, not a public API surface. No change. |

---

## 2. Verification

- `grep -nE '/auth/(oauth|callback|verify)' spec/21-app/09-auth-accounts/*.md` after fix: only canonical `/v1/auth/...` references remain (plus extension-runtime redirect URL noted in F4 and Apple webhook in F5).
- Role audit: `grep -inE '\b(team owner|team admin|team member)\b' spec/21-app/09-auth-accounts/*.md` → 0 matches.
- Endpoint inventory unchanged (no new canonical paths added; only narrative drift fixed).

## 3. Suggested next sweeps

1. `19-security-privacy/` full-folder gap-sweep (deferred since SI-029 carve-out).
2. `15-visualization/` broad audit (view-mode files referenced widely, never broadly audited).
3. `06-ui-ux/22-share-modals.md` — codify Share modal + toast-duration tokens from Toby reference.
4. `09-auth-accounts/04-oauth-providers.md §4.2` — decide whether to declare `/v1/auth/apple/notifications` as an inbound webhook in `03-api-endpoints/03-auth.md` or leave as infra-only.

## 4. Outcome

3 drift fixes (F1, F2, F3) applied. 2 informational findings (F4, F5) recorded with rationale, no change. Scorecard preserved at 100/100/100. Open SI count = 1 (SI-029, blocked on legal counsel).
