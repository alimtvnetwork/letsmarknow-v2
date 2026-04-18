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

| File | Purpose |
|---|---|
| `01-identity-model.md` | Core relationships |
| `02-signup-and-signin.md` | Entry flows |
| `03-passwords-and-mfa.md` | Credential security |
| `04-oauth-providers.md` | Social sign-in |
| `05-sso-saml.md` | Enterprise SSO |
| `06-sessions.md` | Token & session lifecycle |
| `07-org-membership.md` | Multi-tenant rules |
| `08-account-deletion.md` | Account end-of-life |
| `09-email-verification.md` | Address verification |
| `10-device-and-security.md` | Device tracking |
| `11-rate-limits-and-abuse.md` | Anti-abuse |

## Locked rules

- **Account = identity, Org = workspace, Member = role binding.** Never collapse these.
- **Roles in a separate table** (`user_roles`-equivalent), never on the profile/users table. Enforced by `has_role()` security-definer function.
- **Refresh tokens are HttpOnly cookies** on `.letsmarknow.com`. Access tokens are short-lived JWTs (15 min).
- **MFA available for all plans, required for Team Owners.**
- **Server-side validation only** — client checks are UX hints. Never trust client-stored role claims.
- **No password storage in localStorage / sessionStorage / extension storage.**
- **Email is the canonical identifier** but Account ID (UUIDv7) is the primary key everywhere internally.
- **Deletion is soft for 30 days, then hard.** GDPR export available before deletion.
