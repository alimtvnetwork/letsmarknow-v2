# Item Search

Search scoped to items. Used by global search, in-Collection filter bars, and the API.

---

## 1. Endpoint

Item search is served by the canonical search family in [`03-api-endpoints/13-search.md`](../03-api-endpoints/13-search.md):

- `GET /v1/search` — full search (this surface)
- `GET /v1/search/quick` — omnibox quick-find (extension)
- `GET /v1/search/suggest` — autocomplete

Pagination follows the cursor-only contract in [`03-api-endpoints/01-conventions.md §5`](../03-api-endpoints/01-conventions.md) (W-13). Total counts are NEVER returned in paginated lists; use `/count` endpoints when needed. There is no `/v1/items/search` route.

## 2. Scopes

- `org` (default)
- `space:<id>`
- `collection:<id>` (includes its groups)
- `group:<id>`
- `tag:<name>`
- `archive`
- `trash`
- `account` (cross-Org; opt-in)

## 3. Query syntax

### Free text
- Tokenized; lowercased; diacritics folded.
- Fuzzy by default (Damerau-Levenshtein within edit distance 1 for tokens ≥ 4 chars).
- Phrase match in quotes: `"exact phrase"` — disables fuzzy for that span.

### Operators (Pro+)
- Field operators: `tag:`, `in:`, `domain:`, `host:`, `path:`, `title:`, `note:`, `desc:`, `url:`.
- Boolean: `AND` (default between bare terms), `OR`, `NOT` / `-`.
- State: `is:starred`, `is:pinned`, `is:archived`, `is:trashed`, `is:shared`, `is:public`, `is:private`, `has:note`, `has:image`, `has:preview`.
- Time: `before:YYYY-MM-DD`, `after:YYYY-MM-DD`, `created:YYYY-MM-DD`, `updated:relative` (e.g., `updated:7d`, `updated:1mo`).
- Author / actor (Team): `by:@member`, `to:@member` (shared with).

### Grammar
```
expr      := term ( ' ' expr )?
term      := group | atom
group     := '(' expr ')'
atom      := op_atom | text_atom | '-' atom | '"' .* '"'
op_atom   := IDENT ':' value
value     := IDENT | quoted | date | duration
text_atom := IDENT
```
Parse failure → fall back to free-text search of the whole string with a friendly hint.

## 4. Ranking & scoring

Score components (server-side):
| Component | Weight |
|---|---|
| BM25 over title | 4.0 |
| BM25 over tags | 3.0 |
| BM25 over note + description | 1.5 |
| BM25 over url + host | 1.5 |
| Recency: `e^(-Δdays / 30)` | × multiplier 0..1 |
| `starred` flag | + 0.20 |
| `pinned` flag | + 0.40 |
| `is:archived` | × 0.30 |
| Tag exact match | + 1.0 |
| Domain exact match | + 0.8 |

Final order: `score desc`, then `updated_at desc`.

## 5. Highlighting

- `<em>` wraps matched spans (configurable via Accept header).
- Snippet = window of 200 chars around best match in note/description.
- HTML always sanitized server-side.

## 6. Indexes

### Postgres baseline
- `tsvector` on `title || ' ' || coalesce(description,'') || ' ' || coalesce(note,'')`.
- `pg_trgm` GIN on `title`, `host`.
- Composite index on `(org_id, status, updated_at)`.

### Optional engine
- For Team / Pro at scale: replicated to Meilisearch / Typesense.
- Async via outbox; lag p95 < 5 s.
- Failover to Postgres if engine offline.

## 7. Caching

- Per-(org, query, filters, cursor) result cached 30 s in Redis.
- Cache busted by mutations on items in scope.
- Local client cache (IndexedDB) covers titles + tags for offline / instant.

## 8. Pagination

- Cursor-based; opaque token encoding `(score_lower_bound, last_id)`.
- Default limit 25; max 100.
- `total_estimate` is an HLL-style approximation (cheap) for large result sets.

## 9. Permissions

- Filtered server-side per Member role + entitlements.
- Trash visible only with `is:trashed` operator AND role ≥ Editor.
- Archived items returned only with `is:archived` OR if scope is the archive.

## 10. Performance

| Scope | p95 |
|---|---|
| Single Collection (≤ 1k items) | < 30 ms |
| Whole Org (≤ 100k items) | < 250 ms |
| Cross-Org (Pro+) | < 500 ms |

Hot queries (`empty filter scope=org`) precomputed and cached.

## 11. Smart suggestions

While typing, the server (or local index) suggests:
- Matching tag names: `ai`, `ai-research`.
- Matching collection names.
- Operator hints: typing `tag:` shows top 5 tags.

## 12. Error model

- `400 INVALID_QUERY` with `details.position` for parse errors.
- `403 FORBIDDEN` for cross-Org if entitlement missing.
- `429 RATE_LIMITED` at 60 queries / min / Account (web), 600 / min (API token).

## 13. Telemetry

- `item_search.queried` `{ scope, has_operators, latency_ms }`
- `item_search.parse_failed` `{ position }`
- `item_search.zero_results` `{ scope }`
- `item_search.cursor_paginated`
- `item_search.suggestion_clicked` `{ kind }`

## 14. Edge cases

| Case | Behavior |
|---|---|
| Empty query with filters only | Returns filtered set (acts as a smart filter) |
| Operator references non-existent tag | Match-zero; suggest closest tag |
| Mixed case operators (`Tag:ai`) | Lowercased; valid |
| Date in unusual format | Try ISO 8601, `YYYY/MM/DD`, common locales; reject else |
| Org ID mismatch in scope vs URL | 400 with explanation |
| Result item deleted between fetch and click | UI shows "Removed since search"; quick re-search |

## 15. Tests

- Operator grammar fuzz test.
- Ranking snapshot tests on fixture corpus.
- Permission filter correctness across Member roles.
- Lag tolerance: mutate item → search reflects within 5 s.
- Pagination consistency under concurrent mutations.
- Highlight sanitation.
