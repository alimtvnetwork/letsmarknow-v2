# Event Log

The append-only mutation history that powers undo/redo, audit, sync, and "Recent activity".

---

## 1. Concept

A `HistoryEvent` is the immutable record of one mutation. It is:
- **Append-only** — never updated, never hard-deleted (except per retention).
- **Causal** — each event references its parent (`prev_event_id` per scope).
- **Reversible** — carries enough payload to undo (`before` + `after` snapshots, or a recipe).
- **Attributable** — actor + client + timestamp + IP (truncated).

## 2. Entity

| Field | Type | Notes |
|---|---|---|
| `id` | UUIDv7 | sortable; primary key |
| `org_id` | UUIDv7 | scope |
| `actor_account_id` | UUIDv7? | null for system events |
| `actor_session_id` | UUIDv7? | which session caused it |
| `client` | text | `web@2.4.1`, `chrome-ext@1.0.3`, `api@token:abc`, `system` |
| `ip_truncated` | text | `/24` for IPv4, `/48` for IPv6 |
| `kind` | text | dot-namespaced verb (see § 4) |
| `target_type` | enum | `item \| collection \| group \| space \| share \| tag \| member \| org \| ...` |
| `target_id` | UUIDv7 | the thing changed |
| `parent_target_id` | UUIDv7? | e.g., Collection ID for an Item move |
| `prev_event_id` | UUIDv7? | last event for this `(target_type, target_id)` |
| `payload` | jsonb | event-specific (see § 5) |
| `before` | jsonb? | minimal snapshot of changed fields pre-mutation (for undo) |
| `after` | jsonb? | snapshot of changed fields post-mutation |
| `inverse_recipe` | jsonb? | computed inverse mutation for undo (faster than diffing) |
| `correlation_id` | UUIDv7 | groups related events (one user action → many events) |
| `tx_id` | UUIDv7 | DB transaction ID; events in same tx are atomic |
| `created_at` | timestamptz | server-assigned |

Indexed: `(org_id, created_at desc)`, `(target_type, target_id, created_at desc)`, `(actor_account_id, created_at desc)`, `(correlation_id)`.

## 3. Append guarantees

- Events written in the SAME DB transaction as the mutation. Either both or neither.
- Outbox pattern: events also queued for downstream (sync, telemetry, audit) via reliable queue.
- No event = no mutation actually happened (used to detect partial failures).

## 4. Event kinds (canonical taxonomy)

Dot-namespaced. Stable strings (renames require migration).

> **Event-kind catalog is forward-spec** (per sequencing audit S-6, 2026-04-19). The event-log table can hold every kind below from **P0 onward**, but emitters only ship in the phase that ships the underlying feature. P0 emitters: `item.*`, `collection.*`, `group.*`, `space.*`, `tag.*`, `org.created`, `system.*`, `import.committed`. P1 emitters: `item.starred/unstarred/pinned/unpinned/archived/unarchived`, `collection.starred/unstarred/archived/unarchived`, `member.invited/joined` (multi-Org switcher only), `system.plan_changed`, `bulk.*`. P2 emitters: full `share.*`, full `member.*` (Team), `comment.*` (when comments ship). P3+ emitters: AI/mindmap-related kinds. Reading clients MUST tolerate unknown kinds (forward-compat per `12-history-undo/03-conflict-resolution.md` §5).

### Item
- `item.created`
- `item.updated` (generic field change; payload says which)
- `item.title.set`, `item.url.set`, `item.description.set`, `item.note.set`
- `item.tag.added`, `item.tag.removed`
- `item.starred`, `item.unstarred`
- `item.pinned`, `item.unpinned`
- `item.moved` (between Collections / Groups)
- `item.duplicated`
- `item.opened` (via "Open all" or jump-to-tab; not analytics page-views)
- `item.archived`, `item.unarchived`
- `item.trashed` (soft delete)
- `item.restored`
- `item.deleted` (hard delete after grace)

### Collection
- `collection.created`, `collection.renamed`, `collection.recolored`, `collection.icon_changed`
- `collection.description_set`, `collection.starred`, `collection.unstarred`
- `collection.moved` (between Spaces)
- `collection.duplicated`
- `collection.archived`, `collection.unarchived`, `collection.trashed`, `collection.restored`, `collection.deleted`

### Group
- `group.created`, `group.renamed`, `group.recolored`, `group.moved`
- `group.duplicated`, `group.deleted`

### Space
- `space.created`, `space.renamed`, `space.icon_changed`, `space.deleted`

### Tag
- `tag.created`, `tag.renamed`, `tag.recolored`, `tag.merged`, `tag.deleted`

### Share
- `share.created`, `share.updated`, `share.password_set`, `share.password_removed`
- `share.expiry_set`, `share.expiry_cleared`, `share.revoked`, `share.viewed` (sampled)

### Member
- `member.invited`, `member.joined`, `member.role_changed`, `member.removed`, `member.left`

### Organization
- `org.created`, `org.renamed`, `org.transferred`, `org.deleted`, `org.restored`

### System / Bulk
- `import.committed`, `export.delivered`
- `bulk.moved`, `bulk.tagged`, `bulk.deleted`
- `system.entitlement_changed`, `system.plan_changed`

## 5. Payload conventions

Every kind has a documented schema (`schemas/history/<kind>.json`). Common fields:

```json
{
  "kind": "item.moved",
  "payload": {
    "from": { "collection_id": "01J...", "group_id": null, "position": 7 },
    "to":   { "collection_id": "01J...", "group_id": "01J...", "position": 0 }
  },
  "before": { "collection_id": "...", "group_id": null, "position": 7 },
  "after":  { "collection_id": "...", "group_id": "...", "position": 0 },
  "inverse_recipe": {
    "kind": "item.moved",
    "payload": { "to": { "collection_id": "01J...", "group_id": null, "position": 7 } }
  }
}
```

For bulk:
```json
{
  "kind": "bulk.tagged",
  "payload": { "item_ids": ["...", "..."], "tags_added": ["read-later"], "tags_removed": [] },
  "inverse_recipe": { "kind": "bulk.untagged", "payload": { "item_ids": [...], "tags": ["read-later"] }}
}
```

## 6. Correlation

One user action can produce N events:
- Drag 5 items into a Group → 5 `item.moved` events sharing one `correlation_id` and `tx_id`.
- Undo one click reverses ALL events in the correlation atomically.

## 7. Retention

| Tier | Retention |
|---|---|
| Free | 7 days |
| Pro | 90 days |
| Team | 1 year |
| Enterprise | 7 years |

Per-plan values resolved through entitlement key `features.history.retention_days` (SoT: `10-licensing-billing/01-plans-matrix.md §8`; resolution: `10-licensing-billing/02-entitlements-engine.md`). The cross-session "Time travel" UI is gated separately on `features.history.time_travel` (default Pro+).

Beyond retention: events deleted; their effect persists in current state.

Archived events kept in cold storage (Parquet) for compliance per audit log policy (`08-sharing-collab/09-audit-log.md`).

## 8. Reading

`GET /v1/history?org=...&target_type=...&target_id=...&since=...&limit=...` — bare list with optional `target_type`/`target_id` query filters. Canonical contract: `03-api-endpoints/14-history.md §10` (query-filter form).
- Cursor-paginated.
- Filterable by `actor_account_id`, `kind`, date range.
- Returns sanitized payload (sensitive fields stripped).

`GET /v1/history/:id` — single event detail. Canonical contract: `03-api-endpoints/14-history.md` (event-detail section).

`GET /v1/items/:id/history` — convenience alias scoped to an item. Canonical contract: `03-api-endpoints/14-history.md` (Per-item activity feed section).

## 9. UI surfaces

- **Activity feed** (`05-web-app/10-activity-feed.md`) — Org-wide.
- **Item History tab** — per-item.
- **Collection History tab** — per-collection.
- **Recent toast** — last action with Undo.
- **Audit log view** (Team+) — `08-sharing-collab/09-audit-log.md`.

## 10. Sync interplay

- Events published to a per-Org change stream.
- Clients subscribe via WebSocket (`/rt`) and apply events to their local cache.
- Each event carries a server `Lamport`-style sequence; clients reconcile based on it.

## 11. Tampering & integrity

- Events are immutable. Even ops cannot edit; corrections are NEW events (`item.title.set` again with a note).
- Hash chain for Team Enterprise audit log (per `08-sharing-collab/09-audit-log.md`).
- Backups taken hourly; restore-point granularity 1 h.

## 12. Performance

- Insert latency p95 < 5 ms (single insert + outbox enqueue).
- Read p95 < 30 ms for last-100 query on a hot Collection.
- Storage growth budget: < 5 KB per event average; ~ 50 KB per active user per day.

## 13. Telemetry (about telemetry)

We DO log meta-telemetry of the history system itself:
- `history.event_appended` `{ kind }` (sampled 0.1%)
- `history.read` `{ scope, count, latency_ms }`
- `history.retention_purge` `{ org_id, events_purged }`
- `history.outbox_lag_ms` `{ p95 }`

## 14. Edge cases

| Case | Behavior |
|---|---|
| Event payload would exceed 64 KB | Store payload in object storage; event row carries pointer |
| Same target mutated 1000x in 1 second | All events recorded; UI shows collapsed "edited 1000 times in last second" |
| Actor deleted (Account closure) | `actor_account_id` retained as ID; display name shown as "Deleted user" |
| Org deleted | Events retained per Account-level audit need; pruned per retention |
| System event without actor | `actor_account_id=null`, `client="system"` |

## 15. Tests

- Per-kind payload schema validation.
- `prev_event_id` chain integrity per target.
- Outbox dispatch reliability under crash.
- Retention purger correctness.
- Read-API filter correctness.
- Inverse-recipe correctness on round-trip apply (event → invert → apply → original state).
