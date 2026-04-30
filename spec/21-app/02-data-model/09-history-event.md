# Entity: History Event

## Purpose

The append-only log of every mutation across the system. Powers Undo/Redo, audit log, and conflict resolution. Every entity event listed in other entity files is a row here.

## Fields

| Name | Type | Null | Default | Validation | Description |
|---|---|---|---|---|---|
| `id` | uuid | no | — | UUIDv7 (sortable) | — |
| `organization_id` | uuid (Organization.id) | no | — | — | Scope. |
| `account_id` | uuid (Account.id) | no | — | — | Who performed it. |
| `session_id` | uuid | yes | null | — | Client session id (for grouping rapid actions like multi-drag). |
| `batch_id` | uuid | yes | null | — | Multiple events with same `batch_id` are undone together (e.g. Save Session creates many Items in one batch). |
| `at` | timestamp | no | — | — | When it happened. |
| `event_type` | string(80) | no | — | dotted enum, e.g. `item.created` | The action. Full enum lives in each entity's "Events emitted" section. |
| `target_type` | enum(`organization`\|`space`\|`collection`\|`group`\|`item`\|`tag`\|`share`\|`member`\|`license`\|`account`\|`next_item`\|`session`\|`mfa_factor`) | no | — | — | — |
| `target_id` | uuid | no | — | — | The affected entity. |
| `actor_role` | enum(`owner`\|`admin`\|`editor`\|`viewer`\|`billing`\|`guest`\|`system`) | no | — | — | Role at time of action. `system` = synthetic actor (cron, webhook, API token). `billing` = billing-only seat. `guest` = Share-link viewer. |
| `before` | json | yes | null | per-event schema | State snapshot of changed fields BEFORE. |
| `after` | json | yes | null | per-event schema | State snapshot of changed fields AFTER. |
| `metadata` | json | no | `{}` | — | Free-form (e.g. Save-Session window id, drag source, import filename). |
| `is_undoable` | bool | no | true | — | False for analytics-only events (`item.opened`, `share.viewed`, `group.opened_all`). |
| `undone_at` | timestamp | yes | null | — | Set when this event has been undone. |
| `undone_by_event_id` | uuid (HistoryEvent.id) | yes | null | — | The compensating event that undid it. |
| `redone_at` | timestamp | yes | null | — | Set when an undone event has been redone. |
| `client` | string(120) | yes | null | — | Client identifier (e.g. `chrome-ext/1.4.0`, `web/1.4.0`). |

## Undo / Redo semantics

- Per `(organization_id, account_id)`, an "Undo cursor" tracks the next undoable event going backward in time.
- Undo: server fetches the most recent non-undone, undoable event ≤ cursor; computes inverse from `before`/`after`; applies it as a new event with `event_type` matching the inverse (`item.created` → `item.soft_deleted`, etc.); marks original `undone_at`.
- Redo: re-applies the most recently undone event; clears `undone_at`, sets `redone_at`.
- Multi-event batches: when any event in a batch is undone, ALL events in the same batch are undone atomically.
- A new mutation by the user invalidates redo stack beyond current cursor (standard editor semantics).

## Retention

- Configurable per Org via `settings.history_window_days`, capped per tier:
  - Free: 7 days
  - Pro: 30 days
  - Team: 365 days
  - Lifetime: 90 days
- Events older than the window are pruned by a daily job (only `is_undoable=true` events are pruned; audit-significant events for Team plan are retained per `audit_log_retention_days` separately).

## Invariants

1. Append-only — never updated except `undone_at`, `undone_by_event_id`, `redone_at`.
2. `at` strictly monotonic per `(organization_id)` (server clock, with tie-break by `id`).
3. Undoing an event creates a new event; the original row is preserved.
4. Cannot undo a `member.role_changed` to Owner without re-confirming ownership transfer (security guard).
5. Cannot undo events older than the retention window.

## Indexes (recommended)

- `(organization_id, at DESC)` for audit feed
- `(organization_id, account_id, at DESC)` for personal undo
- `(target_type, target_id, at DESC)` for entity history view
- `(batch_id)` for batch undo
- `(undone_at)` partial where null, for "what can I redo"

## Events about events

- `history.undone` (meta-event, recorded but not undoable)
- `history.redone`
- `history.pruned` (system event; not user-visible)

## Foreign keys

> See [`00-overview.md §4a`](./00-overview.md#4a-master-foreign-key-on-delete-table) for the canonical on-delete actions across the data model. Carve-outs: append-only — `account_id` → Account `set null`; `target_id` is polymorphic and never enforced by FK (dangling tolerated); `undone_by_event_id` self-ref `set null`.

## RLS

> Follows the per-entity template at [`templates/entity-rls.md`](./templates/entity-rls.md). Append-only: this is the only table where UPDATE is whitelisted to specific columns and DELETE is reserved to a system-role pruning job.

- enable row level security
- SELECT:
  - Own events: `account_id = auth.account_id()` (powers personal Undo).
  - Audit feed: `has_role(auth.account_id(), 'admin')` for `organization_id` (full org history).
  - Entity history view: `viewer`+ on `organization_id` (read-only audit of a specific target).
- INSERT: any authenticated session may insert events for `organization_id` they belong to AND `account_id = auth.account_id()`. WITH CHECK `actor_role` matches the caller's actual role at insert time (computed via `has_role`, not trusted from client).
- UPDATE: only the columns `undone_at`, `undone_by_event_id`, `redone_at` (invariant 1). Caller must own the event (`account_id = auth.account_id()`) OR be `admin`+ on the Org. Cannot mutate undo state on `member.role_changed → owner` rows without the ownership-transfer re-confirmation RPC (invariant 4).
- DELETE: forbidden for non-service-role callers. Only the daily pruning job (service-role bypass) may delete rows past the retention window.
- Notes: `before` / `after` JSON snapshots may contain field values that the caller wouldn't otherwise have read access to (e.g. an Editor's UPDATE that changed a `password_hash` on a Share). Sensitive columns MUST be redacted in the application-layer event-emit code BEFORE insert — RLS cannot retroactively scrub JSON.
