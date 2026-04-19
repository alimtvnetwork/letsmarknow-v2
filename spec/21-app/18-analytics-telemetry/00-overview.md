# 00 — Analytics & Telemetry Folder Overview

> **Purpose.** Define what the product **measures**, what it **does not measure**, where data goes, and how the user opts in/out. Privacy is the constraint, not the afterthought: nothing is captured without explicit consent or a documented legitimate-interest basis.

---

## 1. Responsibilities

1. **Opt-in analytics.** Self-hosted PostHog (per `22-infrastructure/01-hosting.md`); explicit consent gate; off by default in EU.
2. **Error reporting.** Self-hosted Sentry-compatible (GlitchTip); PII redaction rules; sample rate per environment.
3. **Event taxonomy.** Catalogue of every event the product emits with required and optional properties; the north-star metric and supporting funnels.

---

## 2. File-by-file behaviour

| File | Owns |
|---|---|
| `01-opt-in-analytics.md` | Consent UX, regional defaults, opt-out propagation, data retention. |
| `02-error-reporting.md` | Sentry/GlitchTip config; what to redact; release tagging from CI. |
| `03-events.md` | Event catalogue: name, description, required props, optional props, sampling. |

---

## 3. Tasks performed by this folder

- **Lock the consent model** per region (EU = explicit opt-in; rest = opt-in by default per locked rule in `19-security-privacy/`).
- **Redact PII** before any payload leaves the user's browser.
- **Tag releases** in error and analytics so regressions are attributable to a deploy (cf. `22-infrastructure/09-ci-cd.md` §2.4).
- **Define every emitted event** so dashboards and funnels are reproducible.

---

## 4. What this folder is NOT

- **Not the share-link analytics.** Per-share view counts live in `08-sharing-collab/11-share-analytics.md`.
- **Not billing/revenue analytics.** Those live in `10-licensing-billing/11-revenue-reporting.md`.
- **Not infra observability.** Logs/metrics/traces for system health are in `22-infrastructure/10-observability.md`.

---

## 5. Cross-references

- Hosting choice (PostHog, GlitchTip both self-hosted EU): `22-infrastructure/01-hosting.md`.
- Release tagging: `22-infrastructure/09-ci-cd.md` §2.4.
- Privacy policy basis: `19-security-privacy/04-gdpr-ccpa.md`.
- Extension telemetry rules: `04-extension/14-analytics-telemetry.md`.
