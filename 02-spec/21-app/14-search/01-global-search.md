# Global Search

Cmd+K / Ctrl+K everywhere. The single entry point for finding anything.

---

## 1. Activation

- `Cmd+K` (mac) / `Ctrl+K` (win/linux) — anywhere in the app, extension popup, new tab.
- `/` keypress when no input is focused (fall-back).
- Click on the persistent search bar in the shell header.

## 2. Surface

- Centered modal (640 × 480 max).
- Backdrop blurred; Escape closes.
- Mounts at top of stack; preserves underlying scroll position.
- Mobile: full-screen sheet from top.

## 3. Layout

```
┌────────────────────────────────────────────┐
│ 🔍  what are you looking for?         ⌘K   │
├────────────────────────────────────────────┤
│ Tags: [ai] [research]  Date: [Last 7 days] │  ← filter chips
├────────────────────────────────────────────┤
│ ITEMS                                       │
│   📄 Example Article — example.com  ⭐     │
│   📄 Another Item   — site.com              │
│ COLLECTIONS                                 │
│   📁 Reading List · 234 items               │
│ COMMANDS                                    │
│   ⚡ Save current tab to "Reading List"     │
│   ⚡ New Collection…                        │
│ RECENT                                      │
│   🕐 ai papers                              │
│   🕐 marketing plan                         │
└────────────────────────────────────────────┘
```

## 4. Result categories (in order)

1. **Items** (max 6 visible; "Show all" expands).
2. **Collections / Groups / Spaces** (max 3).
3. **Tags** (max 3, only if query matches tag names).
4. **Members** (max 3, in Team Orgs only).
5. **Commands** (always shown last when query is short; promoted when query matches a command).
6. **Recent searches** (when query is empty).

Each category is collapsible; user preference persisted.

## 5. Ranking

Score = `field_match_score × recency_decay × relevance_boost − penalty`

| Signal | Weight |
|---|---|
| Title prefix match | × 4 |
| Title contains | × 2 |
| URL host match | × 1.5 |
| Tag exact match | × 3 |
| Note / description contains | × 1 |
| Recently opened | + boost (decay 7 d) |
| Starred | + 0.2 |
| Pinned | + 0.4 |
| Archived | × 0.3 |
| Trashed | excluded by default |

Ties broken by `updated_at desc`.

## 6. Performance budget

| Stage | Budget (p95) |
|---|---|
| First key → first paint of dropdown | < 50 ms |
| First key → first results from local cache | < 80 ms |
| Cold-cache server query | < 250 ms |
| Refresh on subsequent keystrokes | < 30 ms |

Local index (extension / web cache):
- IndexedDB-backed FlexSearch / MiniSearch instance.
- Built incrementally as items load; refreshed on sync events.
- Covers titles, tags, host, note (truncated 1 KB).

Server index:
- Postgres `pg_trgm` + GIN; tsvector for full-text.
- Optional Meilisearch / Typesense layer for Pro+ cross-Org global search.

## 7. Operators (Pro+)

Same syntax as `02-item-search.md`:
- `tag:ai` `tag:"machine learning"`
- `in:"Reading List"` `in:work`
- `domain:github.com`
- `before:2026-04-01` `after:2026-01-01`
- `is:starred` `is:pinned` `is:shared` `is:archived`
- `has:note` `has:image`
- `"exact phrase"`
- `term1 OR term2`, `term1 AND NOT term2`
- Negation: `-tag:wip`

Operators detected as the user types; chips appear above input as visual confirmation.

## 8. Empty state

Query empty:
- Recent searches (last 5).
- "Try" hints rotating: "Type a domain, tag, or title."
- Quick links: "Trash", "Starred", "Shared by me".

## 9. No-results state

Query has typos that even fuzzy can't reach:
- "No results for `<query>`."
- Suggestions: "Did you mean `<top suggestion>`?"
- Action: "Search the web for `<query>`" → opens default search engine in new tab.
- Action: "Save the page you're on" → quick-save the current tab into Inbox.

## 10. Keyboard

| Key | Action |
|---|---|
| ↑ / ↓ | Move selection |
| Enter | Open primary action (item: jump-to / open; collection: navigate; command: execute) |
| Cmd+Enter | Open in new tab (item) |
| Shift+Enter | Open & keep search modal open |
| Tab | Focus filter chips |
| Backspace at empty | Remove last chip |
| Esc | Close modal |

## 11. Recent searches

- Stored per Account in DB (synced across devices) via `GET /v1/search/recent` (see `03-api-endpoints/13-search.md`); cleared via `DELETE /v1/search/recent`.
- Last 20 retained.
- "Clear recent" link below list.
- Searches with operators stored verbatim.
- Anonymized after 7 days for analytics; cleared by user any time.

> Autocomplete suggestions (tag/collection/domain hints in §7 chips and §8 empty state) are served by `GET /v1/search/suggest`.

## 12. Saved searches (Pro+)

- After running a query, "Save search" button (top-right of results).
- Appears as a virtual "Smart Collection" in sidebar.
- Re-evaluates live on every visit.
- Editable / deletable from `/saved-searches`.

## 13. Cross-Org search

- Account-level toggle: "Search across all my Orgs" (default off).
- When on: aggregates items from every Org user is Member of.
- Result rows badge the source Org.
- Permissions enforced server-side; never returns items user can't access.

## 14. Telemetry

- `search.opened` `{ surface }` (extension popup, new tab, web)
- `search.queried` `{ query_length, operator_count, scope }` (query string itself NOT logged)
- `search.results_shown` `{ counts_per_category, latency_ms }`
- `search.result_clicked` `{ category, position, latency_to_click_ms }`
- `search.no_results`
- `search.saved` `{ has_operators }`
- `search.recent_cleared`

## 15. Edge cases

| Case | Behavior |
|---|---|
| Index not yet built (cold start) | Spinner; server-only results until ready |
| User signs out mid-query | Modal closes; redirect to login |
| Org switched while results showing | Results re-scoped automatically |
| Very long query (> 200 chars) | Truncated with hint |
| Result is in trash | Hidden by default; `is:trashed` operator includes |
| Result is in Org user no longer has access to | Filtered out post-fetch |

## 16. Tests

- Latency budget per surface in CI synthetic.
- Operator parser unit tests (positive + negative + escapes).
- Ranking determinism: same query → same order across runs.
- Cross-Org permission filter correctness.
- Index incremental update under concurrent mutations.
- Recent searches sync + clear.
