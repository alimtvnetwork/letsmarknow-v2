# SKU Map (Stripe + Paddle product / price IDs)

> **Closes gap M1.** Source of truth for every billable SKU.
> **Locked rule:** No code may hardcode a `price_xxx` or Paddle `pri_xxx` value. All references resolve through `licensing.skuMap` exported from `src/lib/billing/sku-map.ts` (codegenned from this file).

---

## 1. Conventions

- **Currency:** USD is canonical. Local currencies are *display-only* via Stripe automatic tax + currency conversion; invoices are issued in USD unless EU VAT MOSS forces local.
- **Billing periods:** `monthly` and `annual` only. Annual = 10× monthly (2 months free).
- **Trial:** 14 days, no card, applied via Stripe coupon `TRIAL14` / Paddle discount `dsc_trial14`.
- **Proration:** Stripe default (immediate, prorated). Paddle uses `prorate_billing` flag.
- **Lifetime SKUs:** one-time purchase; never expire; exempt from dunning.
- **Naming:** Stripe IDs are `price_{tier}_{period}_{currency}`; Paddle uses opaque `pri_xxx` issued by dashboard.
- **Environments:** Each SKU has `live` and `test` IDs. Test IDs are placeholder strings until the dashboards are provisioned — the file structure is locked, the literal IDs are owner-fillable.

---

## 2. Stripe SKU table

| Tier | Period | Stripe Product ID | Stripe Price ID (live) | Stripe Price ID (test) | Amount (USD) |
|---|---|---|---|---|---|
| Free | — | `prod_free` | — (no charge) | — | 0.00 |
| Pro | monthly | `prod_pro` | `price_pro_monthly_usd_LIVE` | `price_pro_monthly_usd_TEST` | 8.00 |
| Pro | annual | `prod_pro` | `price_pro_annual_usd_LIVE` | `price_pro_annual_usd_TEST` | 80.00 |
| Team | monthly (per seat) | `prod_team` | `price_team_monthly_usd_LIVE` | `price_team_monthly_usd_TEST` | 12.00 |
| Team | annual (per seat) | `prod_team` | `price_team_annual_usd_LIVE` | `price_team_annual_usd_TEST` | 120.00 |
| Lifetime Personal | one-time | `prod_lifetime_personal` | `price_lifetime_personal_usd_LIVE` | `price_lifetime_personal_usd_TEST` | 199.00 |
| Lifetime Team (5 seats) | one-time | `prod_lifetime_team5` | `price_lifetime_team5_usd_LIVE` | `price_lifetime_team5_usd_TEST` | 599.00 |

## 3. Paddle SKU table (alternative billing region — EU/UK)

| Tier | Period | Paddle Product ID | Paddle Price ID (live) | Paddle Price ID (sandbox) | Amount (USD) |
|---|---|---|---|---|---|
| Pro | monthly | `pro_paddle_TBD` | `pri_pro_monthly_LIVE` | `pri_pro_monthly_SBX` | 8.00 |
| Pro | annual | `pro_paddle_TBD` | `pri_pro_annual_LIVE` | `pri_pro_annual_SBX` | 80.00 |
| Team | monthly (per seat) | `team_paddle_TBD` | `pri_team_monthly_LIVE` | `pri_team_monthly_SBX` | 12.00 |
| Team | annual (per seat) | `team_paddle_TBD` | `pri_team_annual_LIVE` | `pri_team_annual_SBX` | 120.00 |
| Lifetime Personal | one-time | `lt_personal_paddle_TBD` | `pri_lt_personal_LIVE` | `pri_lt_personal_SBX` | 199.00 |
| Lifetime Team5 | one-time | `lt_team5_paddle_TBD` | `pri_lt_team5_LIVE` | `pri_lt_team5_SBX` | 599.00 |

## 4. Coupons & promotions (canonical IDs)

| Code | Stripe Coupon | Paddle Discount | Effect |
|---|---|---|---|
| TRIAL14 | `coupon_trial14` | `dsc_trial14` | 14-day full discount on first invoice |
| LAUNCH50 | `coupon_launch50` | `dsc_launch50` | 50% off for 3 months, expires 2026-06-30 |
| EDU20 | `coupon_edu20` | `dsc_edu20` | 20% off forever, manual issue only |

## 5. Tax behaviour

- **Stripe Tax** enabled; tax IDs collected at checkout for B2B EU invoices.
- **Paddle MoR** handles VAT/GST end-to-end (no separate tax engine).
- **Reverse charge:** EU B2B with valid VAT ID → 0% VAT, line item shows `Reverse charge — VAT to be accounted by recipient`.

## 6. Codegen target

```ts
// src/lib/billing/sku-map.ts (generated; do not edit by hand)
export const skuMap = {
  stripe: {
    pro_monthly:  { live: "price_pro_monthly_usd_LIVE",  test: "price_pro_monthly_usd_TEST",  amountUsd: 800 },
    pro_annual:   { live: "price_pro_annual_usd_LIVE",   test: "price_pro_annual_usd_TEST",   amountUsd: 8000 },
    team_monthly: { live: "price_team_monthly_usd_LIVE", test: "price_team_monthly_usd_TEST", amountUsd: 1200 },
    team_annual:  { live: "price_team_annual_usd_LIVE",  test: "price_team_annual_usd_TEST",  amountUsd: 12000 },
    lifetime_personal: { live: "price_lifetime_personal_usd_LIVE", test: "price_lifetime_personal_usd_TEST", amountUsd: 19900 },
    lifetime_team5:    { live: "price_lifetime_team5_usd_LIVE",    test: "price_lifetime_team5_usd_TEST",    amountUsd: 59900 },
  },
  paddle: { /* mirror */ },
} as const;

export type SkuKey = keyof typeof skuMap.stripe;
```

## 7. Operational rules

1. Adding a new SKU → update this file → regenerate `sku-map.ts` → add Stripe + Paddle IDs together (never one provider).
2. Deprecating a SKU → mark `deprecated: true` in the table; keep the row for 24 months for invoice replay.
3. Rotation: live IDs are immutable; never re-use a deleted price ID for a new product.

## 8. Locked rules

- All amounts in **integer cents** in code.
- Annual = 10× monthly. Hard rule.
- Lifetime SKUs never appear in `subscriptions`; they live in `licenses`.
- Only `owner` and `billing` roles can see the live IDs in admin UI.
