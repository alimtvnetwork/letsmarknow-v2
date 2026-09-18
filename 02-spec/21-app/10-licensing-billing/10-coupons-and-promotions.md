# Coupons & Promotions

Promo codes, referral credits, and partner deals.

---

## 1. Coupon types

| Type | Description |
|---|---|
| `percent_off` | e.g., 20% off for 3 months |
| `amount_off` | e.g., $10 off first invoice |
| `free_trial_extension` | adds N days to trial |
| `account_credit` | issues balance applied to future invoices |

All coupons stored in processor (Stripe Coupon / Paddle Discount); we reference IDs.

## 2. Application surfaces

- Stripe/Paddle Checkout: built-in promo code field.
- Custom in-app: `/settings/billing/redeem` for amount-credit codes (we apply server-side).
- Auto-applied via referral link (`?ref=ALIM`).
- Post-cancel win-back emails embed promo code link.

## 3. Coupon constraints

Each coupon configured with:
- Eligible plans (which can it apply to).
- New customers only / existing only / both.
- Stack with other coupons? (default: no)
- Expiry date.
- Max redemptions (global + per-customer).
- Currency restrictions.

## 4. Referral program (Pro+)

- Each Account gets a referral code (`/me/referrals`): 6 alphanum chars.
- Referrer link: `https://letsmarknow.com/?ref=<code>`.
- New paid signup via link → both sides get $20 credit (configurable).
- Credit applied as `account_credit` on next invoice.
- Max referrals counted: 50 per year per Account (anti-abuse).

## 5. Partner deals

- AppSumo, ProductHunt, etc. typically use Lifetime Licenses (`05-lifetime-licenses.md`), not coupons.
- For subscription partner deals (e.g., bundle with X service): bespoke coupon + tracking link with UTM.

## 6. UX

- Promo input visible at Checkout (built into processor's UI).
- Account credit shown on `/settings/billing` as "Credit balance: $X.XX (applied to next invoice)".
- Inline validation: invalid / expired / not-eligible feedback.
- Success: confetti animation; new total reflected.

## 7. Anti-abuse

- Per-customer max redemptions enforced by processor.
- Disposable email blocklist applied to referral signups.
- Suspicious patterns flagged: same IP redeeming many referrals; fraud team reviews.
- Self-referrals blocked (same Account / same payment method).

## 8. Telemetry

- `coupon.redeemed` `{ coupon_id, plan, discount_cents, currency }`
- `coupon.invalid` `{ coupon_id, reason }`
- `referral.link_visited` `{ ref_code }`
- `referral.signup_attributed` `{ ref_code }`
- `referral.credit_issued` `{ amount_cents, currency }`
- `winback.coupon_redeemed` `{ days_since_cancel }`

## 9. Audit

Each coupon redemption logs:
- Actor (Account ID).
- Coupon ID.
- Plan applied to.
- Resulting discount amount.
- IP + UA for fraud review.

## 10. Display rules

- Always show total before and after discount on Checkout.
- For percent-off, show duration explicitly: "20% off for 3 months, then {plan.price}/mo" — render `{plan.price}` from `01-plans-matrix.md` §1, never inline.
- Credits never expire (vs limited-time discounts).

## 11. Edge cases

| Case | Behavior |
|---|---|
| Coupon expires mid-Checkout | Re-validated at confirm; error if expired |
| Multiple coupons attempted | Reject second (no stacking) unless explicitly stackable |
| Referral signup downgrades to Free before paying | Credit not issued (paid-signup criterion) |
| Coupon for Yearly applied to Monthly switch | Coupon voided if plan-restricted |
| User self-refers via VPN/different email | Detected by payment method or fingerprint; both flagged |

## 12. Tests

- Processor coupon application correctness.
- Referral attribution chain (link click → signup → first paid invoice).
- Anti-self-referral guards.
- Account credit application math.
- Win-back code redemption flow.
