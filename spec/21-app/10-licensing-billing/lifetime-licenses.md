# Lifetime Licenses

One-time-purchase keys redeemed against an Account. Used for AppSumo, ProductHunt deals, founder offers.

---

## 1. Concept

- A **License** is a code that, when redeemed, grants permanent entitlements to the redeeming Account.
- License grants a tier (Lifetime Pro or Lifetime Team).
- Stored on the **Account**, not the Org (lives with the human).
- Lifetime Team also grants a fixed seat count (5 by default).

## 2. License entity

| Field | Type | Notes |
|---|---|---|
| `id` | ULID | |
| `code` | text | URL-safe; 4-4-4-4 format (`AB12-CD34-EF56-GH78`) |
| `code_hash` | bytea | sha256 of code (lookup key) |
| `tier` | enum | `lifetime_pro \| lifetime_team` |
| `seats` | int | Team only; default 5 |
| `source` | text | `appsumo`, `producthunt`, `founder`, `partner_<name>`, `internal` |
| `batch_id` | ULID? | for bulk-issued |
| `redeemed_by_account_id` | ULID? | null when unredeemed |
| `redeemed_at` | timestamptz? | |
| `revoked_at` | timestamptz? | refunds, fraud |
| `created_at` | timestamptz | |
| `expires_at` | timestamptz? | unredeemed expiry; license itself is lifetime once redeemed |

## 3. Issuance

- Bulk-create endpoint (admin-only) generates batch with metadata.
- CSV export for partner platforms (AppSumo, etc.).
- Each code random; 80 bits of entropy; collision-checked.
- Optional `expires_at` for time-limited unredeemed codes.

## 4. Redemption

`/me/licenses/redeem`:
1. Account holder enters code.
2. Server validates: exists, not expired, not redeemed, not revoked.
3. Marks `redeemed_by_account_id`, `redeemed_at`.
4. Triggers `entitlement.changed` for the Account's Personal Org.
5. For Lifetime Team: prompts Account to convert Personal Org or create Team Org with seats.

## 5. Stacking

- Multiple licenses can be redeemed on one Account.
- Effective tier = max(licenses).
- Team seats: max(seats) across redeemed Lifetime Team licenses (NOT additive in v1; explicit decision to keep simple).
- Stacking with subscriptions: max_tier wins; subscription pauseable.

## 6. Transfer & ownership

- Lifetime licenses are NON-TRANSFERABLE post-redemption.
- Pre-redemption code can be gifted (just share the string).
- Account deletion voids the license.
- Refunds (within 60 days for AppSumo / 30 days for direct) revoke the license:
  - Set `revoked_at`.
  - Trigger entitlement bust.
  - Notify Account: "Your lifetime license has been refunded; entitlements reverted."

## 7. Anti-abuse

- Rate-limit redemption attempts: 5 / hour / Account, 100 / hour / IP.
- Max 1 license per source per Account (prevents arbitrage on multi-purchase).
- Suspect patterns flagged for manual review.

## 8. Display

`/me/licenses` shows:
- All redeemed licenses with source, tier, redeemed_at.
- Effective entitlements summary.
- "Redeem another" CTA.

## 9. Subscription pause logic

When lifetime fully covers active subscription:
- Auto-pause subscription via Stripe `subscriptions.update({ pause_collection: { behavior: "void" }})`.
- Banner: "Your lifetime license covers your subscription. Subscription paused; you won't be billed."
- Owner can resume any time.

## 10. Refund handling

- AppSumo refund: webhook from AppSumo platform → revoke license.
- Direct refund: ops action via admin panel; same revoke flow.
- Revoked licenses retained in DB for audit (never hard-deleted).

## 11. Telemetry

- `license.created` `{ source, tier, batch_id }`
- `license.redeemed` `{ source, tier }`
- `license.redemption_failed` `{ reason }`
- `license.revoked` `{ source, reason }`
- `license.subscription_paused_due_to_lifetime`

## 12. Audit

All license events logged:
- Issuance (bulk creates)
- Redemption (Account, IP, UA)
- Revocation (actor, reason)

## 13. UX details

- Code input auto-formats with hyphens.
- Inline validation: invalid format vs server-side "already redeemed".
- Success state: confetti animation; entitlements summary appears immediately.
- Error states map cleanly: `INVALID_CODE`, `ALREADY_REDEEMED`, `EXPIRED`, `REVOKED`, `RATE_LIMITED`.

## 14. Edge cases

| Case | Behavior |
|---|---|
| Redeem on free Account during Pro trial | License applied; trial naturally absorbed |
| Redeem Lifetime Team but Account is sole Member of Personal Org | Creates new Team Org or upgrades Personal to Team-style (with limit) |
| Lifetime Team holder removed from their Team Org by another Owner | License returns to Personal Org |
| Code shared publicly (e.g., leaked on Reddit) | Race: first redeemer wins; ops can revoke based on fraud signals |
| Account deletion mid-grace | License voided permanently; not restorable on re-signup |

## 15. Tests

- Code generation entropy + uniqueness.
- Redemption idempotency.
- Stacking math (subscription + lifetime).
- Subscription auto-pause on coverage.
- Revocation cascade (entitlements re-resolved).
