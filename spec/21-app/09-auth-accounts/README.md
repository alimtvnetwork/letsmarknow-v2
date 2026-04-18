# 09 — Auth & Accounts

How identity, sessions, and Org membership work across web app, extension, and PWA.

## Reading order

1. `identity-model.md` — Account vs Member vs Org relationship.
2. `signup-and-signin.md` — email/password + OAuth + magic link flows.
3. `passwords-and-mfa.md` — password rules, TOTP, recovery codes.
4. `oauth-providers.md` — Google, Apple, GitHub configuration.
5. `sso-saml.md` — Team-tier SAML / SCIM provisioning.
6. `sessions.md` — JWT model, refresh, session table, sign-out everywhere.
7. `org-membership.md` — invites, roles, domain claim, transfer.
8. `account-deletion.md` — deletion flow, grace, GDPR export.
9. `email-verification.md` — verify on signup + on email change.
10. `device-and-security.md` — device list, suspicious-login alerts, IP heuristics.
11. `rate-limits-and-abuse.md` — auth-specific throttling and bot defenses.

## Files

| File | Purpose |
|---|---|
| `identity-model.md` | Core relationships |
| `signup-and-signin.md` | Entry flows |
| `passwords-and-mfa.md` | Credential security |
| `oauth-providers.md` | Social sign-in |
| `sso-saml.md` | Enterprise SSO |
| `sessions.md` | Token & session lifecycle |
| `org-membership.md` | Multi-tenant rules |
| `account-deletion.md` | Account end-of-life |
| `email-verification.md` | Address verification |
| `device-and-security.md` | Device tracking |
| `rate-limits-and-abuse.md` | Anti-abuse |

## Locked rules

- **Account = identity, Org = workspace, Member = role binding.** Never collapse these.
- **Roles in a separate table** (`user_roles`-equivalent), never on the profile/users table. Enforced by `has_role()` security-definer function.
- **Refresh tokens are HttpOnly cookies** on `.letsmarknow.com`. Access tokens are short-lived JWTs (15 min).
- **MFA available for all plans, required for Team Owners.**
- **Server-side validation only** — client checks are UX hints. Never trust client-stored role claims.
- **No password storage in localStorage / sessionStorage / extension storage.**
- **Email is the canonical identifier** but Account ID (UUIDv7) is the primary key everywhere internally.
- **Deletion is soft for 30 days, then hard.** GDPR export available before deletion.
