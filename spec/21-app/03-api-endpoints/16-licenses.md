# Licenses & Entitlements Endpoints

Read-only entitlement queries + checkout/portal links + lifetime-license redemption. The actual subscription state changes happen via `17-billing-webhooks.md`.

All require bearer auth + `X-Organization-Id` (except `/me`).

---

### Get my entitlements (per-Account, across all Orgs)
`GET /v1/me/entitlements`

**Response 200**
```json
{
  "data": {
    "account_id": "01J...",
    "entitlements_hash": "sha256:...",
    "by_organization": [
      {
        "organization_id": "01J...",
        "plan": "pro",
        "status": "active",
        "trial_ends_at": null,
        "current_period_end": "2026-05-18T...",
        "seats": 1,
        "seats_used": 1,
        "features": {
          "max_organizations": 50,
          "max_spaces_per_org": 500,
          "max_collections_per_org": 5000,
          "max_groups_per_collection": 500,
          "max_items_per_org": 100000,
          "max_active_shares": 100,
          "max_tags_per_org": 1000,
          "password_share": true,
          "expiring_share": true,
          "invite_only_share": true,
          "custom_share_slug": true,
          "share_analytics": true,
          "remove_branding": false,
          "bulk_import": true,
          "bulk_export": true,
          "history_retention_days": 90,
          "ai_tagging": false,
          "priority_support": false
        },
        "lifetime_license": null
      }
    ]
  }
}
```

`entitlements_hash` is included in JWT; clients compare to detect entitlement changes mid-session and refresh the token.

---

### Get organization billing summary
`GET /v1/organizations/:id/billing`

**Auth:** Owner or Billing role
**Response 200**
```json
{
  "data": {
    "plan": "pro",
    "status": "active",
    "billing_provider": "stripe",
    "customer_id": "cus_...",
    "subscription_id": "sub_...",
    "interval": "month",
    "amount": { "amount_cents": 999, "currency": "USD" },
    "seats": 1,
    "seats_used": 1,
    "current_period_start": "...",
    "current_period_end": "...",
    "cancel_at_period_end": false,
    "trial_ends_at": null,
    "next_invoice_estimate": { "amount_cents": 999, "currency": "USD" },
    "default_payment_method": {
      "type": "card",
      "brand": "visa",
      "last4": "4242",
      "exp_month": 12,
      "exp_year": 2028
    },
    "lifetime_license": null
  }
}
```

---

### Start checkout (create Stripe/Paddle session)
`POST /v1/organizations/:id/billing/checkout`

**Auth:** Owner or Billing
**Request body**
```json
{
  "plan": "pro",
  "interval": "month",
  "seats": 1,
  "success_url": "https://app.letsmarknow.com/billing/success",
  "cancel_url": "https://app.letsmarknow.com/billing"
}
```
**Response 200**
```json
{
  "data": {
    "checkout_url": "https://checkout.stripe.com/c/pay/cs_...",
    "session_id": "cs_...",
    "expires_at": "..."
  }
}
```

---

### Open billing portal
`POST /v1/organizations/:id/billing/portal`
**Body** `{ "return_url": "https://app.letsmarknow.com/billing" }`
**Response 200** `{ "data": { "portal_url": "https://billing.stripe.com/p/session/..." } }`

---

### Change plan / seats (without portal, for in-app upsell)
`POST /v1/organizations/:id/billing/change`
**Body**
```json
{ "plan": "team", "interval": "year", "seats": 5, "prorate": true }
```
**Response 200**
```json
{
  "data": {
    "applied": true,
    "effective_at": "now",
    "proration_amount": { "amount_cents": 1234, "currency": "USD" },
    "subscription_id": "sub_..."
  }
}
```

**Errors**
- `422 BUSINESS_RULE_VIOLATION` `details.reason="seats_below_used"` — would leave fewer seats than active members
- `402 PAYMENT_REQUIRED` `details.reason="payment_failed"` — provider declined; portal link returned

---

### Cancel subscription
`POST /v1/organizations/:id/billing/cancel`
**Body**
```json
{ "at_period_end": true, "reason": "too_expensive", "feedback": "..." }
```
**Response 200** Updated billing summary with `cancel_at_period_end=true`.

---

### Redeem lifetime license code
`POST /v1/organizations/:id/billing/lifetime/redeem`

**Idempotent:** with Idempotency-Key
**Request body**
```json
{ "code": "LMNL-XXXX-XXXX-XXXX" }
```
**Response 200**
```json
{
  "data": {
    "lifetime_license": {
      "code_masked": "LMNL-****-****-XXXX",
      "tier": "pro_lifetime",
      "stacked_seats": 1,
      "redeemed_at": "...",
      "redeemed_by_account_id": "01J..."
    },
    "plan": "pro",
    "status": "lifetime"
  }
}
```

**Errors**
- `404 NOT_FOUND` — code unknown
- `409 CONFLICT` `details.reason="already_redeemed"` — code used (in any Org)
- `409 CONFLICT` `details.reason="org_already_lifetime"` — Org already on a lifetime tier (use `stack`)
- `410 GONE` — code expired

---

### Stack additional lifetime code (for seats / tier upgrade)
`POST /v1/organizations/:id/billing/lifetime/stack`
Same body. Adds seats or upgrades tier per code's stack rules. Response includes new totals.

---

### Download an invoice as PDF
`GET /v1/billing/invoices/:id/pdf`

**Auth:** bearer + `X-Organization-Id` + role(`owner` | `admin` | `billing`)
**Idempotent:** yes (302 redirect; safe to retry)
**Rate limit class:** `read` (30 / hour per Account)

> **Why this exists.** Invoices are rendered and stored by the payment processor (Stripe / Paddle). Rather than re-rendering server-side, we 302-redirect to the processor's signed PDF URL. This means LMN never holds the PDF bytes (smaller attack surface, no file storage cost) and the URL always reflects the processor's latest tax/legal template.

**Path params**
- `id` — `invoice.id`. The Org context comes from `X-Organization-Id`; the server verifies the invoice belongs to that Org before redirecting.

**Response 302** — `Location: <processor-signed-url>`, expires per processor (Stripe: 30 days; Paddle: 24 h).

**Response 200** (when `Accept: application/json`)
```json
{
  "data": {
    "invoice_id": "01J...",
    "processor": "stripe",
    "pdf_url": "https://files.stripe.com/.../invoice.pdf",
    "pdf_url_expires_at": "2026-05-20T08:30:00Z",
    "number": "LMN-2026-04-00042",
    "amount_total_cents": 1900,
    "currency": "USD",
    "issued_at": "2026-04-20T08:30:00Z"
  }
}
```

> Clients that prefer to render the link without following the redirect should send `Accept: application/json`.

**Errors**
- `403 FORBIDDEN` — role lacks billing access OR invoice belongs to another Org
- `404 NOT_FOUND` — invoice does not exist
- `409 CONFLICT` — invoice in `draft` state (no PDF yet)
- `502 BAD_GATEWAY` — processor unreachable; client may retry

See also `10-licensing-billing/08-invoices-and-tax.md §87`.
