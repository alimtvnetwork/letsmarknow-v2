<!--
audit-date: 2026-04-29
next-audit-by: 2026-10-26
audit-type: gap-sweep
status: in_progress (1 of 10 closed: AU1 — session 71)
opened-on: 2026-04-29
scope: 09-auth-accounts/ folder — JWT/cookie consistency vs encryption spec, role-enum coverage, magic-link/OAuth path drift
-->

# Audit — Auth & Accounts Sweep (Session 70)

**Date:** 2026-04-29 (Session 70, Malaysia time UTC+8)
**Author:** Lovable agent
**Scope:** All 14 markdown files in `spec/21-app/09-auth-accounts/`, cross-checked against just-locked `19-security-privacy/03-encryption.md` (Session 67-69), `19-security-privacy/01-threat-model.md`, and `17-admin-org/03-roles.md` (role enum SoT).
**Reason:** First dedicated audit of this folder. Adjacent to just-closed security-privacy audit (Session 69) — high leverage for finding cookie/JWT drift now that the encryption spec is locked.

> **Open audit.** Drain in subsequent sessions.

---

## 1. Headline findings

| # | Severity | Title | Owning file(s) for fix |
|---|---|---|---|
| AU1 | **S1** | **Refresh-cookie `SameSite` contradiction.** `06-sessions.md §1` and `10-device-and-security.md §...` both lock `SameSite=Strict`. But `19-security-privacy/01-threat-model.md §2 Authentication` row says `SameSite=Lax`. Strict vs Lax is a real behavior difference — Strict blocks the refresh cookie on top-level cross-site navigations (e.g. clicking a magic-link from email), which would break magic-link sign-in. Either threat-model is right (Lax is correct for magic-link flows) and sessions/device specs are wrong, or the magic-link flow is silently broken. | `06-sessions.md §1`; `10-device-and-security.md`; OR `19-security-privacy/01-threat-model.md §2` |
| AU2 | **S2** | **JWT signing-key rotation cadence ambiguity.** `06-sessions.md §11` says "JWT signing key rotated **quarterly**; old keys remain valid for **24 h** overlap." `19-security-privacy/03-encryption.md §3` table says rotation **90 d** with "next" key "rolled in **1 d** before activation". Numerically equivalent (quarterly ≈ 90d, 24h = 1d) but the language is inconsistent enough that codegen tooling parsing one would not match the other. Pick one phrasing and reference it from the other. | `06-sessions.md §11`; `19-security-privacy/03-encryption.md §3` |
| AU3 | **S2** | **JWT `roles` claim does not include `system`, but the locked enum has 7 values.** `06-sessions.md §1` correctly notes "canonical `org_role` enum minus `system`, which is never JWT-issuable" — this is fine semantically, but the constraint is enforced only by prose. There is no SQL CHECK or code generator hook that would catch a `system`-claim being issued. Add an explicit "verifiers MUST reject JWTs containing `system` in the `roles` claim" rule. Aligns with the SP7 hardening pattern just added to `03-encryption.md §4`. | `06-sessions.md §1` |
| AU4 | **S2** | **Magic-link path family inconsistent.** `02-signup-and-signin.md §5.1`: send uses `/v1/auth/magic-link/send` (kebab); callback uses `/v1/auth/magic/callback` (short). Same family, different stem. `13-rate-limit-values.md §2` only lists the send variant. Either pick one stem (`magic-link` for both, since it's the longer / more readable form) or document that the callback intentionally uses the short stem. | `02-signup-and-signin.md §5.1` |
| AU5 | **S2** | **OAuth callback URL family ambiguous.** `02-signup-and-signin.md §1` says OAuth callbacks live at `/auth/callback/:provider` (no `/v1/`, web route). `04-oauth-providers.md §...` and `12-oauth-clients.md` corroborate that web route. But `13-rate-limit-values.md §2` lists `GET /v1/auth/oauth/:provider/callback` (a different path). Two possibilities: (a) the rate-limit table refers to a different (server-side) endpoint, in which case it should be named differently to avoid collision, or (b) one of them is wrong. Resolve and document. | `13-rate-limit-values.md §2`; `04-oauth-providers.md` |
| AU6 | **S3** | **`01-identity-model.md §1` `Account.password_hash` annotation says "argon2id".** This is correct, but the annotation just says the algorithm with no parameters. Compare with `03-passwords-and-mfa.md §2` which gives full `m=64MB, t=3, p=4`. Either inline the parameters as a one-line annotation or add an explicit "see `03-passwords-and-mfa.md §2`" reference. | `01-identity-model.md §1` |
| AU7 | **S3** | **`Org.kind` enum drift vs locked roles map.** `01-identity-model.md §1 Org` has `kind` enum `personal \| team`. But Core memory (Toby mapping) explicitly distinguishes Org from Space, and several spec files use "Personal Org" + "Team Org" + (implicit) "Lifetime Org" tier. Lifetime is on `plan_id`, not `kind`, so this is fine — but the relationship between `kind` and `plan_id` should be explicit (e.g. "Personal kind → plan_id ∈ {free, pro, lifetime}; Team kind → plan_id ∈ {team}"). | `01-identity-model.md §1` |
| AU8 | **S3** | **`Org.plan_id` enum incomplete.** `01-identity-model.md §1` says "`free / pro / team / lifetime`" but `10-licensing-billing/` and the pricing surface also reference at minimum a free tier and time-limited trial states. Spot-check the actual enum definition in `02-data-model/01-organization.md` and reconcile. | `01-identity-model.md §1`; cross-check `02-data-model/01-organization.md` |
| AU9 | **S3** | **`06-sessions.md §1` `roles` claim shape uses pipes inside a JSON example.** The escaped pipes (`\|`) are markdown-table escapes leaking into a code-style example. Hard to copy-paste. Either make it a fenced code block with proper TypeScript-style union or strip the escapes. | `06-sessions.md §1` |
| AU10 | **S3** | **`03-passwords-and-mfa.md §13` says HIBP debounce is "600 ms; only after 10 chars typed".** But §1 sets the password minimum at 10. So HIBP check fires only on the threshold password, missing the strongest UX moment (8-9 chars where users would benefit from "this is too weak"). Consider lowering trigger to ≥ 8 chars or moving the trigger to "on blur + min-length-met". | `03-passwords-and-mfa.md §13` |

---

## 2. Recommended drain plan

| Session | Findings | Notes |
|---|---|---|
| Next | **AU1** | **S1.** Single-finding session. Decide Strict vs Lax (recommend Lax — needed for magic-link); fix in 2 files. |
| Following | AU2 + AU3 + AU4 + AU5 | Four S2 fixes touching 3 files (`06-sessions.md`, `02-signup-and-signin.md`, `13-rate-limit-values.md`). |
| Following | AU6 + AU7 + AU8 + AU9 + AU10 | All S3 polish — single session. |

Total estimated: 3 sessions to fully drain.

---

## 3. Files NOT audited but spot-checked clean

- `04-oauth-providers.md`, `05-sso-saml.md` — only spot-checked for callback paths.
- `07-org-membership.md`, `08-account-deletion.md` — not opened.
- `09-email-verification.md`, `10-device-and-security.md` — only spot-checked.
- `11-rate-limits-and-abuse.md`, `12-oauth-clients.md` — only spot-checked.

---

## 4. Cross-references

- Encryption (just-locked): `19-security-privacy/03-encryption.md`.
- Threat model (`SameSite` row): `19-security-privacy/01-threat-model.md §2`.
- Role enum SoT: `17-admin-org/03-roles.md §1`.
- Spec-issue tracker: `13-spec-issues/02-current-issues.md`.
- Last closed audit: `audit-2026-04-29-security-privacy-sweep-66.md` (10/10).
