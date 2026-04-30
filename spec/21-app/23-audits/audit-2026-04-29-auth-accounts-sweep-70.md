<!--
audit-date: 2026-04-29
next-audit-by: 2026-10-26
audit-type: ad-hoc
status: closed
opened-on: 2026-04-29
closed-on: 2026-04-29
closed-because: 10 of 10 findings drained — AU1 session 71; AU2-AU5 session 72; AU6-AU10 session 73.
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
| AU2 | **S2** | ✅ **Closed (Session 72).** `06-sessions.md §11` now references `19-security-privacy/03-encryption.md §3` as numeric SoT (90 d / 1 d) and stops restating values. | `06-sessions.md §11` |
| AU3 | **S2** | ✅ **Closed (Session 72).** `06-sessions.md §1` now mandates verifiers reject any JWT containing `roles: "system"` (logs `security.jwt_system_role_rejected`, forces re-auth). Mirrors SP7 hardening pattern. | `06-sessions.md §1` |
| AU4 | **S2** | ✅ **Closed (Session 72).** Magic-link callback path renamed `/v1/auth/magic/callback` → `/v1/auth/magic-link/callback`. Both endpoints now use the `magic-link` stem; short form deprecated and locked out by note in §5.1. | `02-signup-and-signin.md §5.1, §5.4` |
| AU5 | **S2** | ✅ **Closed (Session 72).** OAuth callback canonical path is `/v1/auth/oauth/:provider/callback` (per `03-api-endpoints/03-auth.md §OAuth`). `02-signup-and-signin.md §1` updated to point at it; `13-rate-limit-values.md §2` updated to use the canonical form and note the lay alias. | `02-signup-and-signin.md §1`; `13-rate-limit-values.md §2` |
| AU6 | **S3** | ✅ **Closed (Session 73).** `01-identity-model.md §1` `Account.password_hash` annotation now inlines params + references `03-passwords-and-mfa.md §2`. | `01-identity-model.md §1` |
| AU7 | **S3** | ✅ **Closed (Session 73).** `01-identity-model.md §1` `Org.kind` row now states cap-determination role; `plan_id` row now spells out allowed `(kind, plan_id)` combinations: personal → {free,pro,lifetime}; team → {team}. | `01-identity-model.md §1` |
| AU8 | **S3** | ✅ **Closed (Session 73).** `Org.plan_id` is now explicitly a denormalization of `License.plan` (canonical SoT: `02-data-model/10-license.md §1`). Lifecycle states (`trialing`, `past_due`, etc.) live on `License.status`, NOT on `Org.plan_id`. | `01-identity-model.md §1` |
| AU9 | **S3** | ✅ **Closed (incidentally, Session 72).** `06-sessions.md §1` `roles` claim was rewritten as prose (no escaped pipes) when AU3 added the system-rejection rule. | `06-sessions.md §1` |
| AU10 | **S3** | ✅ **Closed (Session 73).** `03-passwords-and-mfa.md §13` HIBP trigger lowered to ≥ 8 chars (was 10) + added `on blur` re-fire. Catches weak passwords before the 10-char minimum. | `03-passwords-and-mfa.md §13` |

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
