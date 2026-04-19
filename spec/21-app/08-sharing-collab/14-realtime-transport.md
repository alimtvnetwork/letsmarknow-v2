# Realtime Transport

> **Closes gap M3.** Defines the wire protocol, channels, presence model, and conflict-resolution transport for collaborative features.
> **Locked decision:** **Supabase Realtime (Phoenix Channels over WebSocket)** is the chosen transport for v1. No Socket.io. No Y.js server. No raw WS.

---

## 1. Transport choice rationale

| Option | Verdict | Why |
|---|---|---|
| **Supabase Realtime** | ✅ Chosen | Native to Lovable Cloud, no extra infra, presence + broadcast + DB changes in one channel, included in Cloud pricing |
| Socket.io | ❌ | Duplicates infra, separate billing, no DB CDC |
| Y.js + y-websocket | ❌ Phase 0 | CRDT overkill for current collab scope (presence + comments). Reconsider in Phase 3 if shared mind-map editing ships. |
| Raw WS | ❌ | Reinvents auth, reconnect, presence |
| Pusher / Ably | ❌ | External vendor, extra cost |

## 2. Channel topology

> **Reconciled (2026-04-19, F-M06 + F-M07 + F-M15):** Channel inventory unified with `06-realtime-presence.md` §2. `account:` is used (not `user:`) per locked glossary (`00-overview/02-glossary.md`). `collection:` and `item:` channels added back so collection/item edits do not flood the parent `space:` channel.

| Channel name | Scope | Subscribers | Events |
|---|---|---|---|
| `org:{org_id}` | One per Org | All org members online | `member.join`, `member.leave`, `org.updated` |
| `space:{space_id}` | One per opened Space | Members currently viewing | `presence.sync`, `item.created`, `item.deleted` (space-level only) |
| `collection:{collection_id}` | One per opened Collection | Members currently viewing | `presence.sync`, `item.created`, `item.updated`, `item.deleted`, `collection.updated` |
| `item:{item_id}` | One per opened Item editor | Members editing notes/description | `presence.editing`, `item.updated`, `comment.created` |
| `share:{share_token}` | One per opened public share | Anonymous + named viewers | `presence.sync`, `comment.created`, `reaction.created` |
| `account:{account_id}` | Personal | Only the account across devices | `notification.new`, `quota.warning`, `session.revoked`, `auth.signed_out` |

**Channel join policy:** Server-side `realtime.authorization` policies mirror the same RLS policies generated from `permissions-matrix.json`. An account joining `space:xyz` MUST satisfy `space.read` on entity `xyz`. Anonymous joins are only allowed on `share:{token}` after the share's access requirements (password / invite) are satisfied.

## 3. Presence model

- **Heartbeat:** 30 s ping; 90 s timeout → considered offline.
- **Presence payload (per account):**
  ```json
  { "account_id": "uuidv7", "display_name": "Ana", "avatar_url": "...", "cursor": { "view": "list", "item_id": "uuidv7|null" }, "last_seen": "2026-04-19T08:00:00Z" }
  ```
- **Cursor field is optional** (only sent in dashboard view, not in account settings).

## 4. Broadcast vs. Postgres CDC

| Use case | Mechanism |
|---|---|
| Account-typed comment | Broadcast (sub-50 ms) THEN DB insert (idempotent on `client_msg_id`) |
| Item created via API | Postgres `INSERT` → CDC fanout to subscribers |
| Reaction toggle | Broadcast only; debounced DB upsert every 1 s |
| Member role change | DB CDC only (auth refresh required) |

## 5. Conflict resolution

- **Strategy:** Last-Write-Wins (LWW) on per-field basis, server clock authoritative.
- **Tie-break:** Lower `account_id` UUIDv7 wins (deterministic).
- **Compound moves** (drag item between collections): wrapped in DB transaction; if 409 `STALE_RESOURCE` (per `18-error-codes.md`), client retries with new parent revision once, then surfaces toast.
- **Phase-3 upgrade path:** When mind-map editing ships, switch to Y.js per-document with this channel layer carrying CRDT updates. The channel name and auth policy remain unchanged.

## 6. Reconnect & offline

- Exponential backoff: 1 s → 2 s → 4 s → 8 s → 16 s, max 30 s.
- On reconnect: re-fetch DB snapshot for the active channel, replay missed CDC events from `last_event_id` cursor.
- Offline writes (extension popup): queued in IndexedDB, flushed on next channel join, `client_msg_id` ensures idempotency.

## 7. Telemetry

| Event | Props |
|---|---|
| `realtime.channel_joined` | `channel`, `latency_ms` |
| `realtime.disconnected` | `code`, `reason` |
| `realtime.reconnected` | `attempts`, `downtime_ms` |
| `realtime.presence_sync` | `channel`, `peer_count` |

## 8. Locked rules

1. Only Supabase Realtime in v1. PRs adding Socket.io, raw WS, or Pusher are auto-rejected.
2. All channel auth goes through the same `permissions-matrix.json`-generated policies as REST. No "open channels."
3. Broadcast payload size ≤ 4 KB per message. Larger payloads → DB write + CDC.
4. Heartbeat 30 s, timeout 90 s — do not change without updating presence UI thresholds.
5. `client_msg_id` (UUIDv7) is mandatory on every broadcast that mirrors a DB write, for idempotency.
6. Channel names use `account:`, never `user:` — glossary term (`00-overview/02-glossary.md`) is **Account**.
