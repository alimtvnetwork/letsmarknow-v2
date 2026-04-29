# Billing Emails

> **Audience.** Engineers wiring transactional billing emails (Stripe + Paddle integrations, dunning, license lifecycle).
>
> **Scope.** The catalog of every email Mark Now sends in response to a **billing event** — trigger, recipient, content, and the data envelope that renders it. Operational alerts (auth, share, comment) live in `08-sharing-collab/08-notifications.md`; this file is billing-only.
>
> **Cited from** `03-api-endpoints/17-billing-webhooks.md §6` (dunning trigger) and `10-licensing-billing/09-dunning-and-recovery.md`.

---

## 1. Email taxonomy

Three classes, distinguished by send policy and recipient targeting:

| Class | Send policy | Recipient | Examples |
|---|---|---|---|
| **Lifecycle** | Always — never opt-out | Account holder + billing-role members | Trial start, paid subscription start, cancellation confirmation, refund issued. |
| **Dunning** | Always until resolved or terminal | Account holder + billing-role members | Payment failed (T+0), payment retry failed (T+3, T+7), final notice (T+14), license downgraded. |
| **Receipt** | Always | Account holder + billing-role members | Invoice paid, lifetime license activated, plan upgraded, plan downgraded, seat added, seat removed. |

**No marketing or upsell emails are billing emails.** Those live in `08-sharing-collab/08-notifications.md` and respect the per-channel toggle.

Only the `billing` and `owner` roles receive billing emails (per locked role enum). `admin` receives them when the account has zero billing-role members (fallback). Other roles never receive billing email regardless of preferences.

---

## 2. Email catalog

| ID | Class | Trigger | Subject template | Body sections |
|---|---|---|---|---|
| `BILL_TRIAL_STARTED` | Lifecycle | `subscription.trial_started` | "Your Mark Now trial has started" | Trial length, feature unlocks, "manage billing" link, end-date countdown. |
| `BILL_TRIAL_ENDING` | Lifecycle | T-3 days from trial end | "Your trial ends in 3 days" | End date, current usage stats (Items / Collections), pricing CTA. |
| `BILL_SUBSCRIPTION_STARTED` | Lifecycle | `subscription.created` (post-trial or direct) | "Welcome to Mark Now {plan_name}" | Plan, billing cadence, next-charge date, receipt link. |
| `BILL_INVOICE_PAID` | Receipt | `invoice.payment_succeeded` | "Receipt for Mark Now — {invoice.number}" | Line items, total, tax, payment method last-4, PDF attachment + portal link. |
| `BILL_PAYMENT_FAILED` | Dunning | `invoice.payment_failed` (T+0) | "We couldn't process your payment" | Decline reason (humanized via §4 map), update-card CTA, retry schedule (3 / 7 / 14 days). |
| `BILL_PAYMENT_RETRY_FAILED` | Dunning | Smart-retry attempt failed (T+3, T+7) | "Payment retry failed — please update your card" | Attempt #, next retry date, update-card CTA, support link. |
| `BILL_FINAL_NOTICE` | Dunning | T+14 unresolved | "Final notice: your Mark Now plan will be downgraded" | Downgrade date (T+15), what changes (entitlement diff), update-card CTA. |
| `BILL_LICENSE_DOWNGRADED` | Lifecycle | License auto-downgrade fires | "Your Mark Now plan has been downgraded to Free" | Effective date, what changed (specific lost entitlements), reactivation link. |
| `BILL_PLAN_UPGRADED` | Receipt | `subscription.updated` (tier up) | "Your plan was upgraded to {plan_name}" | Old plan → new plan, prorated charge amount, effective immediately. |
| `BILL_PLAN_DOWNGRADED` | Receipt | `subscription.updated` (tier down) | "Your plan was changed to {plan_name}" | Old plan → new plan, effective date (end of period), credit applied. |
| `BILL_SEAT_ADDED` | Receipt | `seat.added` | "{n} seat(s) added to your Mark Now plan" | Seat count delta, prorated charge, who can invite. |
| `BILL_SEAT_REMOVED` | Receipt | `seat.removed` | "{n} seat(s) removed from your Mark Now plan" | Seat count delta, credit applied, effective date. |
| `BILL_LIFETIME_ACTIVATED` | Lifecycle | `lifetime_license.activated` | "Your Mark Now Lifetime license is active" | License key (also in account), what's included, support guarantee terms. |
| `BILL_REFUND_ISSUED` | Lifecycle | `charge.refunded` | "Refund issued for {invoice.number}" | Refund amount, original charge date, expected settle window (5–10 business days). |
| `BILL_CANCELLATION_CONFIRMED` | Lifecycle | `subscription.cancelled` | "Your Mark Now subscription has been cancelled" | Effective end date, what stays accessible until then, "changed your mind?" link. |
| `BILL_TAX_RECEIPT_AVAILABLE` | Receipt | Annual: Jan 15 each year | "Your {year} Mark Now receipts are ready" | Year total, link to invoice list, downloadable PDF bundle. |

**16 email IDs.** This list is locked; new triggers require adding a row here AND in `09-dunning-and-recovery.md` if dunning-related.

---

## 3. Data envelope

Every email is rendered from a single typed envelope:

```ts
type BillingEmailEnvelope = {
  email_id: BillingEmailId;          // one of §2 IDs
  account_id: string;                 // UUIDv7
  recipient_user_id: string;          // UUIDv7
  recipient_role: 'owner' | 'billing' | 'admin';
  locale: string;                     // BCP-47, falls back to 'en-US'
  data: {
    account_name: string;
    plan_name?: string;
    plan_id?: string;
    invoice?: InvoiceSummary;         // see 08-invoices-and-tax.md
    payment_method_last4?: string;
    decline_reason_humanized?: string; // §4
    next_retry_at?: string;            // ISO-8601
    effective_at?: string;             // ISO-8601
    entitlement_diff?: EntitlementDelta; // see 02-entitlements-engine.md
    seat_count_before?: number;
    seat_count_after?: number;
    prorated_amount_cents?: number;
    currency?: string;                 // ISO-4217
  };
  template_version: number;           // 1 today; bumps require migration plan
};
```

The envelope is built in the webhook handler (`03-api-endpoints/17-billing-webhooks.md`) and queued via the email-send job. The renderer is the only consumer — UI never shows raw envelopes.

---

## 4. Decline-reason humanization

Stripe / Paddle decline codes are mapped to a small human-readable set before rendering. Never expose raw `decline_code` to end users.

| Source codes | Humanized message |
|---|---|
| `card_declined` (generic), `do_not_honor` | "Your card was declined by your bank. Please contact your bank or try a different card." |
| `insufficient_funds` | "Your card had insufficient funds for this charge." |
| `expired_card` | "Your card has expired. Please update your payment method." |
| `incorrect_cvc`, `invalid_cvc` | "The security code on your card was incorrect." |
| `processing_error`, `try_again_later` | "We couldn't process your payment right now. We'll retry automatically." |
| `authentication_required` | "Your bank requires extra authentication. Please complete it via the link below." |
| `lost_card`, `stolen_card`, `pickup_card` | (Suppress specific reason) "Your card was declined. Please use a different payment method." |

Mapping table lives in `lib/billing/decline-reasons.ts` (planned). Updates require a `.release/` changeset entry.

---

## 5. Localization

- Subjects + body copy: keys live in `17-i18n-a11y/` (planned per SI-026); fall back to `en-US` until that catalog ships.
- Currency: rendered with `Intl.NumberFormat(locale, { style: 'currency', currency })`.
- Dates: ISO date with locale-formatted display (`Intl.DateTimeFormat`).
- Time zone: account-level `timezone` field; if missing, `UTC` with explicit "UTC" suffix on date displays.

---

## 6. Send transport & delivery guarantees

- Provider: Postmark (transactional stream `mn-billing`). Configured per `22-infrastructure/05-email-transport.md`.
- Idempotency: every send uses `(email_id, account_id, trigger_event_id)` as the idempotency key. Re-deliveries from webhook retries do **not** re-send.
- Delivery target: 99.5% delivered within 60 s of webhook receipt. Bounces and complaints feed the `notifications.bounce` event in `18-analytics-telemetry/03-events.md`.
- Hard-bounce: account flagged; subsequent billing emails switch to in-app banner only until a new email is verified.
- Suppression: regulatory suppressions only (CAN-SPAM, GDPR right to erasure). Marketing-style unsubscribe is **not** offered for billing class emails — this is documented in the email footer.

---

## 7. Footer

Every billing email includes a footer with:

- Sender legal entity (from `19-security-privacy/legal-entity.md`).
- Mailing address.
- "You're receiving this because you're the billing contact for {account_name}. Billing emails are required and cannot be unsubscribed. To change the billing contact, [link]."
- Support link → `10-licensing-billing/14-support-system.md`.

---

## 8. Auditing

Each send writes an `Audit` row (`08-sharing-collab/09-audit-log.md`) with:

```
{
  action: "billing_email.sent",
  email_id, account_id, recipient_user_id, template_version,
  message_id (Postmark), trigger_event_id
}
```

Bounces and complaints add follow-up rows: `billing_email.bounced` and `billing_email.complained`.

---

## 9. References

- `03-api-endpoints/17-billing-webhooks.md §6` — dunning trigger origin.
- `10-licensing-billing/02-entitlements-engine.md` — entitlement diffs.
- `10-licensing-billing/03-stripe-integration.md` / `04-paddle-integration.md` — webhook source events.
- `10-licensing-billing/08-invoices-and-tax.md` — invoice summary shape.
- `10-licensing-billing/09-dunning-and-recovery.md` — retry schedule.
- `10-licensing-billing/14-support-system.md` — support link target.
- `18-analytics-telemetry/03-events.md` — `notifications.bounce`, `notifications.complaint` events.
- `08-sharing-collab/09-audit-log.md` — audit row format.
