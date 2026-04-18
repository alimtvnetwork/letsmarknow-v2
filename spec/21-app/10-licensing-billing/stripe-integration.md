# Stripe Integration

Stripe is the primary processor. Used for all USD/non-VAT-heavy markets.

---

## 1. Account model

- One Stripe Customer per Org (not per Account).
- `stripe_customer_id` stored on `org` row.
- Org Owner / Billing role can manage payment methods.

## 2. Products & prices

| Plan | Stripe Product | Prices |
|---|---|---|
| Pro | `prod_pro` | `price_pro_monthly_usd`, `price_pro_yearly_usd` |
| Team | `prod_team` | `price_team_monthly_usd`, `price_team_yearly_usd` |
| Team Enterprise | `prod_team_ent` | Custom prices created per contract |

Price IDs configured via env vars per environment; never hardcoded.

## 3. Checkout flow

1. User clicks "Upgrade" → `POST /v1/billing/checkout/session` with `{ plan_code, qty?, success_url, cancel_url }`.
2. Server creates Stripe Checkout Session (`mode=subscription`) with:
   - `customer` (existing or new via `customer_creation=if_required`).
   - `line_items` (price + quantity for Team seats).
   - `metadata`: `{ org_id, account_id, plan_code }`.
   - `subscription_data.trial_period_days` if applicable.
   - `automatic_tax.enabled = true` (Stripe Tax).
   - `tax_id_collection.enabled = true`.
   - `allow_promotion_codes = true`.
3. Server returns Checkout URL → client redirects.
4. On completion, Stripe redirects to `success_url`; webhook `checkout.session.completed` finalizes the upgrade.

## 4. Customer Portal

- "Manage billing" → `POST /v1/billing/portal/session` returns Stripe Portal URL.
- Portal allows: change card, change plan, cancel, view invoices, update tax ID.
- Configuration enforces our allowed actions (no plan-product changes — handled in our app).

## 5. Subscription state

`org_subscription` table:
| Field | Type | Notes |
|---|---|---|
| `org_id` | UUIDv7 | |
| `processor` | enum | `stripe` |
| `processor_subscription_id` | text | |
| `processor_customer_id` | text | |
| `plan_code` | text | `pro_monthly` etc. |
| `quantity` | int | seats for Team |
| `status` | enum | `trialing \| active \| past_due \| paused \| canceled` |
| `current_period_start`, `current_period_end` | timestamptz | |
| `cancel_at_period_end` | bool | |
| `trial_end` | timestamptz? | |
| `last_synced_at` | timestamptz | |

State is **derived from Stripe**; webhooks keep it in sync.

## 6. Webhooks

Listened events (handled in `billing-webhooks.md`):
- `checkout.session.completed`
- `customer.subscription.created` / `_updated` / `_deleted`
- `customer.subscription.trial_will_end`
- `invoice.created` / `_finalized` / `_paid` / `_payment_failed`
- `customer.updated`
- `charge.refunded`
- `payment_method.attached` / `_detached`

Endpoint: `POST /v1/billing/webhooks/stripe`.
Signature verified with `STRIPE_WEBHOOK_SECRET`.

## 7. Seat management (Team)

- Quantity = number of paid seats.
- Adding a Member beyond seats: prompt Owner to "Add seat ($X/mo)" → updates Stripe quantity (proration applied).
- Removing a Member doesn't auto-decrement seats; Owner must trim manually in `/settings/billing` to avoid accidental refunds.

## 8. Tax

- Stripe Tax enabled on all subscriptions.
- `automatic_tax.enabled = true` on Checkout + Subscriptions.
- Customer tax IDs collected for B2B; reverse-charge applied per EU rules.
- Tax shown line-item on invoices.

## 9. Currency

- Default: USD.
- Stripe Adaptive Pricing (when GA per-region) auto-converts; we display approximate local price on marketing site.
- Customers locked into the currency of their first subscription; switching requires cancel + resubscribe.

## 10. Idempotency

- All Stripe API mutations use `Idempotency-Key` header (UUIDv4 per logical request).
- Webhook handlers use `event.id` as dedupe key in `processed_webhook_events` table (90-day retention).

## 11. Test mode

- `dev` and `staging` environments use Stripe test keys + test fixtures.
- Webhook secret per environment.
- Stripe CLI used for local webhook forwarding during development.

## 12. Error handling

- Card decline at Checkout: handled by Stripe UI.
- Card decline at renewal: triggers dunning (`dunning-and-recovery.md`).
- Stripe API outage: queue mutations to `pending_billing_ops` table; retry with backoff.
- User-facing errors: friendly map of Stripe error codes → readable messages.

## 13. Telemetry

- `stripe.checkout_started` `{ plan_code }`
- `stripe.checkout_completed` `{ plan_code, amount_minor, currency }`
- `stripe.subscription_created`
- `stripe.subscription_updated` `{ from, to }`
- `stripe.subscription_canceled` `{ at_period_end }`
- `stripe.invoice_paid` `{ amount_minor, currency }`
- `stripe.invoice_failed` `{ attempt }`
- `stripe.webhook_received` `{ type, latency_ms }`
- `stripe.webhook_failed` `{ type, reason }`

## 14. Security

- Webhook signature verification non-negotiable.
- Stripe secret key stored in Lovable Cloud secrets; never in source.
- Customer Portal restricted to authenticated Owner/Billing role.
- Refund operations require Owner re-auth.

## 15. Edge cases

| Case | Behavior |
|---|---|
| Webhook delivered out-of-order | Dedup by `event.id`; state machine tolerates by checking `current_period_start` vs stored |
| Checkout abandoned | No state change; Stripe expires session at 24 h |
| Customer changes email in Stripe Portal | Webhook updates our Org email; we keep canonical |
| Subscription paused (e.g., lifetime stack) | `status=paused`; entitlements remain via lifetime |
| Refund issued from Stripe Dashboard | Webhook updates invoice; audit log reflects |

## 16. Tests

- Webhook signature verification (positive + negative).
- Checkout creation includes correct metadata.
- State machine transitions across all webhook types.
- Idempotency: replay event → no double-effect.
- Seat update proration math.
