# 00 — Licensing & Billing Folder Overview

> **Purpose.** Define **plans, entitlements, pricing, payment processors, lifetime licenses, proration, seat math, invoicing, dunning, coupons, revenue reporting, webhooks, cancellations, and the SKU map**. This folder is the upstream truth for every gated feature, every paywall, every CTA, and every webhook handler.

---

## 1. Responsibilities

1. **Plans matrix.** The single source of truth for pricing (W-3 lock). Marketing, in-app upgrade prompts, and entitlements engine all read from here.
2. **Entitlements engine.** Feature → plan → allowed/quota mapping; the runtime gate that every feature consults.
3. **Provider integrations.** Stripe (primary) and Paddle (parity) — both with canonical webhook payload schemas (F-M11 + Paddle parity closures).
4. **Lifetime licenses.** One-time purchase SKUs; redemption flow; non-transferability rules.
5. **Proration & upgrades.** Mid-cycle upgrades, downgrades, seat changes; how Stripe/Paddle's proration is normalised into our `amount_cents` representation.
6. **Seats & quotas.** Seat = active member; quota = countable resource (Spaces, Items, Shares); enforcement points.
7. **Invoices & tax.** Tax-inclusive vs tax-exclusive; VAT/GST/sales tax surfacing; invoice PDF source.
8. **Dunning & recovery.** Failed-payment retry schedule; grace period; lock-out flow.
9. **Coupons & promotions.** Coupon definitions; stacking rules; expiry.
10. **Revenue reporting.** Per-period MRR/ARR; refund handling; cohort attribution.
11. **Webhooks.** Stripe + Paddle event ingestion with `(provider, event_id)` idempotency tuple; replay-safe.
12. **Cancellations & refunds.** Cancel-at-period-end vs immediate; refund eligibility window.
13. **SKU map.** `_yearly` suffix locked (W-6); `amount_cents` units locked (W-10).
14. **Support system surface.** Lightweight in-app contact path tied to billing context.

---

## 2. File-by-file behaviour

| File | Owns |
|---|---|
| `01-plans-matrix.md` | Canonical pricing & feature matrix. Drift elsewhere = bug. |
| `02-entitlements-engine.md` | Runtime gate; cache TTL; how plan changes propagate. |
| `03-stripe-integration.md` | Customer / Subscription / Invoice mapping; webhook events consumed. |
| `04-paddle-integration.md` | Paddle classic→billing mapping; webhook events consumed. |
| `05-lifetime-licenses.md` | One-time SKUs; redemption; key generation. |
| `06-proration-and-upgrades.md` | Plan-change math; immediate vs end-of-period. |
| `07-seats-and-quotas.md` | Seat counting (active member); quota counting (Spaces, Items, Shares); soft vs hard caps. |
| `08-invoices-and-tax.md` | Invoice PDF source, tax surfacing per region. |
| `09-dunning-and-recovery.md` | Retry schedule, grace, lock-out. |
| `10-coupons-and-promotions.md` | Coupon model, stacking, expiry. |
| `11-revenue-reporting.md` | MRR/ARR computation, refund effect. |
| `12-billing-webhooks.md` | Internal handler interface for both Stripe and Paddle events. |
| `13-cancellations-and-refunds.md` | Cancel modes; refund eligibility. |
| `14-support-system.md` | In-app support entry point; ticket categorisation. |
| `15-sku-map.md` | Master list of every SKU, currency-canonical fields in `amount_cents`, `_yearly` suffix locked. |

---

## 3. Tasks performed by this folder

- **Provide pricing once** so marketing, upgrade prompts, and entitlements never disagree.
- **Gate every feature** through the entitlements engine.
- **Normalise webhooks** from Stripe and Paddle into a single internal event shape with `(provider, event_id)` idempotency.
- **Compute proration** consistently across providers.
- **Enforce seat and quota math** at the API edge.
- **Surface dunning and lock-out states** to the UI (`05-web-app/08-billing-page.md`).

---

## 4. What this folder is NOT

- **Not the billing UI.** Page lives in `05-web-app/08-billing-page.md`; wireframe in `06-ui-ux/wireframes/05-billing.md`.
- **Not the payment provider runtime.** Webhook ingestion endpoint contract lives in `03-api-endpoints/17-billing-webhooks.md`.
- **Not the marketing pricing page.** That page renders the values defined here.

---

## 5. Cross-references

- Webhook endpoint contract: `03-api-endpoints/17-billing-webhooks.md`.
- Billing UI: `05-web-app/08-billing-page.md`.
- License & subscription tables: `02-data-model/10-license.md`.
- Pricing rendered on marketing site: `05-web-app/13-marketing-site.md`.
- Quota error envelope: `09-auth-accounts/13-rate-limit-values.md` §6 (`BILLING_QUOTA_EXCEEDED`).
