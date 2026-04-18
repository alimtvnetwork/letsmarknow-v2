# Billing Page (`/org/:id/billing`)

Plans, seats, invoices, lifetime, portal. UI for `03-api-endpoints/16-licenses.md`.

Owner and Billing role can access; others see "Billing is managed by your Owner" placeholder.

---

## 1. Layout

Single scrollable page with anchored sections:

1. Current plan card
2. Seats card
3. Payment method
4. Invoices history
5. Lifetime licenses
6. Cancel / change plan

Sticky right column on wide screens shows "Plan comparison" mini-table (Free / Pro / Team) for quick contrast.

## 2. Current plan card

```
┌──────────────────────────────────────────────┐
│  Pro · Monthly                                │
│  ─────────────────────────────────────────    │
│  USD $9.00 / month · 1 seat                   │
│  Renews on May 18, 2026                       │
│  ─────────────────────────────────────────    │
│  [ Change plan ]   [ Cancel ]                 │
└──────────────────────────────────────────────┘
```

If `cancel_at_period_end=true`: amber banner "Pro ends on May 18, 2026 → [Resume]".

If `status="past_due"`: red banner with "Update payment method".

If `status="trialing"`: "Free trial ends in 4 days · [Add payment]".

## 3. Seats card (Team plan only)

```
┌──────────────────────────────────────────────┐
│  Seats:  3 used / 5 total                     │
│  ─────────────────────────────────────────    │
│  [ Add seats ]   [ Reduce seats ]             │
│  Each seat is USD $5/mo (billed monthly).     │
└──────────────────────────────────────────────┘
```

Adding seats: inline stepper + cost estimate ("Add 2 seats — $10/mo prorated $4.13 today"). Submits via `/billing/change`.

## 4. Plan picker (Change plan modal)

- 3 cards side-by-side: Free, Pro ($9/mo or $84/yr), Team ($5/seat/mo or $50/seat/yr).
- Toggle Monthly/Yearly.
- "Current" badge on current plan.
- Switch CTA → confirms → calls `/billing/change` → 200 means immediate effect with proration.
- Downgrade: shows what features they'll lose; type-to-confirm.

## 5. Payment method

- Show default card (brand · last4 · exp).
- "Update card" → opens Stripe portal.
- Multiple cards (Team): list with default radio.

## 6. Invoices

- Table from `GET /v1/organizations/:id/billing/invoices?limit=20`.
- Columns: Date, Amount, Status, Invoice number, Download PDF.
- Filter by year.
- "Open billing portal" button at bottom.

## 7. Lifetime licenses

- "Redeem code" input (`LMNL-XXXX-XXXX-XXXX` format-aware; auto-uppercases).
- Submit → `/billing/lifetime/redeem` → success card showing tier + stacked seats.
- "Stack another code" sub-CTA.
- For multi-licensed Orgs, a list shows: code (masked), tier, redeemed by, date, action menu (transfer, return).

Lifetime + paid subscription is allowed; the lifetime tier acts as a permanent floor.

## 8. Cancel flow

1. "Cancel subscription" button → modal.
2. Reason selector (Too expensive / Missing feature / Switching to other tool / Not using enough / Other).
3. Free-text feedback (optional but encouraged).
4. Confirmation: "You'll keep Pro until May 18, 2026. After that you'll be downgraded to Free."
5. Submit → `/billing/cancel` with `at_period_end=true`.
6. Show "Cancellation scheduled" with "Resume" undo link valid until end of billing period.

Special: if cancellation will exceed Free-tier limits (e.g. user has 200 items, Free cap is 100), show warning + offer to export.

## 9. Provider switching

We support both Stripe (primary) and Paddle (for regions where Stripe is suboptimal). UI doesn't expose the choice; server picks based on Account country at first checkout. Switching providers is a manual support flow.

## 10. Lifetime + provider unification

Lifetime codes are provider-agnostic (issued by us). Redemption works regardless of which provider currently bills the Org.

## 11. Webhooks-driven UI

When billing webhook fires (subscription updated, invoice paid, payment failed), WebSocket `entitlements_changed` triggers a refetch; UI updates without reload. A toast confirms each change ("Plan upgraded to Team", "Payment failed — please update card").

## 12. Telemetry

- `billing.plan_change_initiated` with `{ from, to, interval }`
- `billing.plan_change_completed`
- `billing.cancel_initiated` with `{ reason }`
- `billing.cancel_completed` / `billing.cancel_resumed`
- `billing.lifetime_redeemed` with `{ tier }`
- `billing.payment_method_updated`
- `billing.portal_opened`

## 13. Accessibility

- All currency formatted via `Intl.NumberFormat` per Account locale.
- All amounts also have `aria-label` with full read ("Nine US dollars per month").
- Keyboard navigable through plan cards; Enter selects.
