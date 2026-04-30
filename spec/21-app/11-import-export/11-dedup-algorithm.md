# Import Dedup Algorithm

> **Closes gap M12.** Concrete algorithm, thresholds, and tie-breakers for detecting duplicate items during import.
> **Locked rule:** The order below is sequential — first match wins; never combine results from multiple stages.

---

## 1. Pipeline (sequential, first match wins)

```
Stage 1 — exact URL match (canonicalised)
Stage 2 — content sha256 match (if HTML body fetched)
Stage 3 — host + path match (ignoring query, fragment, trailing slash)
Stage 4 — fuzzy title match within same host (Jaro-Winkler ≥ 0.92)
```

If no stage matches → item is treated as new.

## 2. Stage details

### Stage 1 — Canonical URL

Canonicalisation rules (in order):
1. Lowercase scheme + host
2. Strip default ports (`:80`, `:443`)
3. Remove `www.` if and only if it resolves to the same origin (don't alter for `www.example.org` ≠ `example.org` registered separately)
4. Decode percent-encoding for unreserved characters
5. Sort query parameters alphabetically
6. Drop tracking params: `utm_*`, `fbclid`, `gclid`, `mc_cid`, `mc_eid`, `igshid`, `ref`, `ref_src`, `ref_url`
7. Strip fragment (`#…`) UNLESS it follows pattern `#!` (legacy hashbang routes) or `#/` (SPA routes)
8. Remove trailing `/` unless URL is the root

Match on full canonical URL string equality.

### Stage 2 — Content sha256

If importer fetched the HTML body (only when explicitly enabled — most CSV imports skip this):
- sha256 of the **`<body>` text content** (stripped of script/style, whitespace-collapsed) → match.
- Threshold: exact equality.

### Stage 3 — Host + path

- `canonical_url.host + canonical_url.path` equality, ignoring query and fragment entirely.
- Catches "same article, different campaign params" cases that slipped Stage 1.

### Stage 4 — Fuzzy title

- Only triggered when host matches an existing item but path differs.
- Algorithm: **Jaro-Winkler distance** (NOT Levenshtein).
- Threshold: **≥ 0.92** similarity.
- Both titles normalised: lowercased, punctuation stripped, sequential whitespace collapsed.
- Tie-breaker if multiple candidates ≥ 0.92: shortest path; then most recent `created_at`.

## 3. Why these choices

| Choice | Rationale |
|---|---|
| Jaro-Winkler over Levenshtein | Better for short strings (article titles). Penalises mismatched prefixes less. |
| 0.92 threshold | Empirically catches "10 Best …" vs "10 Best … (Updated)" without merging unrelated articles. |
| Tracking-param strip list explicit | Avoids over-aggressive stripping (e.g., `q` param in search URLs is meaningful). |
| Sequential pipeline | Predictable, debuggable, no fuzzy-merge surprises. |

## 4. User-facing behavior

When dedup fires:

| Scope | Default | User override |
|---|---|---|
| Single import (UI) | Show "X duplicates found — skip / merge / import-anyway?" prompt | Per-item choice |
| Bulk import (> 100 items) | Default = SKIP duplicates; show summary at end | Toggle in import wizard |
| Auto-import (browser ext) | Default = SKIP; surface in activity feed | Per-org setting |
| API import | Default = SKIP; respond with `{ duplicates: [...], created: [...] }` | Header `X-Dedup-Mode: skip|merge|allow` |

`merge` semantics: keep older item's `id`, copy new item's `tags` (union), `description` (concatenate with separator), `updated_at = max`.

## 5. Performance

- Stage 1 + 3 use B-tree index on `canonical_url` and `(host, path)`.
- Stage 2 uses unique index on `content_sha256`.
- Stage 4 uses `pg_trgm` GIN index on `title` filtered by `host` — fallback to in-memory Jaro-Winkler when host has < 1 000 items.
- Target: < 100 ms per item lookup at 100 k items per Org.

## 6. Telemetry

> **`dedup_mode` enum (canonical, telemetry-only).** Allowed values: `skip | merge | allow`. Mirrors the `X-Dedup-Mode` header in §4 and the per-import wizard toggle. Distinct from the wire-level `on_duplicate` enum on `POST /v1/imports/:id/commit` (`skip | overwrite | create_new | merge_tags` — see `03-api-endpoints/15-import-export.md`); the request-time `on_duplicate` is mapped down to `dedup_mode` for emission. Cross-referenced from `03-import-pipeline.md §14` (`import.commit_started`) and `05-mapping-and-dedup.md §12` (`import.dedup_summary.mode`).

| Event | Props |
|---|---|
| `import.dedup_matched` | `stage` (1-4), `org_id`, `source` |
| `import.dedup_skipped` | `count` (per import batch) |
| `import.dedup_merged` | `count` |
| `import.dedup_overridden` | `count` (user chose "import anyway") |

## 7. Locked rules

1. Dedup pipeline is exactly these 4 stages, in this order. PRs adding ML/embedding-based dedup are deferred to Phase-3.
2. Threshold for Stage 4 is **0.92** — do not change without A/B test data showing ≥ 5% accuracy improvement.
3. Tracking-param strip list is exhaustive. New params added → migration to re-canonicalise existing items.
4. `merge` mode never deletes item history; old item's history events remain.
5. Cross-Org dedup is forbidden (privacy isolation).
