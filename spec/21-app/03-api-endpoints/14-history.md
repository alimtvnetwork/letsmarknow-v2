# History & Undo Endpoints

Append-only History Events scoped per Org. Powers Activity feed, Undo, and Trash review.

All require bearer auth + `X-Organization-Id`. See `02-data-model/09-history-event.md` for entity shape.

---

### List history events
`GET /v1/history`

**Query**
- `actor_account_id` (uuid) — filter by who
- `entity_type` (csv: `space,collection,group,item,tag,share,member,session`)
- `entity_id` (uuid) — events touching this entity
- `event_type` (csv) — e.g. `item.created,item.deleted,session.saved,share.created,member.role_changed`
- `since`, `until` (ISO timestamps)
- `batch_id` (uuid) — events that belong to a single user action
- `include_undone` (bool, default true)
- `limit` (default 50, max 200), `cursor`

**Response 200**
```json
{
  "data": [
    {
      "id": "01J...",
      "organization_id": "01J...",
      "actor_account_id": "01J...",
      "actor_name": "Alim Ul Karim",
      "actor_avatar_url": null,
      "event_type": "item.deleted",
      "entity_type": "item",
      "entity_id": "01J...",
      "entity_snapshot": {
        "title": "ChatGPT",
        "url": "https://chatgpt.com/",
        "collection_id": "01J...",
        "collection_name": "Quick Tools"
      },
      "diff": null,
      "batch_id": "01J...",
      "client": "chrome-ext/1.4.0",
      "ip_country": "AU",
      "is_undone": false,
      "undone_by_event_id": null,
      "undoable": true,
      "undo_expires_at": "2026-04-18T14:52:31.000Z",
      "created_at": "..."
    }
  ],
  "page": { "next_cursor": "...", "has_more": true, "limit": 50 }
}
```

---

### Get event
`GET /v1/history/:id`

---

### Undo event (or batch)
`POST /v1/history/:id/undo`

**Auth:** Editor+ (and either the actor OR Owner/Admin)
**Idempotent:** yes (re-calling returns same `undo_event_id`)

**Request body** (optional)
```json
{ "undo_entire_batch": true }
```

**Response 200**
```json
{
  "data": {
    "undo_event_id": "01J...",
    "restored_entity_ids": ["01J...", "01J..."],
    "skipped": [
      { "entity_id": "01J...", "reason": "destination_deleted" }
    ]
  }
}
```

**Errors**
- `410 GONE` `details.reason="undo_window_expired"` — past `undo_expires_at` (default 30 days for soft-deletes; 30 s for moves/edits)
- `409 CONFLICT` `details.reason="already_undone"`
- `422 BUSINESS_RULE_VIOLATION` `details.reason="entity_modified_after_event"` — newer changes would be lost; client should confirm
- `403 FORBIDDEN`

---

### Redo event
`POST /v1/history/:id/redo`

Available only on events that were themselves undo events. Same response shape.

---

### Per-entity activity feed (sidebar)
`GET /v1/history/for/:entity_type/:entity_id`

Convenience wrapper around list. Caches well; safe to poll every 30 s.

**Response 200** same shape as list.

---

### Per-item activity feed (alias)
`GET /v1/items/:id/history`

Convenience alias for `GET /v1/history/for/item/:id`. Powers the item History tab in the right pane (`05-web-app/03-dashboard.md`).

**Auth:** bearer + `X-Organization-Id`
**Query** (subset of `GET /v1/history`)
- `event_type` (csv)
- `since`, `until` (ISO timestamps)
- `include_undone` (bool, default true)
- `limit` (default 25, max 100), `cursor`

**Response 200** same shape as list. Server-side this is a thin redirect to the per-entity wrapper above; the alias exists so client routing layers can fetch item activity without constructing the polymorphic path.

**Errors**
- `404 NOT_FOUND` — item does not exist or is not visible in active Org.

**Cross-references:**
- `12-history-undo/01-event-log.md §8` — reading the log.
- `02-data-model/09-history-event.md` — event shape.

---

### Trash (soft-deleted entities ready to review/restore)
`GET /v1/trash`

**Query**
- `entity_type` (csv)
- `purges_before` (ISO) — entities scheduled for hard-delete before this date
- `limit`, `cursor`

**Response 200**
```json
{
  "data": [
    {
      "entity_type": "collection",
      "entity_id": "01J...",
      "name": "Old Marketing",
      "deleted_at": "2026-04-01T...",
      "purges_at": "2026-05-01T...",
      "deleted_by": { "account_id": "01J...", "name": "Alim" },
      "history_event_id": "01J...",
      "size_summary": { "items": 42, "groups": 3 }
    }
  ]
}
```

`POST /v1/trash/restore` body `{ "entity_ids": ["01J..."] }` — bulk restore. Each id must reference the trash row's `entity_id`. Server resolves to entity-typed restore endpoints.

`POST /v1/trash/purge` body `{ "entity_ids": ["01J..."], "current_password": "..." }` — bulk hard-delete now. Owner only.

`POST /v1/trash/empty` body `{ "current_password": "..." }` — hard-delete everything in trash for the active Org. Owner only. Returns `202` with `job_id`.
