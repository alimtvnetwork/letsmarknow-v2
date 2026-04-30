# Audit Log (Team)

Append-only history of who did what for compliance and forensics.

---

## 1. Scope

- One log per Org.
- Captures security-relevant + governance events.
- Retention: 1 year on Team; 7 years on Team Enterprise add-on.
- Exportable as CSV / JSON.

## 2. Events captured

### Auth
- `auth.sign_in_success` `{ ip, user_agent, mfa_used }`
- `auth.sign_in_failure` `{ ip, reason }`
- `auth.password_changed`
- `auth.mfa_enabled` / `_disabled`
- `auth.session_revoked`

### Members
- `member.invited` `{ email, role }`
- `member.invite_accepted`
- `member.role_changed` `{ from, to }`
- `member.removed`
- `member.left`

### Org
- `org.created`
- `org.renamed`
- `org.deleted`
- `org.transferred` `{ to_account_id }`
- `org.brand_changed`
- `org.sso_configured`

### Content (high-level only — not every save)
- `space.created` / `_renamed` / `_deleted`
- `collection.deleted_purged` (hard delete only)
- `item.bulk_purged` `{ count }`
- `tag.merged` `{ from, to }`

### Sharing
- `share.created` `{ scope_type, mode }`
- `share.modified`
- `share.revoked`
- `share.purged` `{ scope_type, mode, retained_analytics_until: null }` — emitted by `POST /v1/shares/:id/purge` (see `12-revocation-and-expiry.md §12`); written before the row hard-delete commits so the audit row survives the purge.
- `share.password_rotated`
- `share.invite_sent` `{ count }`
- `share.locked_brute_force`

### Billing
- `billing.plan_changed` `{ from, to }`
- `billing.payment_method_added` / `_removed`
- `billing.invoice_paid` / `_failed`

### Integrations
- `webhook.created` / `_modified` / `_deleted`
- `api_token.created` / `_revoked`
- `import.run` `{ source, count }`
- `export.run` `{ scope, count }`

### System
- `kill_switch.engaged` `{ flag, reason }`
- `feature_flag.changed` `{ flag, from, to, actor }`

## 3. Schema

| Field | Type | Notes |
|---|---|---|
| `id` | UUIDv7 | sortable |
| `org_id` | UUIDv7 | |
| `actor_account_id` | UUIDv7? | null for system events |
| `actor_kind` | `member \| api_token \| system \| webhook` | |
| `event_type` | text | dotted name |
| `target_type` | text? | `item`, `share`, etc. |
| `target_id` | UUIDv7? | |
| `payload` | jsonb | event-specific (PII-minimized) |
| `ip` | inet? | actor IP |
| `user_agent` | text? | actor UA |
| `created_at` | timestamptz | |

Append-only — no UPDATE, no DELETE policy at DB level. Retention policy purges via scheduled job after window.

## 4. Storage

- Postgres partitioned by month for fast retention pruning.
- Hot partition in primary DB; cold partitions moved to columnar store after 90 d.
- Indexed on `(org_id, created_at desc)`, `(org_id, actor_account_id)`, `(org_id, event_type)`.

## 5. UI

- `/settings/audit` accessible to Owner / Admin.
- Filters: actor, event type, target, time range.
- Search by free text on `payload`.
- CSV export (synchronous up to 50k rows; async job above).
- Per-row drawer with full payload (pretty JSON).

## 6. Tamper resistance

- Hash chain (Pro+ optional Enterprise add-on): each row stores `prev_hash` of previous row's `(id, event_type, payload, actor_account_id)`; daily Merkle root published in Org settings.
- DB user for the API has INSERT only on `audit_log`.
- All other access (e.g. retention purge) via separate role with rate-limited DELETE.

## 7. Privacy

- Audit log NEVER logs:
  - Passwords / tokens (raw or hashed).
  - Note/description content (only metadata: `length`, `field_changed`).
  - Item URLs (only `item_id` + `host`).
- IP truncated to /24 for IPv4 and /48 for IPv6 unless Owner opts into full IPs (with banner notice).

## 8. Performance

- Insert path async (queued); never on user request hot path.
- p99 insert lag < 5 s.
- UI query p75 < 300 ms with proper filters.

## 9. Entitlements

| Feature | Pro | Team | Enterprise |
|---|:---:|:---:|:---:|
| Audit log | ❌ | ✅ (1y) | ✅ (7y) |
| CSV/JSON export | ❌ | ✅ | ✅ |
| Hash-chain integrity | ❌ | ❌ | ✅ |
| SIEM webhook | ❌ | ❌ | ✅ |

## 10. Telemetry

- `audit.viewed` `{ filter_count }`
- `audit.exported` `{ row_count, format }`
- `audit.search_used`

## 11. Edge cases

| Case | Behavior |
|---|---|
| Audit insert fails | Retry queue; if persistent, page on-call |
| Org deleted | Audit retained per legal hold setting; otherwise purged after 30 d grace |
| Account deleted | Actor name displayed as "Deleted user (id: …)"; events retained |
| Clock skew between services | Server-canonical `created_at` from primary DB |

## 12. Tests

- Insert-only enforcement (attempt UPDATE → 0 rows affected, alert).
- Hash chain integrity test (Enterprise).
- Retention job correctness.
- Filter performance on 10M rows.
