# Search Engine Choice

> **Closes gap M5.** Decides the search engine, indexing model, and SLA enforcement for global, item, and workspace search.
> **Locked decision:** **Postgres FTS (`tsvector` + `pg_trgm`)** for v1 (Phase 0–1). **Meilisearch** as planned upgrade in Phase 2 when corpus exceeds 1 M items per Org.

---

## 1. Decision matrix

| Engine | v1 fit | Latency p95 | Cost/month | Operational load | Verdict |
|---|---|---|---|---|---|
| **Postgres FTS + pg_trgm** | ✅ | ~120 ms @ 100 k items | $0 (already in Cloud) | Zero | **Chosen v1** |
| Meilisearch (managed Cloud) | ✅ | ~50 ms @ 10 M | ~$50 starter | Sync pipeline needed | **Phase 2 upgrade** |
| Typesense Cloud | ✅ | ~60 ms | ~$60 starter | Same as Meili | Backup option |
| Algolia | ✅ | ~30 ms | ~$500+ at scale | Managed | Cost prohibitive |
| Elasticsearch | ❌ | ~80 ms | ~$80 starter | High | Overkill |

## 2. Postgres FTS implementation (v1)

### 2.1 Indexed columns

| Entity | Field | Weight |
|---|---|---|
| item | `title` | A |
| item | `description` (notes) | B |
| item | `url` (host + path) | C |
| item | tag names (joined) | C |
| collection | `name` | A |
| collection | `description` | B |
| space | `name` | A |
| group | `name` | B |

### 2.2 Schema

```sql
alter table items add column search_tsv tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(url, '')), 'C')
  ) stored;

create index items_search_tsv_idx on items using gin (search_tsv);
create index items_title_trgm_idx on items using gin (title gin_trgm_ops);

-- Analogous columns on spaces, collections, groups (referenced by 02-data-model/05-item.md note):
alter table spaces      add column search_tsv tsvector generated always as
  (setweight(to_tsvector('simple', coalesce(name, '')), 'A')) stored;
alter table collections add column search_tsv tsvector generated always as
  (setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
   setweight(to_tsvector('simple', coalesce(description, '')), 'B')) stored;
alter table groups      add column search_tsv tsvector generated always as
  (setweight(to_tsvector('simple', coalesce(name, '')), 'B')) stored;

create index spaces_search_tsv_idx      on spaces      using gin (search_tsv);
create index collections_search_tsv_idx on collections using gin (search_tsv);
create index groups_search_tsv_idx      on groups      using gin (search_tsv);
```

### 2.3 Query pattern

```sql
select id, title, ts_rank_cd(search_tsv, query) as rank
from items, websearch_to_tsquery('simple', $1) query
where org_id = $2
  and deleted_at is null
  and search_tsv @@ query
order by rank desc, updated_at desc
limit 50;
```

Fallback for typos: `pg_trgm` similarity ≥ 0.3 union'd with FTS results, deduped, re-ranked.

### 2.4 Multi-language

- v1: `simple` config (no stemming) — matches more languages out of the box without misstemming.
- v2: per-account `search_language` setting → `english`, `spanish`, etc.

## 3. SLA enforcement

| Metric | Target | Action if breached |
|---|---|---|
| p50 latency | < 50 ms | Log only |
| p95 latency | < 150 ms | Alert, queue Phase-2 migration |
| p99 latency | < 400 ms | Alert |
| Index lag (write → searchable) | 0 (synchronous via `stored`) | n/a |

Latency measured from edge function entry to first row returned.

## 4. Phase-2 migration trigger

Auto-trigger evaluation when ANY of:

- Org has > 500 k items
- p95 query latency > 200 ms for 7 consecutive days
- Org explicitly enables `search.advanced` flag

Migration flow: dual-write Postgres + Meilisearch for 7 days → cutover → drop FTS index.

## 5. What is NOT in scope for FTS v1

- Vector / semantic search (Phase 3 with pgvector)
- Personal ranking ("results you tend to click")
- **Single-query cross-Org FTS.** RLS isolates each Org's index; cross-Org search (per `03-workspace-search.md` and `01-global-search.md §13`) is implemented as a server-side fan-out — one FTS query per Org the Account is a Member of, then merged + re-ranked. This is a query-orchestration concern, not an engine capability.
- Fuzzy URL matching beyond host (use trigram on host only, not full URL)

## 6. Locked rules

1. Engine is Postgres FTS in v1. PRs adding Algolia, Elastic, etc. are rejected.
2. Every searchable entity MUST have a generated `search_tsv` column with the weights above.
3. RLS applies to search results (no leakage across Orgs or shares).
4. Search endpoint always returns ≤ 50 results per page; pagination via cursor `after_rank`.
5. No `ILIKE '%term%'` in production code paths — always FTS or trigram.
