# 00 — Auth & Accounts Folder Overview

> **Purpose.** Define **identity, authentication, session lifecycle, multi-factor security, OAuth/SSO, and account lifecycle** end-to-end. This folder is the contract that the API, the extension, the web app, and Lovable Cloud Auth all honour. Drift here is a security incident.

---

## 1. Responsibilities

1. **Identity model.** What an `account` is, what an `auth_identity` is (one per provider per account), what `roles` an account can hold per Org.
2. **Sign-up and sign-in.** Email/password, OAuth, magic link.
3. **Passwords and MFA.** Argon2id hashing, MFA factors (TOTP, WebAuthn), recovery codes.
4. **OAuth providers.** Google, Apple, GitHub (v1 set); PKCE, scopes, redirect handling.
5. **SSO/SAML.** Enterprise SAML for Team/Enterprise plans (Phase 2+).
6. **Sessions.** Access JWT (short-lived) + refresh cookie (rotating); device list; per-session revoke.
7. **Org membership.** How a user joins an Org (invite or self-serve), role assignment, ownership transfer.
8. **Account deletion.** Soft-delete window, hard-delete after 30 days, data export option per GDPR.
9. **Email verification.** Required for email/password sign-up; tokenised links.
10. **Device & security.** Device fingerprinting (privacy-preserving), suspicious-login alert, "this wasn't me" flow.
11. **Rate limits & abuse.** Per-route limits with envelope reconciled to the canonical error envelope (F-M09, F-M10 closure).
12. **OAuth clients.** Internal client IDs for the extension and the web app.
13. **Locked role enum.** `owner, admin, editor, viewer, billing, guest, system` — pinned by SQL `CHECK`; W-1 + residue swept across `02-data-model`, `09-auth-accounts/01-identity-model.md`, `06-sessions.md`.

---

## 2. File-by-file behaviour

| File | Owns |
|---|---|
| `01-identity-model.md` | Account / auth_identity / org_member relationships; canonical role enum; `actor_role="system"` for service actors. |
| `02-signup-and-signin.md` | Email/password, OAuth, magic-link flows including endpoints, token issuance, callback, errors, telemetry (F-M13 closure). |
| `03-passwords-and-mfa.md` | Argon2id parameters, password policy, TOTP, WebAuthn, recovery codes. |
| `04-oauth-providers.md` | Google, Apple, GitHub: scopes, PKCE, account linking. |
| `05-sso-saml.md` | SAML metadata, JIT provisioning, role mapping from IdP groups. |
| `06-sessions.md` | Access JWT shape (`roles` claim = 6 user-assignable values), refresh cookie rotation, device list. |
| `07-org-membership.md` | Join via invite vs self-serve; role assignment; ownership transfer; leave. |
| `08-account-deletion.md` | 30-day soft window, hard-delete cascade, GDPR export. |
| `09-email-verification.md` | Token shape, expiry, single-use, resend rate limit. |
| `10-device-and-security.md` | Device record; suspicious-login alert; "this wasn't me" flow → revoke + force re-auth. |
| `11-rate-limits-and-abuse.md` | Per-route limits with snake_case route names + `/v1/` prefixes; references canonical envelope. |
| `12-oauth-clients.md` | Web app client, extension client; client IDs and allowed redirect URIs. |
| `13-rate-limit-values.md` | Numeric values + envelope reconciliation map (§0); canonical 429/402 envelope (§7); `BILLING_QUOTA_EXCEEDED` for org-wide quotas. |

---

## 3. Tasks performed by this folder

- **Issue and rotate sessions** (access JWT short-lived, refresh cookie rotating, single-use refresh).
- **Authenticate users** via email/password, OAuth, magic link, SSO.
- **Enforce MFA** when configured; manage factor enrolment and recovery codes.
- **Manage Org membership** (invite, accept, role-change, transfer ownership, leave).
- **Lifecycle accounts** (verify email, soft-delete, hard-delete, GDPR export).
- **Rate-limit auth-class routes** with the canonical error envelope.
- **Lock role enum semantics** so RLS and audit logs cannot drift.

---

## 4. What this folder is NOT

- **Not the share permission matrix.** That is `08-sharing-collab/05-permissions-matrix.md`.
- **Not the billing identity.** Stripe customer / Paddle customer mapping is in `10-licensing-billing/`.
- **Not the audit log.** Event format is in `08-sharing-collab/09-audit-log.md` and `12-history-undo/01-event-log.md`.

---

## 5. Cross-references

- Identity tables: `02-data-model/11-account.md`, `02-data-model/08-member.md`.
- Session header contract: `03-api-endpoints/01-conventions.md` §Auth headers.
- Error envelope: `03-api-endpoints/18-error-codes.md`.
- Email delivery: `22-infrastructure/11-email-provider.md`.
- Encryption (password hashing, token storage): `19-security-privacy/03-encryption.md`.
