# Wireframe — Billing

> **Route:** `/settings/billing`
> **Spec ref:** `05-web-app/08-billing-page.md`, `10-licensing-billing/01-plans-matrix.md`
> **⚠ Pricing in this wireframe is illustrative only.** Wireframes specify *layout*, not pricing. The single source of truth for prices, seat counts, and plan IDs is `10-licensing-billing/01-plans-matrix.md` §1. If a number here disagrees with the matrix, **the matrix wins** and this file is wrong.

---

## 1. Default — active subscription

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Settings nav: General | Members | Billing✓ | Security | Integrations]      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  {billing.title}                                                             │
│  ──────────────                                                              │
│                                                                              │
│  ┌─ Current plan ──────────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │   Team   $9 / seat / month        ┌──────────────────┐              │    │
│  │   Annual billing ($84/seat/yr)    │ [Change plan]    │              │    │
│  │                                   └──────────────────┘              │    │
│  │   Renews on Jan 15, 2027 ($672.00 USD · 8 seats × $84)              │    │
│  │                                                                     │    │
│  │   Features:                                                         │    │
│  │   ✓ Unlimited collections    ✓ Public + private shares              │    │
│  │   ✓ Advanced search          ✓ Priority support                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─ Seats ─────────────────────────────────────────────────────────────┐    │
│  │  {billing.seats.usage}      ████████░░  8 / 10                      │    │
│  │  [Add seats]                                                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─ Payment method ────────────────────────────────────────────────────┐    │
│  │  💳  Visa ending 4242  ·  Expires 09/27                             │    │
│  │  Billing email: billing@acme.com                                    │    │
│  │  [Update]                                                           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─ Invoices ──────────────────────────────────────────────────────────┐    │
│  │  Date         Amount      Status      Invoice                       │    │
│  │  ─────────────────────────────────────────────────────              │    │
│  │  Jan 15 2026  $432.00     Paid        [Download PDF]                │    │
│  │  Dec 15 2025  $432.00     Paid        [Download PDF]                │    │
│  │  Nov 15 2025  $360.00     Paid        [Download PDF]                │    │
│  │  ...                                                                │    │
│  │                                  [See all invoices →]               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─ Danger zone ───────────────────────────────────────────────────────┐    │
│  │  Cancel subscription                                                │    │
│  │  Your workspace becomes read-only after the current period.         │    │
│  │                                                  [Cancel plan]      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Component map
- **Settings nav** — secondary tabs at top
- **Plan card** — current tier, price, renewal date, change CTA
- **Seats card** — progress bar + add seats button
- **Payment method card** — masked card, billing email, update CTA
- **Invoices table** — paginated, downloadable
- **Danger zone** — destructive action with explanatory text

---

## 2. Past-due banner state

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ⚠  {billing.past_due.banner}                                                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

Sticky at top of every page (not just billing) until resolved. Background `--destructive`, text `--destructive-foreground`.

---

## 3. Plan change modal

```
              ┌──────────────────────────────────────────────┐
              │ Change plan                              [×] │
              ├──────────────────────────────────────────────┤
              │                                              │
              │  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
              │  │  Free   │  │   Pro   │  │  Team   │       │
              │  │   $0    │  │  $5/mo  │  │ $9/seat │       │
              │  │         │  │ ✓ Curr. │  │  /mo    │       │
              │  │ [Select]│  │ [×]     │  │ [Select]│       │
              │  └─────────┘  └─────────┘  └─────────┘       │
              │                                              │
              │  Billing cycle:  ( ) Monthly  (●) Annual -20%│
              │                                              │
              │  ─────────────────────────────────────       │
              │  New total: $84/seat/yr × 8 = $672.00/yr     │
              │  Prorated charge today: shown by API         │
              │                                              │
              │              [Cancel]  [Confirm change]      │
              └──────────────────────────────────────────────┘
```

> Prices above mirror `10-licensing-billing/01-plans-matrix.md` §1 (Free $0, Pro $5/mo or $48/yr, Team $9/seat/mo or $84/seat/yr). The implementation MUST fetch live values; never hardcode.

---

## 4. Cancel confirmation modal

```
              ┌──────────────────────────────────────────────┐
              │ {billing.cancel.title}                   [×] │
              ├──────────────────────────────────────────────┤
              │                                              │
              │  {billing.cancel.confirm.body}               │
              │                                              │
              │  Tell us why? (optional)                     │
              │  ┌────────────────────────────────────────┐  │
              │  │ ▾ Choose a reason                      │  │
              │  └────────────────────────────────────────┘  │
              │                                              │
              │           [Keep plan]   [Cancel anyway]      │
              └──────────────────────────────────────────────┘
```

---

## 5. States

- **No subscription (free tier):** Plan card shows "Free" + prominent [Upgrade] CTA. No invoices section. No danger zone.
- **Trialing:** Banner "Trial ends in N days" + [Add payment method] CTA.
- **Loading:** Skeleton sections.
- **Error fetching:** Inline error per section, retry button. Don't block whole page.

---

## 6. Mobile (< 768px)

- Settings nav collapses to dropdown
- Cards stack full-width
- Invoice table → card list per invoice
- Modals become bottom sheets

---

## 7. Permissions

- Visible to roles: `owner`, `billing`
- All others see "Contact your owner to manage billing" placeholder
- Source of truth: `08-sharing-collab/05-permissions-matrix.md`

---

## 8. Telemetry

- `billing_viewed`
- `billing_plan_change_clicked`
- `billing_plan_changed` (`{from_plan, to_plan, cycle}`)
- `billing_seats_changed` (`{from, to}`)
- `billing_payment_updated`
- `billing_invoice_downloaded` (`{invoice_id}`)
- `billing_cancel_clicked`
- `billing_canceled` (`{reason}`)
