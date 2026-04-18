# Entity: License

## Purpose

Represents the active entitlement of an Organization (or, for Lifetime, an Account). Issued and validated by the License Manager. The `Organization.subscription_id` points at the active row.

## Fields

| Name | Type | Null | Default | Validation | Description |
|---|---|---|---|---|---|
| Audit Block | — | — | — | — | — |
| `organization_id` | uuid (Organization.id) | yes | null | — | Set for Pro/Team subscriptions tied to an Org. |
| `account_id` | uuid (Account.id) | yes | null | — | Set for Lifetime licenses tied to a single Account. |
| `plan` | enum(`free`\|`pro`\|`team`\|`lifetime`) | no | `free` | — | The tier. `free` rows may or may not exist (absence implies free). |
| `key` | string(64) | yes | null | format `LMN-XXXX-XXXX-XXXX-XXXX` | Lifetime license key visible to the user. Null for subscription rows. |
| `status` | enum(`trialing`\|`active`\|`past_due`\|`canceled`\|`expired`\|`refunded`) | no | `active` | — | Lifecycle state. |
| `seats` | int | no | 1 | ≥ 1 | Number of paid seats (Team plan). |
| `seats_used` | int | no | 0 | ≤ seats | Currently active Members consuming seats. |
| `current_period_start` | timestamp | yes | null | — | Subscription period bounds. |
| `current_period_end` | timestamp | yes | null | — | — |
| `trial_end` | timestamp | yes | null | — | If `status=trialing`. |
| `cancel_at_period_end` | bool | no | false | — | User scheduled cancellation. |
| `canceled_at` | timestamp | yes | null | — | — |
| `provider` | enum(`stripe`\|`paddle`\|`manual`\|`appsumo`\|`promo`) | no | `stripe` | — | Payment processor / source. |
| `provider_customer_id` | string(120) | yes | null | — | External customer id. |
| `provider_subscription_id` | string(120) | yes | null | — | External sub id. |
| `provider_price_id` | string(120) | yes | null | — | The SKU. |
| `currency` | string(3) | yes | null | ISO 4217 | — |
| `unit_amount_cents` | int | yes | null | — | Price per seat per period. |
| `interval` | enum(`month`\|`year`\|`lifetime`) | yes | null | — | — |
| `coupon_code` | string(40) | yes | null | — | Applied coupon if any. |
| `discount_percent` | int | yes | null | 0..100 | — |
| `device_limit` | int | yes | null | ≥ 1 | For Lifetime: max activated devices. Default 5. |
| `activated_devices` | array<json> | no | `[]` | — | `[{device_id, name, last_seen_at}, …]` |
| `entitlements` | json | no | `{}` | — | Cached feature flags derived from plan (see § Entitlements JSON). |

### Entitlements JSON

The DB team should store these denormalized for fast permission checks. Source of truth: `10-licensing-billing/plans-matrix.md`. Example shape:

```json
{
  "max_organizations": 50,
  "max_spaces_per_org": 500,
  "max_collections_per_org": null,        // null = unlimited
  "max_items_per_org": null,
  "max_members_per_org": 500,
  "max_active_shares": null,
  "custom_share_slug": true,
  "password_protected_share": true,
  "expiring_share": true,
  "invite_only_share": true,
  "share_analytics": true,
  "sso": true,
  "audit_log": true,
  "history_window_days": 365,
  "remove_branding_on_share_page": true,
  "priority_support": true,
  "real_time_collab": true
}
```

## Invariants

1. Exactly one of `organization_id` or `account_id` set (unless `plan=free`, where row is optional and represents nothing).
2. `seats_used ≤ seats`. If `seats_used > seats` after a downgrade or import, Org is in over-seat state — UI warns, billing portal forces resolution within 14 days.
3. Lifetime license: `interval=lifetime`, `provider in (stripe, paddle, appsumo, promo, manual)`, `account_id` required, `organization_id` null.
4. `status=expired` triggers Org reverts to free entitlements but data is preserved.
5. Refund within grace period reverts Org to previous state.

## Indexes (recommended)

- `(organization_id)` partial where null
- `(account_id)` partial where null
- `(provider, provider_subscription_id)` unique
- `(key)` unique partial
- `(status, current_period_end)` for renewal jobs

## Lifecycle

- **Free:** no License row required. Entitlements computed from plan=`free` constants.
- **Subscribe (Pro/Team):** Stripe/Paddle webhook → create License with `status=trialing` or `active`.
- **Renew:** webhook updates `current_period_*`.
- **Cancel:** `cancel_at_period_end=true`; on period end, status → `canceled`, then `expired`.
- **Lifetime purchase:** create row with `plan=lifetime`, generate `key`, email to user.
- **Activate device (Lifetime):** push to `activated_devices`; reject if length ≥ `device_limit`.
- **Deactivate device:** remove from array.
- **Refund:** webhook sets `status=refunded`; entitlements revert immediately.

## Events emitted

- `license.created`
- `license.activated`
- `license.renewed`
- `license.upgraded` (free→pro, pro→team, etc.)
- `license.downgraded`
- `license.canceled`
- `license.expired`
- `license.refunded`
- `license.device_activated`
- `license.device_deactivated`
- `license.coupon_applied`
- `license.seat_added` / `license.seat_removed`
