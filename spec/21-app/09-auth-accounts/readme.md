# 09 — Auth & Accounts

How identity, sessions, and Org membership work across web app, extension, and PWA.

## Reading order

1. `01-identity-model.md` — Account vs Member vs Org relationship.
2. `02-signup-and-signin.md` — email/password + OAuth + magic link flows.
3. `03-passwords-and-mfa.md` — password rules, TOTP, recovery codes.
4. `04-oauth-providers.md` — Google, Apple, GitHub configuration.
5. `05-sso-saml.md` — Team-tier SAML / SCIM provisioning.
6. `06-sessions.md` — JWT model, refresh, session table, sign-out everywhere.
7. `07-org-membership.md` — invites, roles, domain claim, transfer.
8. `08-account-deletion.md` — deletion flow, grace, GDPR export.
9. `09-email-verification.md` — verify on signup + on email change.
10. `10-device-and-security.md` — device list, suspicious-login alerts, IP heuristics.
11. `11-rate-limits-and-abuse.md` — auth-specific throttling and bot defenses.

## Files

| File | Purpose | Phase |
|---|---|---|
| `01-identity-model.md` | Core relationships | P0 (foundational) |
| `02-signup-and-signin.md` | Entry flows | P0 (email+pw, Google, Apple) / P1 (GitHub, magic link) |
| `03-passwords-and-mfa.md` | Credential security | P0 (passwords) / P1 (TOTP) / P2 (recovery codes UI) |
| `04-oauth-providers.md` | Social sign-in | P0 (Google, Apple) / P1 (GitHub) |
| `05-sso-saml.md` | Enterprise SSO | P2 (Team tier) |
| `06-sessions.md` | Token & session lifecycle | P0 |
| `07-org-membership.md` | Multi-tenant rules | P0 (single personal Org) / P1 (multi-Org switcher) / P2 (invites, domain claim, transfer) |
| `08-account-deletion.md` | Account end-of-life | P1 |
| `09-email-verification.md` | Address verification | P1 |
| `10-device-and-security.md` | Device tracking | P2 |
| `11-rate-limits-and-abuse.md` | Anti-abuse | P0 (basic) / P1 (full heuristics) |
| `12-oauth-clients.md` | OAuth client config | P0 (Google, Apple) / P1 (GitHub) / P2 (SAML) |
| `13-rate-limit-values.md` | Rate-limit tuning table | P0 |

> **Phase legend:** P0 = MVP, P1 = v1, P2 = Collab, P3 = Mindmap/AI, P4 = Cross-browser. Source of truth: `20-roadmap/`.

## Locked rules

- **Account = identity, Org = workspace, Member = role binding.** Never collapse these.
- **Roles in a separate table** (`user_roles`-equivalent), never on the profile/users table. Enforced by `has_role()` security-definer function.
- **Refresh tokens are HttpOnly cookies** on `.letsmarknow.com`. Access tokens are short-lived JWTs (15 min).
- **MFA available for all plans, required for Team Owners.**
- **Server-side validation only** — client checks are UX hints. Never trust client-stored role claims.
- **No password storage in localStorage / sessionStorage / extension storage.**
- **Email is the canonical identifier** but Account ID (UUIDv7) is the primary key everywhere internally.
- **Deletion is soft for 30 days, then hard.** GDPR export available before deletion.
