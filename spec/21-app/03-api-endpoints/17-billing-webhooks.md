# Billing Webhooks

Inbound webhooks from payment providers. Authenticated via provider HMAC signature, NOT bearer.

Rate limit class: `webhook`. All endpoints respond `200 OK` with empty body on success; non-2xx triggers provider retry.

> Implementation note: webhook handlers MUST be idempotent — providers will retry. Dedup by `(provider, event_id)`.

---

### Stripe webhook
`POST /v1/webhooks/stripe`

**Auth:** header `Stripe-Signature` validated against env `STRIPE_WEBHOOK_SECRET`.
**Request body** raw Stripe event (do NOT parse before sig check).

**Handled event types** (others ignored with 200):

| Event | Action |
|---|---|
| `checkout.session.completed` | Activate subscription; set `plan`, `seats`, `current_period_*`. Emit `organization.subscription_activated`. |
| `customer.subscription.updated` | Update `plan`, `seats`, `interval`, `cancel_at_period_end`. Recompute entitlements; bump `entitlements_hash`. |
| `customer.subscription.deleted` | Downgrade to `free` at period end. Mark `status="canceled"`. |
| `invoice.paid` | Record invoice; reset dunning state. |
| `invoice.payment_failed` | Set `status="past_due"`; trigger dunning email; entitlements DOWNGRADED to free after 7 days unless resolved. |
| `customer.subscription.trial_will_end` | Email Owner 3 days before trial end. |
| `payment_method.attached` / `.detached` | Update `default_payment_method` cache. |
| `customer.updated` | Sync email/name if changed in Stripe portal. |

**Response 200** `{}`

**Errors**
- `400` — bad signature (no body parse)
- `409` — Org not found for `customer_id` (Stripe customer never bound; alert ops)

Webhook handler emits internal History Events (`actor_account_id=null`, `actor_kind="system"`) and pushes WebSocket invalidation messages so connected clients refresh entitlements within 5s.

#### Canonical payload schemas (Stripe — F-M11 closure 2026-04-19)

These are the **exact** subset of fields the handler reads. All money values use `amount_cents` (W-10) per `10-licensing-billing/15-sku-map.md`. Provider may send additional fields — ignore unknown keys. Every payload is wrapped in the standard Stripe envelope:

```json
{
  "id": "evt_1Pxxxxxx",
  "object": "event",
  "api_version": "2024-06-20",
  "created": 1745059200,
  "type": "<event.type>",
  "livemode": true,
  "data": { "object": { /* see per-event below */ } },
  "request": { "id": "req_xxx", "idempotency_key": null }
}
```

**`checkout.session.completed`** — `data.object`:
```json
{
  "id": "cs_test_xxx",
  "object": "checkout.session",
  "mode": "subscription",
  "payment_status": "paid",
  "status": "complete",
  "customer": "cus_xxx",
  "subscription": "sub_xxx",
  "client_reference_id": "01J...organization_id",
  "currency": "usd",
  "amount_total": 500,
  "amount_subtotal": 500,
  "metadata": {
    "organization_id": "01J...",
    "plan_code": "pro_monthly",
    "seats": "1"
  }
}
```
- **Required:** `customer`, `subscription`, `metadata.organization_id`, `metadata.plan_code`.
- **Action:** bind `customer → organization_id`; activate License row with `plan = metadata.plan_code`, `seats = metadata.seats`, `provider_subscription_id = subscription`. Emit `organization.subscription_activated`.

**`invoice.paid`** — `data.object`:
```json
{
  "id": "in_xxx",
  "object": "invoice",
  "customer": "cus_xxx",
  "subscription": "sub_xxx",
  "status": "paid",
  "currency": "usd",
  "amount_paid": 500,
  "amount_due": 500,
  "amount_remaining": 0,
  "period_start": 1745059200,
  "period_end": 1747651200,
  "billing_reason": "subscription_cycle",
  "hosted_invoice_url": "https://invoice.stripe.com/i/...",
  "invoice_pdf": "https://pay.stripe.com/invoice/.../pdf"
}
```
- **Required:** `customer`, `subscription`, `amount_paid`, `period_start`, `period_end`.
- **Action:** insert into `invoices` (key: `(provider, id)`); reset dunning state on the License; advance `current_period_start/end`. Emit `invoice.paid` History Event with `{ amount_cents: amount_paid, currency }`.

**`customer.subscription.updated`** — `data.object`:
```json
{
  "id": "sub_xxx",
  "object": "subscription",
  "customer": "cus_xxx",
  "status": "active",
  "current_period_start": 1745059200,
  "current_period_end": 1747651200,
  "cancel_at_period_end": false,
  "canceled_at": null,
  "trial_end": null,
  "items": {
    "data": [
      {
        "id": "si_xxx",
        "price": {
          "id": "price_pro_monthly_usd_LIVE",
          "unit_amount": 500,
          "currency": "usd",
          "recurring": { "interval": "month", "interval_count": 1 }
        },
        "quantity": 1
      }
    ]
  },
  "metadata": { "organization_id": "01J...", "plan_code": "pro_monthly" }
}
```
- **Required:** `customer`, `status`, `items.data[0].price.id`, `items.data[0].quantity`, `current_period_*`, `cancel_at_period_end`.
- **Action:** resolve `price.id` → `plan_code` via `licensing.skuMap` (never trust `metadata.plan_code` alone — it can be stale on plan changes). Update License: `plan`, `seats = items.data[0].quantity`, `interval = price.recurring.interval`, `current_period_*`, `cancel_at_period_end`, `status`. Recompute entitlements; bump `entitlements_hash` on the JWT-issuance side.

**`customer.subscription.deleted`** — `data.object`:
```json
{
  "id": "sub_xxx",
  "object": "subscription",
  "customer": "cus_xxx",
  "status": "canceled",
  "canceled_at": 1745059200,
  "ended_at": 1747651200,
  "cancellation_details": {
    "reason": "cancellation_requested",
    "comment": null,
    "feedback": "too_expensive"
  }
}
```
- **Required:** `customer`, `status="canceled"`, `ended_at`.
- **Action:** mark License `status="canceled"`; schedule downgrade to `free` entitlements at `ended_at` (period end). Do NOT delete the License row — preserve for audit. Emit `organization.subscription_canceled` with `cancellation_details.reason`.

**Idempotency contract (all events):**
- Dedup key is `(provider, event.id)`. Store in `webhook_events` with PK `(provider, event_id)`. Second arrival → 200 OK with no side effects.
- All four handlers above are **safe to replay** end-to-end.
- Order is NOT guaranteed by Stripe; if `customer.subscription.updated` arrives before `checkout.session.completed`, buffer for ≤30s waiting for the bind, then alert ops.



---

### Paddle webhook
`POST /v1/webhooks/paddle`

**Auth:** Paddle Signature header (`Paddle-Signature`) HMAC-SHA256.

**Handled event types** (Paddle Billing v2):
- `subscription.created` → activate
- `subscription.updated` → recompute entitlements
- `subscription.canceled` → downgrade at period end
- `transaction.completed` → record invoice
- `transaction.payment_failed` → dunning

Same Org binding model as Stripe (via `customer_id`).

---

### Lifetime-deal redeem callback (AppSumo / PitchGround)
`POST /v1/webhooks/lifetime-redeem`

**Auth:** HMAC header `X-LMN-Lifetime-Signature` over body using per-partner secret.

**Request body**
```json
{
  "partner": "appsumo",
  "event_id": "evt_...",
  "license_code": "LMNL-XXXX-XXXX-XXXX",
  "tier": "pro_lifetime",
  "stack_quantity": 1,
  "buyer_email": "...",
  "purchased_at": "..."
}
```

**Response 200** `{ "received": true }`

Server marks the code as `issued` in the licenses table; user redeems it later via `16-licenses.md → redeem`.

**Errors**
- `409` — duplicate `event_id` (idempotent ack with 200)
- `400` — bad signature

---

### Webhook delivery diagnostics (admin)
`GET /v1/webhooks/_recent`

**Auth:** bearer + Owner of internal `lmn-ops` Org.
**Query** `provider=stripe&status=failed&limit=50`

**Response 200**
```json
{
  "data": [
    {
      "id": "01J...",
      "provider": "stripe",
      "event_id": "evt_...",
      "event_type": "invoice.payment_failed",
      "received_at": "...",
      "status": "succeeded",
      "attempts": 1,
      "last_error": null,
      "organization_id": "01J..."
    }
  ]
}
```

Internal-only; not part of the public API surface.
