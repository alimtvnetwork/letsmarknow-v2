# Proration & Upgrades

Mid-cycle plan transitions. The math is processor-handled; we govern the policy.

---

## 1. Policy overview

| Transition | Timing | Proration |
|---|---|---|
| Free → Paid | Immediate | Full charge for remainder of period |
| Paid → Higher Paid (Pro→Team) | Immediate | Credit unused + charge new prorated |
| Paid → Lower Paid (Team→Pro) | Period end | None (current period continues) |
| Paid → Free | Period end | None |
| Monthly → Yearly | Immediate | Credit unused monthly; charge yearly |
| Yearly → Monthly | Period end | None |
| Add seat (Team) | Immediate | Prorated |
| Remove seat (Team) | Period end | Credit applied to next invoice |

## 2. Default proration mode

Stripe: `proration_behavior = "create_prorations"` for upgrades; `"none"` for downgrades.

Paddle: `proration_billing_mode = "prorated_immediately"` for upgrades; `"do_not_bill"` for downgrades.

## 3. Upgrade flow (immediate)

1. User selects new plan in `/settings/billing`.
2. Server preview API call to processor: `subscriptions.update_preview` or equivalent.
3. UI shows: "You'll be charged $X today (prorated for N days). Next renewal $Y on <date>."
4. User confirms → server calls subscription update.
5. Webhook `customer.subscription.updated` finalizes; entitlements bust.
6. Receipt email auto-sent.

## 4. Downgrade flow (scheduled)

1. User selects lower plan.
2. UI shows: "Your plan will change to <new> at the end of your current period (<date>). You'll keep <current> features until then."
3. Server marks `org_subscription.scheduled_change = { plan_code, effective_at }`.
4. At period end, processor automatically transitions; webhook finalizes; entitlements bust.
5. Pre-end behavior: app shows banner "Downgrade scheduled for <date>. Cancel?"
6. User can cancel scheduled change anytime before effective_at.

## 5. Annual switch

- Monthly → Yearly = upgrade (immediate, prorated).
- Yearly → Monthly = downgrade (period end).
- Annual prepayment captured upfront; cancellation refund policy in `cancellations-and-refunds.md`.

## 6. Seat changes (Team)

### Adding seats
1. Owner adds seats from `/settings/billing` or accepts upsell prompt when inviting > current seats.
2. Stripe/Paddle subscription quantity bumped; prorated charge applied.
3. New seats available immediately for invitations.

### Removing seats
1. Owner reduces seats (cannot go below current Member count without removing Members first).
2. Effective at period end; credit applied to next invoice.
3. Banner reminds: "Seat reduction scheduled for <date>."

## 7. Display rules

- Always show "today's charge" + "next renewal" + "renewal date".
- Use processor's preview API; never compute locally.
- Round to currency's smallest unit (USD: cents).
- Show pre-tax + tax line items separately.

## 8. Edge: downgrade reduces caps below usage

When scheduled downgrade would shrink caps:
- Pre-warning at scheduling time: "Downgrading to Pro will limit you to 100 active shares (you currently have 245). 145 oldest shares will deactivate."
- At effective time: deactivate oldest excess; notify Owner with restore CTA (re-upgrade).
- Items / collections never deleted on downgrade (only deactivated/hidden where applicable).

## 9. Currency change

- Switching currency mid-subscription not supported (processor limitation).
- Workaround: cancel + new checkout in new currency; UI guides through.

## 10. Coupon / promo at upgrade

- Promotion codes applied at Checkout (initial subscription) only by default.
- Mid-cycle upgrade can re-prompt for coupon (Pro+).
- Stacking rules: one coupon per subscription unless explicitly multi-coupon SKU.

## 11. Telemetry

- `proration.preview_requested` `{ from, to }`
- `proration.upgrade_completed` `{ from, to, prorated_amount_minor, currency }`
- `proration.downgrade_scheduled` `{ from, to, effective_at }`
- `proration.downgrade_canceled`
- `seat.added` `{ count, prorated_amount_minor }`
- `seat.removed_scheduled` `{ count, effective_at }`

## 12. Audit

- Every plan change logged in audit log + telemetry.
- Includes actor, from/to plan, amount, processor reference.

## 13. Edge cases

| Case | Behavior |
|---|---|
| Multiple scheduled changes | Latest wins; previous canceled |
| Trial → upgrade mid-trial | Trial ends; subscription begins with prorated charge |
| Subscription paused (lifetime stack) → upgrade | Resume + apply upgrade in single transaction |
| Tax rate change between preview and confirm | Show updated total at confirm; user must re-accept |
| Immediate upgrade fails (card declined) | Plan change rolled back; user prompted to update card |

## 14. Tests

- Proration preview matches processor's actual charge.
- Scheduled downgrade activates at correct timestamp.
- Cap reduction enforcement on downgrade effective time.
- Seat math correctness across edge cases.
- Coupon application on upgrade.
