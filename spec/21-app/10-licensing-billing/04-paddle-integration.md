# Paddle Integration

Paddle is used as **Merchant of Record** for tax-heavy markets (EU, UK, AU) where MoR convenience > Stripe Tax.

---

## 1. When Paddle is used

Routing decision at Checkout:
- Customer's billing country in `[EU+UK+AU+NZ]` → Paddle.
- Otherwise → Stripe.
- Org's `processor_pref` override available (Owner setting; mostly for legacy).

Once chosen, the Org's `org_subscription.processor` is locked to that processor; switching requires cancel + resubscribe.

## 2. Account model

- One Paddle Customer per Org (`paddle_customer_id`).
- Org Owner / Billing role can manage.

## 3. Products & prices

Mirrored Stripe matrix:
| Plan | Paddle Product | Price IDs (env-mapped) |
|---|---|---|
| Pro | `prod_pro_paddle` | `pri_pro_monthly`, `pri_pro_yearly` |
| Team | `prod_team_paddle` | `pri_team_monthly`, `pri_team_yearly` |

Same `plan_code` strings used everywhere internally; processor abstraction layer normalizes.

## 4. Checkout flow

- Paddle Billing v4 (Hosted Checkout).
- `POST /v1/billing/checkout/session` returns Paddle transaction URL.
- Custom data carried via `custom_data`: `{ org_id, account_id, plan_code }`.
- Paddle handles tax, payment, invoice generation.

## 5. Customer Portal

- Hosted Paddle Billing portal for card update, plan change, cancellation.
- We expose link via `POST /v1/billing/portal/session` (returns Paddle URL).

## 6. Subscription state

Same `org_subscription` table; `processor='paddle'`, `processor_subscription_id` stores Paddle subscription ID.

## 7. Webhooks

Listened events:
- `subscription.created` / `_updated` / `_canceled`
- `subscription.activated`
- `subscription.past_due`
- `transaction.completed` / `_payment_failed`
- `customer.updated`
- `adjustment.created` (refunds)

Endpoint: `POST /v1/billing/webhooks/paddle`.
Signature verified with `PADDLE_WEBHOOK_SECRET` (HMAC-SHA256).

## 8. Tax (MoR advantage)

- Paddle handles all VAT/GST collection + remittance; we receive net amounts.
- No Stripe Tax setup needed for these markets.
- Invoices issued by Paddle as the seller of record.

## 9. Currency

- Auto-localized by Paddle per buyer's country.
- Internal storage: minor units + currency code.

## 10. Seat management

- Same logic as Stripe; quantity updates trigger Paddle subscription update with proration.
- API: `paddle.subscriptions.update({ items: [{ price_id, quantity }], proration_billing_mode: "prorated_immediately" })`.

## 11. Idempotency

- Paddle's `event.id` used as dedupe key in `processed_webhook_events`.
- Outbound API calls: Paddle generates idempotency natively per request UUID we pass.

## 12. Currency parity

- Plan prices configured in major currencies (USD, EUR, GBP, AUD).
- Display rules same as Stripe.
- No "swap processor for cheaper price" — country-locked.

## 13. Error handling

- Failed payment → Paddle dunning + our own grace logic mirrored.
- Webhook processing failure → 500 returned; Paddle retries with backoff.

## 14. Telemetry

- `paddle.checkout_started`
- `paddle.checkout_completed` `{ amount_minor, currency }`
- `paddle.subscription_created` / `_updated` / `_canceled`
- `paddle.transaction_completed` / `_failed`
- `paddle.webhook_received` `{ type, latency_ms }`

## 15. Security

- Webhook signature verification mandatory.
- Paddle API key in secrets store.
- No raw card data ever touches our infra.

## 16. Edge cases

| Case | Behavior |
|---|---|
| Customer relocates from Paddle country to non-Paddle | Subscription continues; renewals stay on Paddle |
| Paddle outage | Checkout falls back to "try again later"; existing subs unaffected |
| Webhook arrives before our DB row exists | Buffered + retried (race during checkout completion) |
| Refund via Paddle Dashboard | Adjustment webhook updates our records |

## 17. Tests

- Routing decision tree (country → processor).
- Webhook signature verification.
- Processor abstraction parity tests (same operations across both).
- Tax inclusion in displayed price for B2C EU.
