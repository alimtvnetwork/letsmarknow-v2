# Cancellations & Refunds

Subscription end-of-life and money-back policy.

---

## 1. Cancellation flow

`/settings/billing/cancel`:
1. Identify churn risk: render contextual offer (pause, downgrade, discount) before reaching final step.
2. Reason picker: "Why are you canceling?" (optional but encouraged).
   - Too expensive
   - Missing feature (free text)
   - Switched to competitor (which?)
   - Not using enough
   - Project ended
   - Other (free text)
3. Final confirmation: "Cancel at period end (<date>) — you keep access until then."
4. Server marks `cancel_at_period_end=true` on subscription.
5. Webhook confirms; UI shows "Cancellation scheduled" banner with "Resubscribe" CTA.

## 2. Pre-cancel offers (retention)

In order of presentation:
1. **Pause subscription** (1 / 2 / 3 months) — keeps data warm; billing paused.
2. **Downgrade** (Team → Pro, etc.) — proposed if usage suggests over-paying.
3. **Discount** (25% off 3 months) — only for users with > 6 months tenure.
4. **Switch annual → monthly** — for cash-flow concerns.

User can skip all and proceed to cancel.

## 3. Pause subscription

- Stripe: `pause_collection={ behavior: "void", resumes_at: <ts> }`.
- Paddle: equivalent pause API.
- During pause: Org downgraded to Free entitlements.
- Auto-resume at end of pause; full access + billing restored.
- User can manually resume any time.

## 4. Cancel-at-period-end vs immediate cancel

- Default: cancel at period end (no refund, full access until end).
- Immediate cancel option (Pro+): processor refunds prorated unused portion to original payment method.
- Lifetime: not applicable.

## 5. Post-cancellation state

- Subscription `status=canceled` after period_end.
- Org downgrades to Free; entitlements bust; banner persists.
- All collaborative shares with cap excess deactivated oldest-first.
- Data retained indefinitely (Free tier limits apply but no destructive deletes).

## 6. Refund policy

| Scenario | Policy |
|---|---|
| Within 7 days of first paid invoice | Full refund, no questions |
| 8–30 days, monthly | Full refund on request |
| 8–30 days, annual | Prorated refund (months not used) |
| > 30 days, monthly | No automatic refund; ops discretion |
| > 30 days, annual | Prorated for unused months on request |
| Lifetime | 60-day money-back if via AppSumo; 30-day direct |
| Mid-cycle downgrade | No refund (credited to next invoice) |
| Service outage > 4h in a billing period | Pro-rata credit on next invoice |

## 7. Refund execution

- Owner / Billing role can request via `/settings/billing/refund`.
- Auto-approve if within self-serve window.
- Else: support ticket with reason; ops decides; SLA 2 business days.
- Approved refunds processed via processor API; webhook updates invoice + org_subscription.
- Refund email sent automatically.

## 8. Account credits as alternative

- Sometimes credit > refund (faster, no card friction).
- Offered in retention modal: "Take $20 credit instead?"
- Credit applied to next invoice; never expires.

## 9. Data retention post-cancellation

- Org data retained on Free tier indefinitely (subject to Free caps).
- If Org also deleted: 30-day soft-delete then hard delete (`09-auth-accounts/account-deletion.md` analogue at Org level).
- Exports remain available throughout.

## 10. Resubscription

- One-click "Resubscribe" reactivates at same plan (or chooses new).
- Restores entitlements immediately.
- Reuses existing Stripe Customer / Paddle Customer.
- Audit log entry.

## 11. Telemetry

- `cancel.flow_started`
- `cancel.offer_shown` `{ offer }`
- `cancel.offer_accepted` `{ offer }`
- `cancel.completed` `{ reason, tenure_days }`
- `cancel.scheduled_canceled` (user reverted scheduled cancel)
- `pause.started` `{ months }`
- `pause.resumed` `{ via: "auto" | "manual" }`
- `refund.requested` `{ scope, amount_minor }`
- `refund.completed` `{ amount_minor, currency }`
- `refund.denied` `{ reason }`
- `resubscribe.completed` `{ days_since_cancel }`

## 12. UX details

- Cancellation flow is honest (no dark patterns); always visible exit.
- Refund button accessible; not buried.
- Confirmation emails for every monetary event.

## 13. Audit

- All cancel / pause / refund actions logged.
- Reason captured (free text + category).
- Used for revenue reporting (`revenue-reporting.md`).

## 14. Edge cases

| Case | Behavior |
|---|---|
| Cancel during dunning grace | Skip dunning; cancellation effective at original period end |
| Cancel scheduled, then upgrade | Unschedule cancellation automatically |
| Pause requested while past due | Block; require payment fix first |
| Refund on already-deleted Org | Process to original payment method; no app effect |
| Lifetime + subscription, cancel subscription | Lifetime entitlements remain; subscription stops billing |

## 15. Tests

- Cancel flow happy path + reverted-cancel.
- Refund self-serve windows enforced.
- Pause + auto-resume timing.
- Resubscribe restores prior plan.
- Telemetry firing matches state changes.
