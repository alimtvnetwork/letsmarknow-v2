<!--
audit-date: 2026-04-29
next-audit-by: 2026-10-26
audit-type: ad-hoc
status: closed
opened-on: 2026-04-29
closed-on: 2026-04-29
closed-because: 10 of 10 findings drained — LB1+LB2 session 75; LB3-LB7 session 76; LB8-LB10 session 77.
scope: 10-licensing-billing/ folder — provider parity (Stripe/Paddle), money-units, status-enum, SKU map integrity, telemetry naming
-->

# Audit — Licensing & Billing Sweep (Session 74)

**Date:** 2026-04-29 (Session 74, Malaysia time UTC+8)
**Author:** Lovable agent
**Scope:** All 19 markdown files in `spec/21-app/10-licensing-billing/`, cross-checked against `02-data-model/10-license.md`, `03-api-endpoints/01-conventions.md` (money fields), and the just-locked `09-auth-accounts/01-identity-model.md` (AU8 — `Org.plan_id` denormalization rule).
**Reason:** First dedicated audit. Adjacent to AU8 closure which made `License.plan` the canonical SoT for plan tiers — high-leverage moment to find drift.

> **Open audit.** Drain in subsequent sessions.

---

## 1. Headline findings

| # | Severity | Title | Owning file(s) for fix |
|---|---|---|---|
| LB1 | **S1** | ✅ **Closed (Session 75).** Spelling unified to **`canceled`** (US, matches both Stripe and Paddle webhook payloads). `01-plans-matrix.md §10` telemetry `plan.cancelled` → `plan.canceled`. `16-billing-emails.md` `BILL_CANCELLATION_CONFIRMED` row trigger `subscription.cancelled` → `subscription.canceled` + email subject de-Britishized. `rg cancelled` over `10-licensing-billing/` now zero. | `01-plans-matrix.md §10`; `16-billing-emails.md` |
| LB2 | **S1** | ✅ **Closed (Session 75).** `08-invoices-and-tax.md` Invoice schema fields renamed `amount_{subtotal,tax,total}_minor` → `amount_{subtotal,tax,total}_cents` per locked W-10 rule and `02-data-model/00-overview.md §1.3`. `rg _minor` over `10-licensing-billing/` now zero. | `08-invoices-and-tax.md` (Invoice table) |
| LB3 | **S2** | ✅ **Closed (Session 76).** `02-entitlements-engine.md §50` `max_tier` ranking now uses `License.plan` enum directly (`free < pro < team`). Team Enterprise documented as `License.plan = team` + bespoke uplifts in `org_entitlement_overrides` per deal — no enum change needed. | `02-entitlements-engine.md §50` |
| LB4 | **S2** | ✅ **Closed (Session 76, false alarm).** Re-read `15-sku-map.md §3` line 46 — `team_enterprise_yearly` row IS present in the Paddle table (`team_ent_paddle_TBD` / `_custom-quoted_`). Original audit scan missed it. No change required. | `15-sku-map.md §3` |
| LB5 | **S2** | ✅ **Closed (Session 76).** Added `subscription.trial_will_end` Paddle event in both `12-billing-webhooks.md §4` (handler table) and `04-paddle-integration.md §7` (listened-events list); fires `BILL_TRIAL_ENDING` at T-3 days for parity with Stripe. | `12-billing-webhooks.md §4`; `04-paddle-integration.md §7` |
| LB6 | **S2** | ✅ **Closed (Session 76).** Documented Paddle's design: no standalone `payment_method.*` events; PM state derived from `subscription.updated` + `transaction.completed` payloads. Note added to both `12-billing-webhooks.md §4` (parity note) and `04-paddle-integration.md §7`. Handlers MUST extract PM state from those events. | `12-billing-webhooks.md §4`; `04-paddle-integration.md §7` |
| LB7 | **S2** | ✅ **Closed (Session 76).** `03-stripe-integration.md §5` `org_subscription.processor` enum widened to `stripe \| paddle` with explicit cross-reference to `04-paddle-integration.md §3` ("writes `processor='paddle'` to the same table"). The Stripe spec now correctly hosts the canonical enum SoT. | `03-stripe-integration.md §5` |
| LB8 | **S3** | ✅ **Closed (Session 77).** `15-sku-map.md §7.4` rewritten: "SKU key MUST match a Plan ID listed in `01-plans-matrix.md §6 (Plan IDs)`". Also reinforced `01-plans-matrix.md §6` to define that `plan_code` is the runtime-field name carrying these Plan ID strings (referenced by `03-stripe-integration.md §6`, `04-paddle-integration.md`, `06-proration-and-upgrades.md`). | `15-sku-map.md §7`; `01-plans-matrix.md §6` |
| LB9 | **S3** | ✅ **Closed (Session 77).** Paddle Product IDs in `15-sku-map.md §3` rewritten as `<pro_paddle_live>`, `<team_paddle_live>`, `<team_ent_paddle_live>`, `<lt_pro_paddle_live>`, `<lt_team_paddle_live>` — matching the placeholder convention used in §2 (Stripe `<price_*_live>`). Added §3 lead note explaining placeholders. `rg _TBD` over `10-licensing-billing/` now zero. | `15-sku-map.md §3` |
| LB10 | **S3** | ✅ **Closed (Session 77).** Added explicit `included_seats` column to both Stripe (§2) and Paddle (§3) SKU tables (null for per-seat / non-seat SKUs; `5` for `lifetime_team`). Codegen target in §6 updated: every entry now carries `included_seats: number \| null`. Row labels de-duplicated ("Lifetime (Team)" instead of "Lifetime (Team, 5 seats)"). | `15-sku-map.md §2, §3, §6` |

---

## 2. Recommended drain plan

| Session | Findings | Notes |
|---|---|---|
| Next | LB1 + LB2 | Two **S1** fixes — both are spelling/naming locked-rule violations. Touches ~3 files. |
| Following | LB3 + LB4 + LB5 + LB6 + LB7 | Five **S2** — provider parity + enum SoT cleanup. Touches `02-data-model/10-license.md`, `15-sku-map.md`, `12-billing-webhooks.md`, both provider integration files. |
| Following | LB8 + LB9 + LB10 | Three **S3** polish — single session. |

Total estimated: 3 sessions to fully drain.

---

## 3. Files NOT deeply audited (spot-checked only)

- `05-lifetime-licenses.md`, `06-proration-and-upgrades.md`, `07-seats-and-quotas.md`, `09-dunning-and-recovery.md`, `10-coupons-and-promotions.md`, `11-revenue-reporting.md`, `13-cancellations-and-refunds.md`, `14-support-system.md` — read for keyword matches only.

---

## 4. Cross-references

- License.plan enum SoT: `02-data-model/10-license.md §1`.
- AU8 closure (`Org.plan_id` is denormalization): `audit-2026-04-29-auth-accounts-sweep-70.md` AU8.
- Money-field convention: `03-api-endpoints/01-conventions.md §9` + `15-sku-map.md` line 6 (W-10 closure).
- SKU period naming: `15-sku-map.md` line 5 (W-6 closure: `_yearly` not `_annual`).
- Last closed audit: `audit-2026-04-29-auth-accounts-sweep-70.md` (10/10).
