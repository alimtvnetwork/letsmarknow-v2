# 14 — Search

Fast, fuzzy, multi-scope search. The fastest path from "I remember saving this" to "here it is".

## Reading order

1. `global-search.md` — Cmd+K everywhere; cross-Org if user has many.
2. `item-search.md` — within an Org / Space / Collection.
3. `workspace-search.md` — across all Orgs the Account belongs to.
4. `filters.md` — chip-based refinement (tags, dates, type, share state).
5. `jump-to-result.md` — what happens when you Enter on a result.

## Files

| File | Purpose |
|---|---|
| `global-search.md` | Cmd+K experience |
| `item-search.md` | Scoped item search |
| `workspace-search.md` | Cross-Org search |
| `filters.md` | Refinement chips |
| `jump-to-result.md` | Result actions |

## Locked rules

- **First keystroke result < 80 ms p95** (cached / local).
- **Server result < 250 ms p95** for cold queries.
- **Boolean operators (Pro+):** `AND`, `OR`, `NOT`, `"exact phrase"`, `tag:`, `in:`, `domain:`, `before:`, `after:`, `is:starred`, `is:shared`.
- **Fuzzy by default** (typo-tolerant); operators force exact.
- **Same query, same result order**, deterministic ranking.
- **Recent searches** persisted per Account; clearable.
- **Saved searches (Pro+)** appear as live "smart Collections".
- **Privacy:** queries logged in aggregate only; never per-user beyond 7 days.
- **Keyboard-first:** every result is reachable via arrow keys + Enter.
