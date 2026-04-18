# Secrets

Where secrets live, how they rotate, who can read them.

---

## 1. Storage tiers

| Tier | What lives here | Read access |
|---|---|---|
| **Lovable Cloud Secrets** (runtime) | API runtime secrets (Stripe, Resend, OAuth, JWT) | Edge Functions only |
| **Workspace Build Secrets** | Build-time tokens (npm, Sentry source-map upload) | CI only |
| **Vault (1Password Business)** | Master copies, recovery codes, root certs | Owner + 1 designated Admin |
| **Chrome Web Store** | Extension signing key | Owner only, hardware-key-protected |
| **Domain registrar** | Registrar password, 2FA recovery | Owner + Billing |
| **Cloud provider root** | Root API key | Owner only |

> ⚠️ **No secret lives in two tiers.** Vault is the only allowed mirror.

## 2. Naming convention

`<SURFACE>_<PROVIDER>_<PURPOSE>_<ENV>` is too long; we keep it short:

- `STRIPE_SECRET_KEY` — implicitly env-scoped because each env has its own Cloud project.
- Vault entries are tagged `env:dev|staging|prod`.

## 3. Rotation policy

| Secret class | Rotation cadence | Triggered also by |
|---|---|---|
| Database connection strings | Annual | Suspected leak |
| OAuth client secrets | Annual | Provider notification |
| Stripe / Paddle keys | When Stripe/Paddle issues a new one | Compromise |
| JWT signing keys (`JWT_SECRET`, `SHARE_LINK_HMAC_KEY`) | Quarterly | Suspected leak; rotation supports overlap window |
| Email API key | Annual | Bounce-rate spike |
| Cron bearer (`CRON_SECRET`) | Quarterly | Job exposure |
| TLS certs | Auto (Let's Encrypt, 60 d before expiry) | — |
| Owner / Admin passwords | Quarterly + 2FA mandatory | — |

## 4. Rotation procedure (general)

1. Generate new value in vault.
2. Add new value to Cloud Secrets as `<NAME>_NEXT`.
3. Deploy code that accepts both `<NAME>` and `<NAME>_NEXT` (overlap window).
4. After 24h, promote `<NAME>_NEXT` → `<NAME>`, remove old value.
5. Audit-log entry recorded automatically.

## 5. Access control

- **Two-person rule** for prod secret reads (1Password "approval required" workflow).
- All access logged to vault audit trail; reviewed weekly.
- New employees receive secrets via vault share, never email/Slack/git.
- Departing employees: vault access revoked **before** their last day; secrets they touched in last 90d rotated within 7d.

## 6. Forbidden patterns

- ❌ Secrets in git history. If found: `git filter-repo` + force-push + rotate immediately.
- ❌ Secrets in `.env` files committed (no `.env` in this codebase; we use Cloud Secrets at runtime).
- ❌ Secrets in client bundle. The CI bundle scanner greps for known prefixes (`sk_`, `whsec_`, `re_`, `phc_…` is OK because PostHog public).
- ❌ Sharing secrets in chat / DM.

## 7. Cross-references

- Env-var inventory: `03-env-vars.md`
- Audit log: `17-admin-org/04-audit-log.md`
- Threat model: `19-security-privacy/01-threat-model.md`
