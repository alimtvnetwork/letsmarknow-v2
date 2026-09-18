# 07 — Privacy Policy (Public)

> **Status.** Stub authored Session 41 to close SI-026 forward-ref. Final legal copy to be reviewed by counsel before v1 Phase 1 launch.
> **Owns.** The public, user-facing privacy policy text published at `https://letsmarknow.com/privacy`. This is the single document referenced by both the web app footer and the Chrome Web Store listing.

---

## 1. Purpose

A single human-readable privacy policy that satisfies:
- GDPR (EU/UK/CH) — see `19-security-privacy/04-gdpr-ccpa.md` for the underlying legal basis we rely on.
- CCPA / CPRA (California).
- Chrome Web Store privacy disclosure requirements (cross-referenced from `19-security-privacy/06-extension-privacy.md`).
- Apple/Google authentication providers' linked-policy requirements when a user signs in with Apple/Google.

---

## 2. Required sections (template)

The published policy must contain these sections in this order:

1. **Who we are.** Legal entity name, contact email (`privacy@letsmarknow.com`), postal address.
2. **What we collect.** Mirrors `06-extension-privacy.md` §2 (CWS taxonomy) plus web-app-only data (Stripe customer id, billing email).
3. **Why we collect it.** Per-purpose: account, sync, billing, opt-in product analytics, security/abuse-prevention.
4. **Legal basis (GDPR).** Per-purpose legal basis (contract, legitimate interest, consent). Source: `19-security-privacy/04-gdpr-ccpa.md`.
5. **How long we keep it.** Retention schedule. Source: `19-security-privacy/02-data-handling.md`.
6. **Who we share it with.** Sub-processor list — Lovable Cloud (managed Supabase), Stripe, Resend (transactional email). No advertising or data brokers, ever.
7. **Where we store it.** Region/data residency disclosure. Source: `19-security-privacy/02-data-handling.md`.
8. **Your rights.** Access, rectification, erasure, portability, objection, withdraw consent. CCPA "Do Not Sell or Share" link (we do not sell, but the link is required).
9. **How to exercise rights.** Self-serve in-app where possible (`09-auth-accounts/08-account-deletion.md`), email fallback.
10. **Cookies & local storage.** What we set, why, opt-out path.
11. **Children.** Service is not directed to children under 13 (COPPA) / under 16 (GDPR). We do not knowingly collect from minors.
12. **Changes to this policy.** Notification policy (in-app banner + email for material changes; 30-day notice).
13. **Contact & complaints.** DPO contact + EU representative + lead supervisory authority.
14. **Effective date & version.** Date stamp + change log link.

---

## 3. Sub-processor list (single source of truth)

The policy's §6 enumerates these — keep this list in sync with `19-security-privacy/02-data-handling.md`:

| Sub-processor | Purpose | Data category | Region |
|---|---|---|---|
| Lovable Cloud (managed Supabase) | Database, auth, storage, edge functions | All user data | EU (default) / US (opt-in for US-billed orgs) |
| Stripe | Payment processing | Billing email, payment instrument tokens | US/EU per Stripe routing |
| Resend | Transactional email | Email address, message body | US |

Adding a sub-processor requires: updating this table, publishing a 30-day advance notice, and updating the deployed policy. Tracked as a release-gate in `04-extension/13-update-and-rollout.md`.

---

## 4. What this file is NOT

- **Not the legal contract with paid customers.** That's the Terms of Service, separate document.
- **Not the internal data-handling spec.** That's `19-security-privacy/02-data-handling.md` (engineering-facing).
- **Not the Chrome Web Store extension-only disclosure.** That's `19-security-privacy/06-extension-privacy.md` (CWS-form-shaped).

---

## 5. Cross-references

- Cited from: `04-extension/14-analytics-telemetry.md` line 103, `04-extension/17-store-listing.md` §2 (Privacy policy URL row), `04-extension/17-store-listing.md` §8.
- Internal data-handling spec: `19-security-privacy/02-data-handling.md`.
- GDPR/CCPA legal basis: `19-security-privacy/04-gdpr-ccpa.md`.
- Extension-specific CWS disclosure: `19-security-privacy/06-extension-privacy.md`.
- Account deletion flow: `09-auth-accounts/08-account-deletion.md`.
