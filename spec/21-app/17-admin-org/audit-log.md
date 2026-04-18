# Audit Log

Immutable, append-only record of admin-relevant actions in an Organization.

---

## 1. What's logged

| Category | Examples |
|---|---|
| Auth | sign-in, sign-out, MFA enabled/disabled, password reset, SSO link |
| Members | invite sent, invite accepted, role changed, suspended, removed |
| Org | settings changed, branding updated, IP allowlist edited, MFA enforced |
| Sharing | share created, share revoked, share password changed, public toggle |
| Content (admin-relevant) | bulk delete (≥ 50 items), Trash emptied, Collection deleted |
| Billing | plan changed, payment method updated, invoice paid/failed |
| Data | export requested, export downloaded, Org delete initiated/cancelled |
| Security | failed sign-in burst, IP allowlist block, CSRF rejection |

What's NOT logged: routine reads, individual item edits, search queries, presence pings.

## 2. Entry shape

```json
{
  "id": "01H...",
  "org_id": "...",
  "actor_id": "user_...",
  "actor_kind": "user|api_token|system|sso",
  "ip": "203.0.113.1",
  "ua": "Mozilla/5.0 ...",
  "action": "members.role_changed",
  "subject": { "type": "member", "id": "..." },
  "before": { "role": "editor" },
  "after": { "role": "admin" },
  "metadata": { "channel": "web", "session_id": "..." },
  "created_at": "2026-04-18T10:00:00Z"
}
```

- `id` = ULID (sortable).
- `action` = dot-namespaced verb in past tense.
- `before`/`after` = minimal diffs; secrets redacted server-side.
- `metadata` = free-form; small (< 1 KB).

## 3. Storage

- Table `audit_events` partitioned by month for performance.
- Append-only at app layer; no UPDATE / DELETE permission for any role.
- Hash chain (Enterprise): each row includes `prev_hash` for tamper evidence.

## 4. Retention by tier

| Tier | Retention | Search range |
|---|---|---|
| Free | 7 days | last 7 days |
| Pro | 90 days | last 90 days |
| Team | 1 year | last 1 year |
| Enterprise | 7 years (configurable) | full range |

After retention: rows archived to cold storage (S3 Glacier) for compliance; UI shows "Older logs available on request" for Enterprise.

## 5. Surface

- Route: `/o/{org_slug}/audit`.
- Visible to Admin / Owner.
- Layout: filter bar + virtualized table + entry detail drawer.

### Filter bar

- Date range (presets: Today / 7d / 30d / Custom).
- Actor (member picker + "API tokens" + "System").
- Category (multi-select).
- Action (autocomplete from registered actions).
- IP / CIDR.
- Search free text (matches subject, action, metadata).

### Table columns

| Column | Width |
|---|---|
| When (relative + ISO on hover) | 140 px |
| Actor | 180 px |
| Action | 240 px |
| Subject | 200 px |
| IP | 120 px |
| ⋯ | 32 px |

### Drawer

Click row → side drawer with full JSON, before/after diff, action menu (export single entry, link to subject, "Show related" filter).

## 6. Export

- "Export current view" button → CSV / NDJSON.
- Up to 100k rows per export; larger requests queued via `data-export-delete.md`.
- Includes filter parameters in filename: `audit_acme_2026-04-01_2026-04-18.csv`.
- Streamed; respects retention bounds.

## 7. Webhook subscriptions (Team+)

- Org Admins can configure outbound webhook URL for audit events.
- Filter by category / action.
- Delivery: at-least-once, signed with HMAC SHA-256, retries with exponential backoff.
- Spec'd in `08-sharing-collab/audit-log.md` for the cross-cutting events (share-related).

## 8. Real-time stream

- Server pushes new entries via WebSocket / SSE for live audit dashboards.
- Useful for security ops; auto-scroll toggle.
- Backpressure: drops events > 1k buffer with "N events skipped" indicator.

## 9. Security event escalation

Some entries trigger automatic alerts:
- `auth.failed_burst` (≥ 10 fails in 5 min from same IP).
- `auth.impossible_travel` (sign-in from two countries < 1 h apart).
- `org.danger_zone.delete_initiated`.
- `members.ownership_transferred`.
- `security.ip_allowlist_blocked` (≥ 5 in 5 min).

Alerts go to: Owner email + (if enabled) Slack webhook + audit log entry tagged `severity: high`.

## 10. Telemetry

- `audit.viewed` `{ filters_count }`
- `audit.entry_opened` `{ action }`
- `audit.exported` `{ row_count, format }`
- `audit.webhook_delivery_failed` `{ status }` (server-side)
- `audit.security_alert_fired` `{ kind }`

## 11. Privacy

- Actor IP truncated for non-Owner viewers (`203.0.113.x`).
- User agent string parsed to "Chrome 124 / macOS 14" before display.
- No request bodies stored beyond the diff.
- Member can request their own audit slice via `/account/activity` (limited to their actions).

## 12. Edge cases

| Case | Behavior |
|---|---|
| Action by deleted member | Actor name shown as "Removed user (was alim@…)" |
| Action via revoked API token | Token name + "(revoked)" annotation |
| Clock skew on actor device | `created_at` is server time only |
| Hash chain break (tampering) | Banner "Audit integrity warning" + auto-ticket |
| Exporting > 100k | Queued to background job; emailed when ready |
| Audit log query exceeds retention | Empty result + tier-upgrade hint |

## 13. Tests

- Append-only enforcement (no UPDATE/DELETE possible).
- Hash chain verifier on Enterprise.
- Export pagination correctness.
- Real-time stream backpressure.
- Security alert thresholds.
- Filter combination correctness.
- IP truncation for non-Owners.
