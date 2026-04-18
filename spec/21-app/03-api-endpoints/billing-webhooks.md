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

Server marks the code as `issued` in the licenses table; user redeems it later via `licenses.md → redeem`.

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
