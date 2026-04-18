# Sync & Offline

How the extension stays consistent with the server while supporting offline use.

---

## 1. Source of truth

The **server** is authoritative. The extension is a write-through cache + offline buffer. Conflicts always resolve server-side via optimistic concurrency (`If-Match`).

## 2. Cache layers

| Layer | Tech | TTL | Eviction |
|---|---|---|---|
| L0: in-memory (per surface) | JS objects | session | unmount |
| L1: `chrome.storage.local` | KV | indefinite | quota (~10 MB) |
| L2: IndexedDB `lmn-cache` | object stores | indefinite | LRU at 50 MB |

L0 is rebuilt on each surface mount from L1+L2 (sync) then refreshed from network (async).

## 3. Read path

```
read(entity) → L0 hit?  yes → return immediately, fire background revalidate
              no → L1/L2 hit? yes → hydrate L0, return, fire revalidate
              no → fetch network → write L0/L1/L2 → return
```

Revalidate uses `If-None-Match: <etag>`; `304` short-circuits.

## 4. Write path

Three modes:

### 4.1 Online optimistic
1. Apply mutation to L0 (UI updates instantly).
2. POST/PATCH to API.
3. On success: update cache with server response.
4. On failure: rollback L0; show error toast.

### 4.2 Offline queue
1. Detect offline (`navigator.onLine === false` OR fetch fails with network error).
2. Push mutation to `pending_mutations` (in storage, capped at 500 entries).
3. Apply optimistic update to L0/L1/L2; mark entity with `_pending: true`.
4. On `online` event or alarm `lmn.flush-offline-queue`: drain queue in order. Each mutation has its own `Idempotency-Key` generated at queue time.
5. Per-mutation success → clear `_pending`. Failure (4xx) → move to `failed_mutations` for user review (Options page "Sync issues" panel).

### 4.3 Conflict
- `409 STALE_RESOURCE`: refetch entity, present 3-way merge UI for editable fields (title, description, notes); for moves/reorder, accept server state.
- `409 LIMIT_REACHED`: rollback; show upgrade modal.
- `403 ENTITLEMENT_REQUIRED`: rollback; show upgrade modal.
- `404`/`410`: entity disappeared — remove from cache; show "Removed by another device" toast.

## 5. Pull sync

Triggered by:
- Manual refresh (user pulls dashboard)
- Alarm `lmn.sync-pull` every 5 min while a surface is open
- WebSocket invalidation message (when connected; see § 7)

Algorithm (incremental):
```
GET /v1/sync/since?org=<id>&etag=<last_etag>
→ { changes: [...], deletes: [...], next_etag: "..." }
```
Apply changes / deletes to local stores. Persist `next_etag`.

If `since_etag` is stale (server can't replay), server returns `410 GONE` → extension does full re-pull (`/v1/sync/full`) — typically only on first install or after long absence.

## 6. Push sync

Mutations are pushed eagerly; no batching delay.

For `bulk` operations (e.g. multi-select tag), client uses `/v1/bulk/items` to keep the server-trip count low.

## 7. Realtime invalidation (WebSocket)

- Endpoint: `wss://api.letsmarknow.com/v1/realtime?org=<id>` (auth via short-lived ticket from `POST /v1/realtime/ticket`).
- Connected when at least one surface is open AND user enabled "Real-time updates" (default ON for Pro+; Free uses 5-min poll).
- Messages:
  ```json
  { "type": "invalidate", "entity_type": "item", "ids": ["01J..."] }
  { "type": "broadcast", "event_type": "item.created", "entity": { ... } }
  { "type": "entitlements_changed", "entitlements_hash": "..." }
  ```
- On disconnect: exponential backoff reconnect (1s, 2s, 4s, max 30s).
- Heartbeat ping every 25s; close on miss.

## 8. Conflict resolution UI

Inline ribbon at top of affected entity:
> ⚠️ "Quick Tools" was edited on another device. **[See changes]** **[Keep mine]** **[Use theirs]**

`See changes` opens a side-by-side diff (notes/description fields).

## 9. Storage quotas & pressure

- Monitor `navigator.storage.estimate()` weekly (alarm).
- At 80% of quota: evict items not opened in 60 days from L2; keep meta only.
- At 95%: evict aggressively, surface a banner "Cache is full — clear in Options".

## 10. Offline indicator

Top-bar dot:
- Green: online + synced
- Yellow: online + unsynced mutations (count badge)
- Red: offline (count badge)
- Spinning: syncing now

Tooltip: "Last synced 2 min ago. 3 changes pending."

## 11. Observability

- Each sync cycle logs (no PII): `{ pulled, pushed, failed, duration_ms, entities_touched }` to `chrome.storage.local.sync_log` (last 200 entries) for Options "Diagnostics".
- Aggregated counters reported to telemetry hourly (see `analytics-telemetry.md`).
