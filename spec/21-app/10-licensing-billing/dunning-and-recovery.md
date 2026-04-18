# Dunning & Recovery

What happens when a renewal payment fails.

---

## 1. Goals

1. Recover the payment (try again, ask user to update card).
2. Communicate clearly without alarming.
3. Avoid abrupt feature removal — graceful degradation.

## 2. Processor-side retry

- Stripe Smart Retries: 4 attempts over 14 days (configurable).
- Paddle: similar built-in retry schedule.
- Each retry attempt fires `invoice.payment_failed` webhook.

## 3. Grace period

- Day 0 (first failure): banner appears, email sent. Service unaffected.
- Day 0–7: full feature access continues.
- Day 7–14: read-only mode for shared/collaborative writes (saves still allowed).
- Day 14: subscription canceled by processor; Org downgraded to Free; banner persists.
- Free downgrade enforces caps gradually (no destructive deletes).

## 4. Communications

| Day | Channel | Message |
|---|---|---|
| 0 | Email + inbox | "Payment failed. We'll try again in 3 days. Update card → " |
| 0 | App banner | "Payment issue · Update card" |
| 3 | Email + inbox | "Still couldn't process payment. Please update your card." |
| 7 | Email + inbox | "Limited mode in 7 days. Update card →" |
| 14 | Email + inbox | "Subscription canceled. Reactivate any time." |

All emails come from `billing@letsmarknow.com`; non-disable category (transactional).

## 5. UI

- App-wide banner (yellow → red gradient as urgency grows).
- One-click "Update card" → Customer Portal session.
- Shows next retry attempt date.

## 6. Reactivation

- Update card → portal returns success → webhook `payment_method.attached`.
- Server attempts immediate manual retry of latest open invoice.
- On success: banner clears, full access restored.
- Reactivation possible up to 90 days after cancellation; same `org_subscription` reused (history preserved).

## 7. Win-back campaigns

- 30 days post-cancel: email "Come back · 25% off 3 months".
- 90 days: email "We've added X new features".
- Per-recipient frequency cap: max 3 win-back emails per year.
- Unsubscribe link respected (CAN-SPAM).

## 8. Segments

- Segment cancellations by reason (collected at cancel flow):
  - Too expensive
  - Missing feature
  - Switched to competitor
  - Not using enough
  - Other
- Tailored win-back content per segment (Pro+ ops).

## 9. Telemetry

- `dunning.payment_failed` `{ attempt, processor }`
- `dunning.banner_shown` `{ day }`
- `dunning.email_sent` `{ day, channel }`
- `dunning.card_updated_during_grace`
- `dunning.recovered`
- `dunning.canceled_after_grace`
- `winback.email_sent` `{ days_since_cancel, segment }`
- `winback.recovered` `{ days_since_cancel }`

## 10. Edge cases

| Case | Behavior |
|---|---|
| Card succeeds on retry without user action | Auto-recover; success email sent; banner cleared |
| Multiple Owners — who gets dunning emails? | All Owners + all Billing role |
| Payment method removed by bank | Webhook detects; treat as failure; email user |
| User updates card but new card also fails | Continues dunning timeline (no reset) |
| Org has lifetime license + subscription dunning | Subscription dunning continues; lifetime entitlements unaffected |

## 11. Anti-abuse

- Don't dun deleted Orgs.
- Don't email after Account requests deletion.
- Suppress for marked-fraudulent Orgs (separate flow handled by ops).

## 12. Tests

- Banner stage transitions on day boundaries.
- Email schedule fires once per stage.
- Recovery clears state cleanly.
- Win-back frequency cap enforced.
- Read-only enforcement at day 7.
