# Seats & Quotas

Team seat enforcement and other quantitative caps.

---

## 1. Seat model (Team)

- Subscription has `quantity = paid_seats`.
- Each `Member` (with `removed_at IS NULL`) consumes one seat.
- Seats are not assigned to specific Members; they're a pool.
- Owners + Admins + Editors + Viewers all consume seats equally.
- Billing role: configurable per Org whether it consumes a seat (default: yes).

## 2. Adding a Member

Pre-flight check:
1. `current_members < paid_seats` → invite proceeds.
2. `current_members >= paid_seats` → modal:
   - "Add a seat ($X/mo prorated) and invite?"
   - "Increase your seat plan first" link → seat picker.
   - "Cancel"
3. On accept → seats incremented, then invite sent.

## 3. Removing a Member

- Doesn't auto-decrement seats (Owner may want to re-fill).
- Banner appears: "You have N unused seats. Remove to save $X/period?" → Owner action.

## 4. Seat reduction

- Cannot reduce below `current_members`.
- UI offers "Remove a Member first" link.
- Reduction effective at period end; credit on next invoice.

## 5. Free / Pro Personal Org

- Free: 1 seat (the owner only); cannot invite.
- Pro: 1 base + 3 collaborator slots (Personal Org only); not billed per seat.
- Pro Team-style Org: not allowed; must convert to Team plan.

## 6. Other quotas

| Quota | Free | Pro | Team |
|---|---|---|---|
| Active items per Account | 200 | 10,000 | 100,000 |
| Collections per Org | 20 | unlimited | unlimited |
| Active shares per Org | 3 | 100 | unlimited |
| Outbound emails per 24h | 10 | 100 | 1,000 |
| Webhook events per 24h | n/a | n/a | 100,000 |
| API requests per minute | n/a | 60 | 600 |
| Imports per 24h | 1 | 5 | 50 |

## 7. Quota enforcement

- Hard caps surface 402 with `QUOTA_EXCEEDED { key, current, limit }`.
- Soft caps surface 200 + `quota_warning` field.
- Threshold notifications at 80% utilization (Owner inbox).
- 100% notifications immediate.

## 8. Quota counters

- Stored in Redis with TTL matching window (e.g., 24h, 1min).
- Atomic INCR with check; race-safe.
- Backfilled from DB on Redis cold start (best-effort).

## 9. Aggregation

- Per-Org quotas: keyed by `org_id`.
- Per-Account quotas: keyed by `account_id` (e.g., active items).
- Per-Account-per-Org: rare; explicit when used.

## 10. Display

- `/settings/billing` shows utilization bars per quota with current usage and limit.
- Color: green (<80%), amber (80-99%), red (100%).
- Hover tooltip explains the quota.

## 11. Telemetry

- `quota.warned_80` `{ key }`
- `quota.exceeded` `{ key, current, limit }`
- `seat.added` `{ count }` (also in proration)
- `seat.unused_warning_shown`
- `seat.reduced_scheduled`

## 12. Edge cases

| Case | Behavior |
|---|---|
| Plan downgrade with member count > new seat cap | Block downgrade; require Member removal first |
| Bulk import would exceed item cap | Partial import to cap; reject remainder with summary |
| Quota cleared (e.g., daily) but Redis flushed | Counter recomputed lazily on next request |
| Owner removes themselves from Team Org | Last Owner protection blocks; transfer required |
| Seat reduction would go below current members | Blocked with explanation |

## 13. Tests

- Atomic counter under concurrency (1000 simultaneous adds).
- Redis flush recovery.
- Plan downgrade seat enforcement.
- Soft vs hard cap UX.
- Notification thresholds fire once per period.
