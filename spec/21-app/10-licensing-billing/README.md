# 10 — Licensing & Billing

How money flows in and entitlements flow out.

Two distinct concerns:
1. **Subscriptions** — recurring Stripe/Paddle plans (Free / Pro / Team / Team Enterprise).
2. **Lifetime Licenses** — one-time purchases (AppSumo, ProductHunt, founder deals) redeemed against an Account.

Both ultimately produce **entitlements** consumed by the rest of the app.

## Reading order

1. `pricing-and-plans.md` — canonical plan matrix (what each tier includes).
2. `entitlements-engine.md` — how entitlements are computed & cached.
3. `stripe-integration.md` — Stripe products, prices, checkout, customer portal.
4. `paddle-integration.md` — Paddle as alternative for VAT-heavy markets.
5. `lifetime-licenses.md` — license keys, redemption, stacking.
6. `proration-and-upgrades.md` — mid-cycle changes, downgrade rules.
7. `seats-and-quotas.md` — Team seat enforcement, overage handling.
8. `invoices-and-tax.md` — invoice generation, tax handling, receipts.
9. `dunning-and-recovery.md` — failed payments, grace periods, win-backs.
10. `coupons-and-promotions.md` — promo codes, referral credits, partner deals.
11. `revenue-reporting.md` — internal MRR/ARR, churn dashboards.
12. `billing-webhooks.md` — webhook handlers, idempotency, signature verification.
13. `cancellations-and-refunds.md` — cancellation flow, refund policy, retention.

## Files

| File | Purpose |
|---|---|
| `pricing-and-plans.md` | Plan matrix |
| `entitlements-engine.md` | Capability resolution |
| `stripe-integration.md` | Stripe primary |
| `paddle-integration.md` | Paddle alt |
| `lifetime-licenses.md` | One-time deals |
| `proration-and-upgrades.md` | Plan transitions |
| `seats-and-quotas.md` | Team seats |
| `invoices-and-tax.md` | Receipts & tax |
| `dunning-and-recovery.md` | Failed payments |
| `coupons-and-promotions.md` | Discounts |
| `revenue-reporting.md` | Internal metrics |
| `billing-webhooks.md` | Inbound events |
| `cancellations-and-refunds.md` | End-of-life |

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
