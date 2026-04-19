# Realtime Presence

Live indicators of who is viewing / editing what, in the same Org.

---

## 1. Transport

> **Reconciled (2026-04-19, F-M06):** Transport is **Supabase Realtime (Phoenix Channels over WebSocket)**, per `08-sharing-collab/14-realtime-transport.md`. The previously-specced custom `wss://rt.letsmarknow.com/v1/presence` subdomain and SSE fallback are **withdrawn**. See `14-realtime-transport.md` for the wire protocol, auth, reconnect policy, and heartbeat values. This file covers presence UX and channel semantics only.

## 2. Channels

| Channel | Scope |
|---|---|
| `org:{org_id}` | Org-wide events (member changes, broad notifications) |
| `space:{space_id}` | Members viewing a Space |
| `collection:{collection_id}` | Members on a Collection page |
| `item:{item_id}` | Members editing an Item (notes/description) |
| `account:{account_id}` | User-targeted (notifications, sign-out) |

Subscribe on view mount; unsubscribe on unmount.

## 3. Events

```ts
type PresenceEvent =
  | { type: "presence.join",  channel, account_id, display_name, avatar_url, color }
  | { type: "presence.leave", channel, account_id }
  | { type: "presence.list",  channel, members: PresenceMember[] }     // initial snapshot
  | { type: "presence.editing", channel, account_id, field?: string }   // soft lock indicator
  | { type: "entity.changed", channel, entity_id, etag, by_account_id } // hint to refetch
  | { type: "entity.deleted", channel, entity_id, by_account_id }
  | { type: "share.revoked",  share_id, by_account_id }
  | { type: "auth.signed_out", account_id, reason }
```

## 4. UI

- Avatar stack top-right of Collection / Item header.
- Up to 5 avatars + "+N" overflow.
- Each avatar has owner color (assigned on join, stable per Account).
- Tooltip: name + "viewing" or "editing".
- "Editing" badge: small pencil icon next to avatar.

## 5. Live cursors (Pro+, optional per-Account toggle)

- For Notes/Description editors only (not for the whole page — too noisy).
- Throttled: 30 events/sec max per cursor.
- Hidden when reduced-motion or off in `/me/profile`.

## 6. Conflict avoidance

- Soft-lock indicator only ("Alim is editing this note").
- No hard locks; all writes still allowed.
- On conflict (`If-Match` mismatch), 3-way merge UI opens.

## 7. Performance

- Server fan-out via Redis pub/sub.
- Per-Org connection cap: 1,000 concurrent (raised on Team plan).
- Per-Account cap: 10 concurrent connections.
- Backpressure: drop oldest cursor events first.
- Bandwidth budget: < 5 KB/min/idle Account.

## 8. Privacy

- Presence visible only to other Members of the same Org.
- Share viewers do NOT see Org Members presence.
- "Invisible" toggle in `/me/profile` (Pro+) — broadcasts no presence; still receives.

## 9. Telemetry

- `presence.connected` `{ transport: "ws" | "sse", reconnects }`
- `presence.dropped` `{ reason }`
- `presence.cursor_emitted` (sampled 0.1%)
- `presence.list_seen` `{ peer_count }`

## 10. A11y

- Avatar stack `aria-label="3 members viewing"` with hidden list.
- Editing indicator announced via live region (debounced 5 s).
- Cursors hidden from screen readers.

## 11. Edge cases

| Case | Behavior |
|---|---|
| Network blip | Reconnect; presence restored within 5 s |
| Member removed from Org | All their connections force-closed |
| Multi-tab same Account | Counted as one presence (deduped by `account_id`); editing state OR-ed |
| Server restart | All clients reconnect; new snapshot fans out |
| Account on Free plan | Basic presence only (no cursors) |

## 12. Tests

- Integration: connect → emit join → other client receives within 200 ms.
- Resilience: kill WS server; reconnect cleanly.
- Load: 10k concurrent connections per pod; latency budget.
- Security: cannot subscribe to a channel for an Org you don't belong to.
