# Search Endpoints

Org-scoped full-text + structured search over Items, Collections, Groups, Tags. Powers the global search bar and the omnibox quick-find in the extension.

All require bearer auth + `X-Organization-Id`. Rate limit class: `search`.

---

### Global search
`GET /v1/search`

**Query**
- `q` (string, required) — 1–200 chars; tokenized by whitespace; supports `"quoted phrases"`, `-exclude`, and field prefixes:
  - `tag:react` — has tag
  - `in:collection-name` or `in:01J...` — within Collection
  - `space:my-collections` — within Space
  - `is:starred`, `is:hidden`, `is:trashed`
  - `domain:chatgpt.com`
  - `created:>2026-01-01`, `updated:<7d`
- `types` (csv, default `item,collection,group,tag`) — limit result kinds
- `limit` (default 25, max 100), `cursor`
- `highlight` (bool, default true)

**Response 200**
```json
{
  "data": [
    {
      "type": "item",
      "id": "01J...",
      "title": "ChatGPT",
      "url": "https://chatgpt.com/",
      "favicon_url": "...",
      "collection": { "id": "01J...", "name": "Quick Tools", "color": "#e94560" },
      "group": null,
      "tags": [{ "id": "01J...", "name": "ai", "color": "#10b981" }],
      "score": 0.97,
      "highlight": {
        "title": "<em>Chat</em>GPT",
        "url": null
      }
    },
    {
      "type": "collection",
      "id": "01J...",
      "name": "Marketing Improvements",
      "color": "#e94560",
      "item_count_cache": 4,
      "score": 0.81,
      "highlight": { "name": "<em>Marketing</em> Improvements" }
    }
  ],
  "page": { "next_cursor": null, "has_more": false, "limit": 25 },
  "meta": {
    "took_ms": 23,
    "parsed_query": {
      "terms": ["chat"],
      "filters": { "tag": ["react"], "is_starred": true }
    }
  }
}
```

**Errors**
- `400 VALIDATION_FAILED` `details.field="q"` — empty/too long/unparseable

---

### Omnibox quick-find (extension)
`GET /v1/search/quick`

Optimized variant: returns at most 10 results, items only, no highlight, no pagination, target latency p95 < 80ms.

**Query**
- `q` (string, required)
- `recent_boost` (bool, default true) — re-rank by `last_opened_at`

**Response 200**
```json
{
  "data": [
    {
      "id": "01J...",
      "title": "ChatGPT",
      "url": "https://chatgpt.com/",
      "favicon_url": "...",
      "collection_name": "Quick Tools",
      "score": 0.97
    }
  ]
}
```

---

### Suggestions / autocomplete
`GET /v1/search/suggest`

Used to power the suggest dropdown as the user types.

**Query**
- `q` (string, required) — partial token
- `limit` (default 8)

**Response 200**
```json
{
  "data": {
    "queries": [ "chat history", "chat templates" ],
    "tags":    [ { "id": "01J...", "name": "chatgpt" } ],
    "collections": [ { "id": "01J...", "name": "Chat Tools" } ],
    "domains": [ "chatgpt.com" ]
  }
}
```

---

### Recent searches (per-Account, per-Org)
`GET /v1/search/recent`

**Response 200**
```json
{
  "data": [
    { "q": "tailwind", "last_used_at": "...", "results_count": 14 }
  ]
}
```

`DELETE /v1/search/recent` clears the list. `DELETE /v1/search/recent?q=tailwind` removes one entry.
