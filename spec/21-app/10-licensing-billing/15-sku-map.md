# SKU Map (Stripe + Paddle product / price IDs)

> **Closes gap M1.** Source of truth for every billable SKU.
> **Reconciliation (2026-04-19, F-M11):** Pricing, naming, and tier inventory aligned with the locked `10-licensing-billing/01-plans-matrix.md`. Old prices ($5 / $9 / $79 / $249) and old naming (`_yearly`, `lifetime_pro`, `lifetime_team`) are canonical. Inflated draft numbers ($8 / $12 / $199 / $599) and renamed keys (`_annual`, `lifetime_personal`, `lifetime_team5`) are **withdrawn**. `team_enterprise_yearly` re-added.
> **W-6 closure (2026-04-19):** SKU period suffix is locked as `_yearly` (never `_annual`) across all 16 files in this folder. Verified by `grep -r "_annual" spec/21-app/10-licensing-billing/` returning only this withdrawal note.
> **W-10 closure (2026-04-19):** All money fields use `amount_cents` (integer, minor units of `currency`). The `amount_minor` alias is **withdrawn** and was replaced in 6 files: `03-stripe-integration.md`, `04-paddle-integration.md`, `06-proration-and-upgrades.md`, `08-invoices-and-tax.md`, `10-coupons-and-promotions.md`, `13-cancellations-and-refunds.md`. Telemetry payloads, webhook payloads, and API responses must all use `amount_cents`.
> **Locked rule:** No code may hardcode a `price_xxx` or Paddle `pri_xxx` value. All references resolve through `licensing.skuMap` exported from `src/lib/billing/sku-map.ts` (codegenned from this file).

---

## 1. Conventions

- **Currency:** USD is canonical. Local currencies are *display-only* via Stripe automatic tax + currency conversion; invoices issued in USD unless EU VAT MOSS forces local.
- **Billing periods:** `monthly` and `yearly` only.
- **Annual discount:** ~20% off monthly equivalent (e.g. Pro `12 × $5 = $60` → `$48` annual; Team `12 × $9 = $108` → `$84` annual). The "10× monthly" rule is **withdrawn** — per `01-plans-matrix.md` §4.
- **Trial:** 14 days, no card, applied via Stripe coupon `TRIAL14` / Paddle discount `dsc_trial14`.
- **Proration:** Stripe default (immediate, prorated). Paddle uses `prorate_billing` flag.
- **Lifetime SKUs:** one-time purchase; never expire; exempt from dunning.
- **Naming:** Stripe IDs are `price_{tier}_{period}_{currency}`; Paddle uses opaque `pri_xxx` issued by dashboard. SKU keys use `_yearly` (matches plan codes in `01-plans-matrix.md` §6).
- **Environments:** Each SKU has `live` and `test` IDs. Test IDs are placeholder strings until the dashboards are provisioned — the file structure is locked, the literal IDs are owner-fillable.
- **Team Enterprise:** custom-priced; no fixed `price_xxx` in either provider. Quoted per-deal; tracked in CRM, materialised as a Stripe invoice item at signing.

---

## 2. Stripe SKU table

> `included_seats` is the number of seats bundled into the SKU at purchase (currently only meaningful for Lifetime Team). `null` means "per-seat billing" (Team monthly/yearly) or "not applicable" (Free, Pro, Lifetime Pro). Per LB10 (audit-2026-04-29-licensing-billing-sweep-74).

| SKU key | Tier | Period | Stripe Product ID | Stripe Price ID (live) | Stripe Price ID (test) | Amount (USD) | included_seats |
|---|---|---|---|---|---|---|---|
| `free` | Free | — | `prod_free` | — (no charge) | — | 0.00 | null |
| `pro_monthly` | Pro | monthly | `prod_pro` | `price_pro_monthly_usd_LIVE` | `price_pro_monthly_usd_TEST` | 5.00 | null |
| `pro_yearly` | Pro | yearly | `prod_pro` | `price_pro_yearly_usd_LIVE` | `price_pro_yearly_usd_TEST` | 48.00 | null |
| `team_monthly` | Team | monthly (per seat) | `prod_team` | `price_team_monthly_usd_LIVE` | `price_team_monthly_usd_TEST` | 9.00 | null |
| `team_yearly` | Team | yearly (per seat) | `prod_team` | `price_team_yearly_usd_LIVE` | `price_team_yearly_usd_TEST` | 84.00 | null |
| `team_enterprise_yearly` | Team Enterprise | yearly (per seat) | `prod_team_enterprise` | _custom-quoted; created per-deal_ | _custom-quoted; created per-deal_ | custom | null |
| `lifetime_pro` | Lifetime (Pro) | one-time | `prod_lifetime_pro` | `price_lifetime_pro_usd_LIVE` | `price_lifetime_pro_usd_TEST` | 79.00 | null |
| `lifetime_team` | Lifetime (Team) | one-time | `prod_lifetime_team` | `price_lifetime_team_usd_LIVE` | `price_lifetime_team_usd_TEST` | 249.00 | 5 |

## 3. Paddle SKU table (alternative billing region — EU/UK)

> Paddle Product IDs below use illustrative placeholder strings (`<pro_paddle_live>`, etc.). Real opaque `pro_xxx` IDs are owner-fillable from the Paddle dashboard at provisioning time — same convention as the Stripe `_LIVE`/`_TEST` placeholders (§2). Per LB9 (audit-2026-04-29-licensing-billing-sweep-74).

| SKU key | Tier | Period | Paddle Product ID | Paddle Price ID (live) | Paddle Price ID (sandbox) | Amount (USD) | included_seats |
|---|---|---|---|---|---|---|---|
| `pro_monthly` | Pro | monthly | `<pro_paddle_live>` | `pri_pro_monthly_LIVE` | `pri_pro_monthly_SBX` | 5.00 | null |
| `pro_yearly` | Pro | yearly | `<pro_paddle_live>` | `pri_pro_yearly_LIVE` | `pri_pro_yearly_SBX` | 48.00 | null |
| `team_monthly` | Team | monthly (per seat) | `<team_paddle_live>` | `pri_team_monthly_LIVE` | `pri_team_monthly_SBX` | 9.00 | null |
| `team_yearly` | Team | yearly (per seat) | `<team_paddle_live>` | `pri_team_yearly_LIVE` | `pri_team_yearly_SBX` | 84.00 | null |
| `team_enterprise_yearly` | Team Enterprise | yearly (per seat) | `<team_ent_paddle_live>` | _custom-quoted_ | _custom-quoted_ | custom | null |
| `lifetime_pro` | Lifetime (Pro) | one-time | `<lt_pro_paddle_live>` | `pri_lt_pro_LIVE` | `pri_lt_pro_SBX` | 79.00 | null |
| `lifetime_team` | Lifetime (Team) | one-time | `<lt_team_paddle_live>` | `pri_lt_team_LIVE` | `pri_lt_team_SBX` | 249.00 | 5 |

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

> **Reconciled (F-M19, 2026-04-19):** field name is `amount_cents` (snake_case to match the API money convention in `03-api-endpoints/01-conventions.md` §9) and an explicit `currency` field is added so non-USD prices are forward-compatible. Old `amountUsd` (camelCase, currency baked into key) is withdrawn.
>
> **Reconciled (F-M21, 2026-04-19):** the `_LIVE` / `_TEST` suffix on price IDs is illustrative *placeholder* only. Real values are resolved at runtime via the env-keyed lookup in `licensing.skuMap.resolve(skuKey, env)` where `env = VITE_PUBLIC_ENV`. SKU **keys** never contain environment markers; only the **lookup table** is partitioned by env. This matches the locked rule in `01-plans-matrix.md` §6 ("Stripe Price IDs are mapped per-environment in config; never hardcoded in app code").

```ts
// src/lib/billing/sku-map.ts (generated; do not edit by hand)
export const skuMap = {
  stripe: {
    free:                   { live: null,                                test: null,                                amount_cents: 0,     currency: "USD" },
    pro_monthly:            { live: "<price_pro_monthly_usd_live>",      test: "<price_pro_monthly_usd_test>",      amount_cents: 500,   currency: "USD" },
    pro_yearly:             { live: "<price_pro_yearly_usd_live>",       test: "<price_pro_yearly_usd_test>",       amount_cents: 4800,  currency: "USD" },
    team_monthly:           { live: "<price_team_monthly_usd_live>",     test: "<price_team_monthly_usd_test>",     amount_cents: 900,   currency: "USD" },
    team_yearly:            { live: "<price_team_yearly_usd_live>",      test: "<price_team_yearly_usd_test>",      amount_cents: 8400,  currency: "USD" },
    team_enterprise_yearly: { live: null,                                test: null,                                amount_cents: null,  currency: "USD" /* custom-quoted */ },
    lifetime_pro:           { live: "<price_lifetime_pro_usd_live>",     test: "<price_lifetime_pro_usd_test>",     amount_cents: 7900,  currency: "USD" },
    lifetime_team:          { live: "<price_lifetime_team_usd_live>",    test: "<price_lifetime_team_usd_test>",    amount_cents: 24900, currency: "USD" },
  },
  paddle: { /* mirror, same shape */ },
} as const;

export type SkuKey = keyof typeof skuMap.stripe;

// Lookup helper — single source of truth at call sites.
// Resolution rule per F-M21: never inline live/test IDs; always go through resolve().
export function resolveSku(provider: "stripe" | "paddle", key: SkuKey, env: "live" | "test") {
  return skuMap[provider][key][env];
}
```

## 7. Operational rules

1. Adding a new SKU → update this file → regenerate `sku-map.ts` → add Stripe + Paddle IDs together (never one provider).
2. Deprecating a SKU → mark `deprecated: true` in the table; keep the row for 24 months for invoice replay.
3. Rotation: live IDs are immutable; never re-use a deleted price ID for a new product.
4. SKU key MUST match a `plan_code` in `01-plans-matrix.md` §6. Drift is a spec bug.

## 8. Locked rules

- All amounts in **integer cents** in code.
- Annual ≈ 20% off monthly. The "10× monthly" rule is withdrawn (F-M11).
- Lifetime SKUs never appear in `subscriptions`; they live in `licenses`.
- Only `owner` and `billing` roles can see the live IDs in admin UI.
- SKU naming uses `_yearly` (not `_annual`), `lifetime_pro` / `lifetime_team` (not `lifetime_personal` / `lifetime_team5`). This matches `01-plans-matrix.md` §6.
