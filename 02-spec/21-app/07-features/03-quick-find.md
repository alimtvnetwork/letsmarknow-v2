# Quick Find

Search across all saved items, fast.

---

## 1. Surfaces

| Surface | Trigger |
|---|---|
| Web app top-bar search | Type or `/` |
| Web app `/search` | Direct route, full results |
| Command palette | `Cmd/Ctrl+K` → type query |
| Extension popup | Search input at top |
| Extension new-tab | Search input |
| Extension side panel | Search at top |
| Omnibox | `lmn <query>` |
| Browser shortcut | `Alt+K` (extension `quick_find` command) |

## 2. Index

- Server-side Postgres FTS (tsvector) over: `title`, `url_host`, `description`, `notes`, `tags`, `collection.name`, `group.name`.
- Per-Org index, scoped by membership.
- Refresh on every write (trigger).
- Local secondary index (FlexSearch in IndexedDB) for offline + instant local hits.

## 3. Query syntax

Plain text → matches all words (AND across fields).

Field prefixes:
- `tag:react` — has tag
- `in:Quick Tools` — in Collection (or Space, Group)
- `from:alim` — created by member
- `is:starred` / `is:shared` / `is:private`
- `domain:github.com`
- `created:>7d` — age filter
- `has:notes` / `has:description`

Operators:
- `-tag:wip` — negation
- `"exact phrase"` — quoted exact
- `tag:react OR tag:vue` — explicit OR (default is AND)

## 4. Ranking

Score formula (v1):
```
score =
  3.0 * title_match
  + 1.5 * url_host_match
  + 1.0 * description_match
  + 1.0 * notes_match
  + 2.0 * tag_match
  + 0.5 * recency_decay(created_at)
  + 0.7 * star_boost
  + 0.3 * personal_recency_boost (this user opened recently)
```

Tweakable behind feature flag; A/B tested.

## 5. Performance budgets

- Local results visible p75 < 50 ms (FlexSearch).
- Server results visible p75 < 200 ms.
- Combined: local first, server replaces/augments within 200 ms with smooth merge.
- Result count per page: 50; infinite scroll.

## 6. Result composition

Top section: "Best matches" (3–5 items).
Then by type:
- Items
- Collections
- Groups
- Tags

Each result shows: favicon, title with highlights, breadcrumb (Space › Collection), tags, snippet.

## 7. Empty / error

- 0 results → suggestion: "Try removing a filter" + show recent saves.
- Error → inline error region; local results still displayed.

## 8. Keyboard

- Up/Down navigate.
- Enter opens (in new tab by default).
- Cmd/Ctrl+Enter opens in current tab.
- Tab cycles between sections.
- Esc closes (palette/popup) or clears (page).

## 9. Entitlements

| Feature | Free | Pro | Team |
|---|---|---|---|
| Plain-text search | ✅ | ✅ | ✅ |
| Field prefixes | ✅ | ✅ | ✅ |
| Boolean operators | ❌ | ✅ | ✅ |
| Saved searches | ❌ | ✅ | ✅ |
| Search inside notes | ✅ | ✅ | ✅ |

## 10. Saved searches (Pro+)

- Name + query; pinned in sidebar under "Saved searches".
- Click → executes query.
- Edit / delete inline.

## 11. Telemetry

- `search.executed` `{ query_length, has_filters, results_count, duration_ms }`
- `search.opened_result` `{ rank, type }`
- `search.zero_results` `{ query_length }`
- `search.saved` (Pro+)
- `search.field_prefix_used` `{ prefix }`

## 12. Tests

- Unit: parser tests for query syntax (incl. quotes, negation, OR).
- Backend: ranking regression tests against fixture.
- E2E: type query → assert highlights, breadcrumbs, click result.
- Load: 100k items / 1k concurrent searches; p95 < 250 ms.
