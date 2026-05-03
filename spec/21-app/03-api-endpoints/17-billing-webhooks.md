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

**Auth:** Paddle Signature header (`Paddle-Signature`) HMAC-SHA256 validated against env `PADDLE_WEBHOOK_SECRET`.
**Request body:** raw Paddle event JSON (do NOT parse before sig check).

**Handled event types** (Paddle Billing v2):

| Event | Action |
|---|---|
| `subscription.created` | Activate License; set `plan`, `seats`, `current_billing_period_*`. Emit `organization.subscription_activated`. |
| `subscription.updated` | Update `plan`, `seats`, `interval`, `scheduled_change`. Recompute entitlements; bump `entitlements_hash`. |
| `subscription.canceled` | Downgrade to `free` at period end. Mark `status="canceled"`. |
| `transaction.completed` | Record invoice; reset dunning state. |
| `transaction.payment_failed` | Set `status="past_due"`; trigger dunning email; entitlements DOWNGRADED to free after 7 days unless resolved. |

Same Org binding model as Stripe (via `customer_id`).

**Response 200** `{}`

**Errors**
- `400` — bad signature (no body parse)
- `409` — Org not found for `customer_id` (Paddle customer never bound; alert ops)

Webhook handler emits internal History Events (`actor_account_id=null`, `actor_role="system"`) and pushes WebSocket invalidation messages so connected clients refresh entitlements within 5s.

#### Canonical payload schemas (Paddle — F-M11 parity 2026-04-19)

These are the **exact** subset of fields the handler reads. All money values are converted to `amount_cents` on ingest (W-10) — Paddle sends them as **stringified integers in the smallest currency unit** under `details.totals.*` and `items[].price.unit_price.amount`. Provider may send additional fields — ignore unknown keys. Every payload is wrapped in the standard Paddle envelope:

```json
{
  "event_id": "evt_01j...",
  "event_type": "<event.type>",
  "occurred_at": "2026-04-19T07:49:00.000Z",
  "notification_id": "ntf_01j...",
  "data": { /* see per-event below */ }
}
```

> **Idempotency key:** `event_id` (NOT `notification_id` — Paddle replays the same event with new notification IDs).

**`subscription.created`** — `data`:
```json
{
  "id": "sub_01j...",
  "status": "active",
  "customer_id": "ctm_01j...",
  "address_id": "add_01j...",
  "currency_code": "USD",
  "started_at": "2026-04-19T07:49:00.000Z",
  "first_billed_at": "2026-04-19T07:49:00.000Z",
  "current_billing_period": {
    "starts_at": "2026-04-19T07:49:00.000Z",
    "ends_at": "2026-05-19T07:49:00.000Z"
  },
  "billing_cycle": { "interval": "month", "frequency": 1 },
  "items": [
    {
      "price": {
        "id": "pri_pro_monthly_usd_LIVE",
        "product_id": "pro_pro",
        "unit_price": { "amount": "500", "currency_code": "USD" },
        "billing_cycle": { "interval": "month", "frequency": 1 }
      },
      "quantity": 1,
      "status": "active"
    }
  ],
  "custom_data": {
    "organization_id": "01J...",
    "plan_code": "pro_monthly"
  }
}
```
- **Required:** `customer_id`, `id`, `custom_data.organization_id`, `custom_data.plan_code`, `items[0].price.id`, `items[0].quantity`.
- **Action:** bind `customer_id → organization_id`; activate License with `plan = custom_data.plan_code`, `seats = items[0].quantity`, `provider_subscription_id = id`, `current_period_start = current_billing_period.starts_at`, `current_period_end = current_billing_period.ends_at`. Emit `organization.subscription_activated`.

**`subscription.updated`** — `data`:
```json
{
  "id": "sub_01j...",
  "status": "active",
  "customer_id": "ctm_01j...",
  "currency_code": "USD",
  "current_billing_period": {
    "starts_at": "2026-05-19T07:49:00.000Z",
    "ends_at": "2026-06-19T07:49:00.000Z"
  },
  "billing_cycle": { "interval": "month", "frequency": 1 },
  "scheduled_change": null,
  "items": [
    {
      "price": {
        "id": "pri_team_monthly_usd_LIVE",
        "unit_price": { "amount": "900", "currency_code": "USD" },
        "billing_cycle": { "interval": "month", "frequency": 1 }
      },
      "quantity": 3,
      "status": "active"
    }
  ],
  "custom_data": { "organization_id": "01J...", "plan_code": "team_monthly" }
}
```
- **Required:** `customer_id`, `status`, `items[0].price.id`, `items[0].quantity`, `current_billing_period.*`, `scheduled_change`.
- **Action:** resolve `price.id` → `plan_code` via `licensing.skuMap` (never trust `custom_data.plan_code` alone — it can be stale on plan changes). Update License: `plan`, `seats = items[0].quantity`, `interval = billing_cycle.interval`, `current_period_*`, `cancel_at_period_end = (scheduled_change?.action === "cancel")`, `status`. Recompute entitlements; bump `entitlements_hash`.

**`subscription.canceled`** — `data`:
```json
{
  "id": "sub_01j...",
  "status": "canceled",
  "customer_id": "ctm_01j...",
  "canceled_at": "2026-04-19T07:49:00.000Z",
  "current_billing_period": {
    "starts_at": "2026-04-19T07:49:00.000Z",
    "ends_at": "2026-05-19T07:49:00.000Z"
  },
  "scheduled_change": {
    "action": "cancel",
    "effective_at": "2026-05-19T07:49:00.000Z",
    "resume_at": null
  }
}
```
- **Required:** `customer_id`, `status="canceled"`, `scheduled_change.effective_at` (or `current_billing_period.ends_at` as fallback).
- **Action:** mark License `status="canceled"`; schedule downgrade to `free` entitlements at `scheduled_change.effective_at` (period end). Do NOT delete the License row — preserve for audit. Emit `organization.subscription_canceled` with `cancellation_details = { reason: "user_requested", effective_at }`. (Paddle does not send a structured cancel reason; default to `"user_requested"`.)

**`transaction.completed`** — `data`:
```json
{
  "id": "txn_01j...",
  "status": "completed",
  "customer_id": "ctm_01j...",
  "subscription_id": "sub_01j...",
  "invoice_id": "inv_01j...",
  "invoice_number": "12345-10001",
  "currency_code": "USD",
  "billed_at": "2026-04-19T07:49:00.000Z",
  "billing_period": {
    "starts_at": "2026-04-19T07:49:00.000Z",
    "ends_at": "2026-05-19T07:49:00.000Z"
  },
  "details": {
    "totals": {
      "subtotal": "500",
      "tax": "0",
      "total": "500",
      "grand_total": "500",
      "currency_code": "USD"
    }
  },
  "origin": "subscription_recurring"
}
```
- **Required:** `customer_id`, `subscription_id`, `details.totals.grand_total`, `billing_period.*`, `invoice_id`.
- **Action:** insert into `invoices` (key: `(provider, id)` where `id = transaction.id`); reset dunning state on the License; advance `current_period_start/end`. Emit `invoice.paid` History Event with `{ amount_cents: parseInt(details.totals.grand_total), currency: currency_code }`. PDF URL fetched lazily via Paddle API `GET /transactions/{id}/invoice` (not in webhook).

**`transaction.payment_failed`** — `data`:
```json
{
  "id": "txn_01j...",
  "status": "past_due",
  "customer_id": "ctm_01j...",
  "subscription_id": "sub_01j...",
  "currency_code": "USD",
  "details": {
    "totals": {
      "grand_total": "500",
      "currency_code": "USD"
    }
  },
  "payments": [
    {
      "payment_attempt_id": "pay_01j...",
      "status": "error",
      "error_code": "card_declined",
      "captured_at": null
    }
  ]
}
```
- **Required:** `customer_id`, `subscription_id`, `payments[0].error_code`.
- **Action:** Set License `status="past_due"`; trigger dunning email (`10-licensing-billing/16-billing-emails.md`); schedule entitlements downgrade to `free` after 7 days unless resolved. Emit `invoice.payment_failed` History Event with `{ amount_cents, currency, decline_code: payments[0].error_code }`. Map `error_code` to canonical `BILLING_PAYMENT_FAILED` envelope per `18-error-codes.md` §3.6 when surfacing to admin UI.

**Idempotency contract (all Paddle events):**
- Dedup key is `(provider, event_id)` — the `event_id` field, NOT `notification_id`. Store in `webhook_events` with PK `(provider, event_id)`. Second arrival → 200 OK with no side effects.
- All five handlers above are **safe to replay** end-to-end.
- Order is NOT guaranteed by Paddle; if `subscription.updated` arrives before `subscription.created`, buffer for ≤30s waiting for the bind, then alert ops.
- Paddle replays a failed delivery up to 60 times over 3 days with exponential backoff; the handler MUST return 2xx within 5s or Paddle will retry.

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

### Inbound email-in webhook (per-org address)
`POST /v1/webhooks/email-in`

**Auth:** webhook signature (Postmark / SES per `22-infrastructure/11-email-provider.md`); NO bearer.
**Idempotent:** yes (server dedupes by `provider_message_id`)
**Rate limit class:** webhook (60 / min per Org address; see `09-auth-accounts/13-rate-limit-values.md §80`)

> **Why this exists.** Each Org has a unique `inbox-<token>@in.letsmarknow.com` address (`11-import-export/08-email-in.md`). The provider POSTs every received message here; the server resolves the recipient → Org, then enqueues an item-create job from the email body / attachments. The endpoint is webhook-shaped (signature-verified, raw body) rather than API-shaped (bearer, JSON envelope).

**Request body** — provider-native (Postmark JSON or SES SNS notification). Payload shape is documented by the provider; the server normalizes internally.

**Required signature header**
- Postmark: `X-Postmark-Signature` (HMAC-SHA256 of raw body with the per-Org webhook secret)
- SES: `x-amz-sns-message-signature` validated against the SNS topic's public cert

**Response 200**
```json
{
  "data": {
    "received": true,
    "organization_id": "01J...",
    "job_id": "01J...",
    "deduped": false
  }
}
```

> Returns 200 even when the message is dropped (spam, unknown recipient, signature mismatch logged). The provider must NOT retry on 4xx.

**Errors**
- `401 UNAUTHENTICATED` — signature invalid → response logged but provider sees `200` to suppress retries (spec convention; protects against replay-storm from a compromised secret).
- `413 PAYLOAD_TOO_LARGE` — body > 25 MB; provider should retry with smaller chunks (most do not — message is dropped).

---

### Inbound webhook (per-org token; generic)
`POST /v1/webhooks/inbound/:webhook_token`

**Auth:** path-embedded `webhook_token` is the credential (NO bearer, NO header signature).
**Idempotent:** Idempotency-Key (caller-supplied; recommended)
**Rate limit class:** webhook (300 / min per token)

> **Why this exists.** Power-users and Zapier-style integrations need a no-signature, copy-paste-able URL to POST item-create payloads from arbitrary upstream tools (RSS-to-LMN bridges, "save to LMN" bookmarklets in legacy environments, Make/n8n flows). The token is generated in `/settings/integrations/webhooks` and is bearer-equivalent; rotating it invalidates all upstream wiring.
>
> **Security:** Tokens are scoped to an Org and (optionally) a single Collection. They cannot read, only write. They cannot create members, shares, or billing changes. See `19-security-privacy/01-threat-model.md` for the full ACL.

**Path params**
- `webhook_token` — opaque `lmn_wh_<base32>`, 40+ chars; rotates on revoke.

**Request body**
```json
{
  "kind": "item",
  "url": "https://example.com/article",
  "title": "Optional override",
  "description": "Optional override",
  "tags": ["ai", "tools"],
  "destination": { "kind": "collection", "collection_id": "01J..." },
  "source": { "name": "Zapier", "external_id": "zap-04823" }
}
```

- `kind` enum (currently): `item`. Future: `note`, `session`.
- `destination` — optional; falls back to the token's default collection.
- `source.external_id` — used by the server for dedupe across retries when the caller cannot send `Idempotency-Key`.

**Response 202**
```json
{
  "data": {
    "received": true,
    "job_id": "01J...",
    "item_id": null
  }
}
```

`item_id` is populated synchronously when the URL is small / the dedupe-store has a hit; otherwise the client polls `GET /v1/jobs/:job_id` (`20-jobs.md`).

**Errors**
- `401 UNAUTHENTICATED` — unknown / revoked token.
- `403 FORBIDDEN` — token Org is suspended OR `destination` outside token's scope.
- `429 RATE_LIMITED` — token exceeded per-minute budget.

See also `11-import-export/07-webhooks-and-api-imports.md §63`.

---

### Apple "Sign in with Apple" server-to-server notifications
`POST /v1/webhooks/apple-notifications`

**Auth:** `webhook-sig` — Apple-signed JWS payload; verified against Apple's public keys (JWK Set at `https://appleid.apple.com/auth/keys`). NO bearer.
**Idempotent:** by `(sub, event_time)` tuple from the decoded JWS payload (Apple may retry).
**Rate limit class:** webhook (10000 / min global).

> **Why this exists.** Apple sends `pop` events when a user revokes "Sign in with Apple" access, changes their relay email, or deletes their Apple ID. Per Apple's "REST API: process change notifications" requirement, every Sign in with Apple integration MUST register a callback URL and act on these events to keep account state in sync. Source-of-truth narrative: `09-auth-accounts/04-oauth-providers.md §4.2`.

**Request body** — JWS-signed envelope `{ "payload": "<base64url-jws>" }`. Decoded JWS claims:

```json
{
  "iss": "https://appleid.apple.com",
  "aud": "<our-services-id>",
  "iat": 1735000000,
  "jti": "abc123",
  "events": "{\"type\":\"email-disabled\",\"sub\":\"001234.abcdef.0001\",\"event_time\":1735000000000,\"email\":\"relay@privaterelay.appleid.com\",\"is_private_email\":\"true\"}"
}
```

**Event types handled** (Apple-defined): `email-disabled`, `email-enabled`, `consent-revoked`, `account-delete`.

**Behavior**
- `consent-revoked` / `account-delete` → unlink Apple OAuth identity from Account; if it was the sole identity, schedule the Account into the standard 30-day deletion grace per `09-auth-accounts/08-account-deletion.md`.
- `email-disabled` / `email-enabled` → flip the relay-email-active flag on the linked Account; never silently change the canonical `email` column.

**Response 200** — `{ "received": true }`. Apple retries on any non-2xx.

**Errors**
- `400 VALIDATION_FAILED` — JWS signature invalid or claims malformed.
- `401 UNAUTHENTICATED` — `iss` or `aud` mismatch.
- `409 CONFLICT` — duplicate `(sub, event_time)` already processed (idempotent no-op; still returns 200 in production to keep Apple from retrying).

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
