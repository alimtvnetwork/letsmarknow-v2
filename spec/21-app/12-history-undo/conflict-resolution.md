# Conflict Resolution

What happens when two people (or two devices) edit the same thing at the same time.

---

## 1. Philosophy

Convergence > correctness-by-fiat. We pick deterministic merge rules biased toward:
1. **Preserve work** (no silent loss).
2. **Last-writer-wins** for atomic scalar fields (title, color).
3. **Set-union** for collection-like fields (tags, items in group).
4. **CRDT for free-form text** (notes, descriptions).
5. **Surface conflicts** when human judgment is needed (e.g., simultaneous renames to different values).

## 2. Sync model

- Each client connects to `/rt` WebSocket per Org.
- Mutations published as events (per `event-log.md`).
- Server is source of truth; assigns canonical sequence (monotonic per Org).
- Clients apply events in sequence; resolve conflicts deterministically.
- Local optimistic mutations get a temp ID; resolved on server ACK.

## 3. Field-level merge strategies

| Field type | Strategy |
|---|---|
| Title, name, slug | Last-write-wins by server timestamp |
| Color, icon, position | Last-write-wins |
| Tags (set) | Union of additions; subtract removals; per-tag LWW for color/rename |
| Note / description (rich text) | Y.js CRDT (see § 5) |
| Item membership in Collection | Move with most recent timestamp wins; previous moves become history only |
| Group composition | Set-union; ordering uses fractional indexing |
| Star / pin / archive flags | LWW per flag |
| Share password / expiry | LWW; affects all viewers immediately |

## 4. Fractional indexing for ordering

Items / Groups / Collections use fractional position keys (e.g., `0.5`, `0.75`).
- Insert between A (`0.5`) and B (`0.75`) → new key `0.625`.
- No global re-numbering needed.
- Ties (rare) broken by ULID lexicographic order.
- Keys serialized as base-62 strings for compact storage and arbitrary precision.
- Periodic rebalance job runs when key length > 32 chars (offline maintenance).

## 5. Y.js for free-form text (notes / descriptions)

- Notes use Y.js (Yjs library) for character-level CRDT.
- Each note has a Y.Doc; updates broadcast as binary deltas via `/rt`.
- Awareness layer (cursor, selection) overlaid (per `08-sharing-collab/realtime-presence.md`).
- Server stores authoritative Y.Doc snapshot + delta log.
- Compaction every 1000 ops or 24 h.
- Round-trip: any client diverged offline can sync deltas and converge.

## 6. Conflict surfacing

When auto-merge cannot decide cleanly (rare; mostly intentional simultaneous renames):
- Both values stored briefly; "Conflict" badge appears on the entity.
- "Resolve" button opens diff modal:
  - "Person A wrote: Marketing Plan"
  - "Person B wrote: Q2 Marketing Plan"
  - Pick one OR enter custom OR keep both (→ creates two with suffix).
- Conflict resolution itself is a HistoryEvent with `kind=conflict.resolved`.

## 7. Optimistic UI rollback

Sequence:
1. User edits title → applied locally, sent to server.
2. Concurrently, another user's edit arrives via `/rt`.
3. Local: server's event has earlier sequence → apply theirs first, then re-apply ours.
4. Server: both events committed in arrival order; LWW chosen by server timestamp.
5. Final UI matches server state on both clients.

If server rejects local edit (rare; permission lost mid-edit):
- Local state rolled back.
- Toast: "Couldn't save title — you no longer have edit access."

## 8. Offline + reconnection

Per `04-extension/sync-and-offline.md`:
- Mutations queued in `pending_mutations` while offline.
- On reconnect: queue replayed.
- Events that conflict with subsequent server events resolved per § 3.
- User sees "Synced X changes" or "Couldn't sync N — review" if any rejected.

## 9. Move conflicts (the messy ones)

Two users move the same item to different Collections at the same time:
- Both events recorded in event log.
- LWW by server-timestamp determines final location.
- Loser's intent visible in History tab: "Person A moved to X (overridden by Person B move to Y)".
- Optional: show one-time toast to loser: "Your move to X was overridden."

For bulk moves: per-item LWW; partial overlap possible (some items follow A's move, some B's).

## 10. Delete conflicts

| A does | B does | Result |
|---|---|---|
| Edits title | Trashes item | Trash wins (it was the later action by server timestamp); A's edit appears in trash |
| Trashes | Trashes | Single trash; deduped |
| Trashes | Restores (was already trashed) | Trash wins if newer; restore wins if newer |
| Hard-deletes | Anything later | Hard delete is final; later mutations rejected with `TARGET_GONE` |

Hard delete only happens after 30-day soft-delete grace; window is large enough to make this rare.

## 11. Permission conflicts

- Owner downgrades Member to Viewer mid-edit:
  - In-flight mutations from now-Viewer rejected with `FORBIDDEN`.
  - Local rollback; toast.
  - WebSocket pushes role-change event; UI updates affordances.

## 12. Determinism

For any sequence of events on any starting state, every client converges to the SAME state.
- Server sequence is canonical.
- Tie-breakers documented (ULID order).
- No floating-point math in merge logic.

## 13. Versioning of merge rules

If we change a merge rule:
- Bump `merge_rules_version`.
- Old events still merge correctly (rules are append-only / monotonic).
- Migration script may rewrite history minimally if needed (rare).

## 14. Telemetry

- `conflict.field_merged` `{ field, strategy }` (sampled 0.1%)
- `conflict.surfaced` `{ entity_type, field }`
- `conflict.resolved` `{ choice }`
- `conflict.move_overridden` `{ item_id }`
- `sync.event_applied` `{ kind, latency_ms }`
- `sync.optimistic_rolled_back` `{ kind, reason }`
- `crdt.note_compacted` `{ ops_compacted }`

## 15. Edge cases

| Case | Behavior |
|---|---|
| Same user, two devices, same edit | Idempotency-Key dedupes; applied once |
| Network partition for hours | On reconnect, large queue drained; user sees progress |
| Y.Doc divergence (corruption) | Server snapshot wins; client refetches; user warned of any text loss |
| Tag rename collision (two users rename to same new name at same time) | Single tag remains; no duplicate created |
| Item moved to Collection that was just deleted | Move re-targets to "Inbox" Collection with toast: "Destination was deleted; placed in Inbox" |
| Two undos racing | Both processed; stacks maintained per-user; no global undo confusion |

## 16. Tests

- Property-based tests: random sequences of operations from N clients converge to same state.
- LWW timestamp determinism under clock skew (server time always wins).
- Y.Doc convergence after offline + reconnect with arbitrary edit interleavings.
- Conflict surfacing UX path (manual resolve → resolution event recorded).
- Permission-revocation mid-edit → graceful rejection.
- Move-then-delete vs delete-then-move ordering.
