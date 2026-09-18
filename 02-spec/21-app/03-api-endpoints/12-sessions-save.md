# Save Session Endpoints

"Save Session" = take all open tabs in a window and persist them as Items inside a Collection (optionally a new one) or as a new Group inside an existing Collection. Driven by the Chrome extension; also callable from web.

All require bearer auth + `X-Organization-Id`.

---

### Save session
`POST /v1/sessions/save`

**Auth:** bearer
**Idempotent:** Idempotency-Key required (extension generates per save action)
**Rate limit class:** bulk

**Request body**
```json
{
  "destination": {
    "kind": "new_collection",
    "space_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
    "name": "2026-04-18 Research",
    "color": "#3b82f6",
    "icon_emoji": "📚"
  },
  "tabs": [
    {
      "url": "https://chatgpt.com/",
      "title": "ChatGPT",
      "favicon_data_url": "data:image/png;base64,...",
      "pinned": false,
      "active": true,
      "window_position": 0
    }
  ],
  "options": {
    "close_tabs_after_save": false,
    "exclude_pinned": true,
    "exclude_chrome_internal": true,
    "dedupe_within_session": true,
    "dedupe_against_collection": false
  },
  "client": {
    "window_id": 123,
    "saved_at": "2026-04-18T14:22:31.123Z",
    "extension_version": "1.4.0",
    "browser": "chrome/124"
  }
}
```

**`destination.kind`** values:
- `"new_collection"` — create a Collection in `space_id` (required); accepts `name`, `color`, `icon_emoji`.
- `"existing_collection"` — append to `collection_id`; accepts `as_group` (bool); when true creates a Group named after `name` (defaults to date).
- `"new_group"` — create Group in `collection_id` with `name`.
- `"existing_group"` — append to `group_id`.

**Response 201**
```json
{
  "data": {
    "destination": {
      "kind": "new_collection",
      "collection_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
      "group_id": null
    },
    "items_created": 12,
    "items_skipped": 2,
    "items_failed": 0,
    "skipped": [
      { "url": "chrome://extensions", "reason": "internal_url_excluded" },
      { "url": "https://chatgpt.com/", "reason": "duplicate_in_session" }
    ],
    "history_event_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
    "undo_token": "lmn-undo-..."
  }
}
```

`undo_token` lets the extension show "Undo Save Session" toast for 30 s — calls `/v1/history/:id/undo`.

**Errors**
- `400 VALIDATION_FAILED` — empty `tabs` after exclusions
- `403 ENTITLEMENT_REQUIRED` — Free item cap will be exceeded; `details.would_create=12`, `details.cap_remaining=3`
- `409 LIMIT_REACHED` — hard cap on Collection/Group items

---

### Preview save (dry-run)
`POST /v1/sessions/save/preview`

Same body as `save` minus `client`. Returns what WOULD happen without writing.

**Response 200**
```json
{
  "data": {
    "would_create": 12,
    "would_skip": 2,
    "skipped": [ /* same shape */ ],
    "destination_resolved": { "kind": "new_collection", "name": "2026-04-18 Research" },
    "entitlement_blocking": false
  }
}
```

---

### List recent saved sessions (extension UI history)
`GET /v1/sessions/recent`

**Query**
- `limit` (default 20, max 100)

**Response 200**
```json
{
  "data": [
    {
      "history_event_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
      "saved_at": "...",
      "destination": { "kind": "new_collection", "collection_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab", "name": "..." },
      "items_count": 12,
      "can_undo": true
    }
  ]
}
```

Backed by History Events of type `session.saved`.

---

### Restore tabs from a Collection/Group (reverse op, "Open all as session")
`POST /v1/sessions/restore`

**Request body**
```json
{
  "source": { "kind": "collection", "id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab", "include_groups": true },
  "in_new_window": true,
  "limit": 50
}
```
**Response 200** Same shape as `collections.open-all`: server returns ordered URLs; extension opens them locally.
