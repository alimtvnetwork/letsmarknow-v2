# 10 — Licensing & Billing

How money flows in and entitlements flow out.

Two distinct concerns:
1. **Subscriptions** — recurring Stripe/Paddle plans (Free / Pro / Team / Team Enterprise).
2. **Lifetime Licenses** — one-time purchases (AppSumo, ProductHunt, founder deals) redeemed against an Account.

Both ultimately produce **entitlements** consumed by the rest of the app.

## Reading order

1. `01-plans-matrix.md` — canonical plan matrix (what each tier includes).
2. `02-entitlements-engine.md` — how entitlements are computed & cached.
3. `03-stripe-integration.md` — Stripe products, prices, checkout, customer portal.
4. `04-paddle-integration.md` — Paddle as alternative for VAT-heavy markets.
5. `05-lifetime-licenses.md` — license keys, redemption, stacking.
6. `06-proration-and-upgrades.md` — mid-cycle changes, downgrade rules.
7. `07-seats-and-quotas.md` — Team seat enforcement, overage handling.
8. `08-invoices-and-tax.md` — invoice generation, tax handling, receipts.
9. `09-dunning-and-recovery.md` — failed payments, grace periods, win-backs.
10. `10-coupons-and-promotions.md` — promo codes, referral credits, partner deals.
11. `11-revenue-reporting.md` — internal MRR/ARR, churn dashboards.
12. `12-billing-webhooks.md` — webhook handlers, idempotency, signature verification.
13. `13-cancellations-and-refunds.md` — cancellation flow, refund policy, retention.

## Files

| File | Purpose | Phase |
|---|---|---|
| `01-plans-matrix.md` | Plan matrix | P0 (Free locked) / P1 (Pro, Team, Lifetime live) |
| `02-entitlements-engine.md` | Capability resolution | P0 (foundational) |
| `03-stripe-integration.md` | Stripe primary | P1 |
| `04-paddle-integration.md` | Paddle alt | P1 (config-gated) |
| `05-lifetime-licenses.md` | One-time deals | P1 |
| `06-proration-and-upgrades.md` | Plan transitions | P1 |
| `07-seats-and-quotas.md` | Team seats | P2 |
| `08-invoices-and-tax.md` | Receipts & tax | P1 |
| `09-dunning-and-recovery.md` | Failed payments | P1 (cron-backed) |
| `10-coupons-and-promotions.md` | Discounts | P1 |
| `11-revenue-reporting.md` | Internal metrics | P2 |
| `12-billing-webhooks.md` | Inbound events | P1 |
| `13-cancellations-and-refunds.md` | End-of-life | P1 |
| `14-support-system.md` | Support tooling | P2 |
| `15-sku-map.md` | SKU canonical map | P1 |

> **Phase legend:** P0 = MVP, P1 = v1, P2 = Collab, P3 = Mindmap/AI, P4 = Cross-browser. Source of truth: `20-roadmap/`.

## Locked rules

- **Server is sole authority on entitlements.** Client never grants itself capabilities.
- **Stripe is the primary processor.** Paddle is enabled only for tax-heavy markets via configuration.
- **Idempotency on every webhook.** `event.id` is the dedupe key.
- **Lifetime licenses stack with subscriptions** but never grant >= the highest tier; they grant their own tier.
- **Downgrades take effect at period end.** Upgrades are immediate with proration.
- **Refunds are processed via the processor, never bespoke.** Audit logged.
- **No price information stored client-side.** All amounts come from Stripe/Paddle Price objects at request time.
- **Tax is calculated by the processor** (Stripe Tax / Paddle's built-in MoR).
- **All money values stored as integer minor units** (cents) with explicit currency.
