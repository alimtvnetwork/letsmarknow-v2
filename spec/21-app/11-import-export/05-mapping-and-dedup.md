# Mapping & Dedup

How external structures translate to our model and how duplicates are detected.

---

## 1. Universal mapping principles

| External concept | LMN concept |
|---|---|
| Folder / Collection / Channel | Collection |
| Sub-folder (depth 2) | Group |
| Sub-folder (depth 3+) | Flattened with `parent / sub /` prefix in Collection name |
| Bookmark / Item / Link / Raindrop | Item |
| Tag / Label | Tag |
| Highlight / Annotation | Note (Markdown blockquote) |
| Favorite / Star / Heart | starred=true |
| Read later / To-read | `read-later` tag + Collection "Read Later" |
| Archive / Done | Move to Collection "Archive"; `archived=true` |
| Public flag | `public` tag (no auto-share) |

## 2. Field mapping

| LMN field | Source |
|---|---|
| `url` | normalized (see § 4) |
| `title` | source title; fallback to `<title>` re-fetch (Pro+); fallback to URL |
| `description` | source description / excerpt |
| `note` (Markdown) | source notes / highlights / annotations |
| `tags` | source tags + auto-tags from importer config |
| `created_at` | source timestamp; today if missing |
| `imported_from` | importer ID (`chrome`, `pocket`, ...) |
| `imported_at` | now() |
| `imported_batch_id` | import job ID (for bulk-undo) |
| `favicon` | source if available; lazy-fetch otherwise |

## 3. Tag normalization

- Lowercased.
- Spaces → hyphens.
- Diacritics stripped (`café` → `cafe`).
- Emoji preserved.
- Max 32 chars (truncated with `...`).
- Tag-prefix option (e.g., `chrome-` prepended to every tag) applied AFTER normalization.

Same-name tags from import merge with existing Org tags by canonical name.

## 4. URL normalization

Used for dedup matching; **NOT** stored normalized (original `url` preserved).

Normalization steps (in order):
1. Lowercase scheme + host.
2. `http` → `https` IF the destination is reachable on HTTPS (one-time check, cached).
3. Strip default port (`:80`, `:443`).
4. Strip trailing `/` from path (unless path is just `/`).
5. Strip fragment (`#...`).
6. Sort query parameters alphabetically.
7. Strip known tracking params: `utm_*`, `fbclid`, `gclid`, `ref`, `ref_src`, `mc_cid`, `mc_eid`, `_ga`, `igshid`, `yclid`, `mkt_tok`.
8. Punycode IDNs.

Stored as `url_normalized` (indexed) + original `url`.

## 5. Dedup modes

> **Algorithm reference (F-M18, 2026-04-19):** The high-level modes here select *behavior*. The concrete matching algorithm — exact match on `url_normalized` (Stage 1) plus optional fuzzy title fallback at Jaro-Winkler ≥ 0.92 (Stage 2) plus host-grouping (Stage 3) plus user-confirm prompt (Stage 4) — is specified in `11-import-export/11-dedup-algorithm.md`. Importer codegen MUST consult that file for matcher constants. This file owns the UX modes; that file owns the matcher math.

User picks at import:

### `merge_by_url` (default)
- For each incoming item, look up existing items in target Org by `url_normalized` (Stage 1 of the matcher).
- If exact-URL match: update existing item; merge tags (union); append note (separator: `\n\n---\n\n`); preserve original `created_at`.
- If no exact match AND fuzzy title score ≥ 0.92 within the same host group: surface to user as Stage 4 confirm prompt; on accept, treat as match.
- If no match: insert new.

### `keep_both`
- Always insert; results in possible duplicates with same URL but different tags/notes.
- Stage 2 / Stage 4 fuzzy matching disabled in this mode.

### `skip_duplicates`
- For each incoming item, look up by `url_normalized`.
- If exact match: skip entirely.
- If Stage 2 fuzzy match (≥ 0.92): also skip (more conservative than `merge_by_url`).
- If no match: insert.

## 6. Collection-aware dedup (advanced)

User can opt into dedup scoped to specific Collections:
- "Don't merge items between Collection A and Collection B even if same URL."
- Useful for users who categorize the same article in multiple ways intentionally.

## 7. Cross-import dedup

- `imported_from` + source-specific external ID (e.g., Pocket `item_id`) cached as a unique key.
- Re-importing same Pocket export → matched by external ID, not URL alone (faster + more accurate).
- Stored in `item_external_refs` table.

## 8. Conflict resolution at merge

When merging two items:
| Field | Strategy |
|---|---|
| `title` | Existing wins UNLESS empty/URL-fallback (then incoming) |
| `description` | Longer wins |
| `note` | Concatenated with separator |
| `tags` | Union |
| `starred` | OR (true if either) |
| `created_at` | Earlier wins |
| `updated_at` | now() |
| `favicon` | Existing if not null; else incoming |
| `preview` | Existing if not stale (< 30 d); else incoming |
| `imported_from` | Comma-joined (`chrome, pocket`) |

## 9. Hierarchy mapping

Source nesting:
- Depth 1: Collection.
- Depth 2: Group (within parent Collection).
- Depth 3+: Flattened.

Flattening rules:
- Path joined with ` / ` (e.g., `Work / Reading / AI / Papers`).
- If resulting Collection name > 100 chars: truncate middle (`Work / Reading / ... / Papers`).
- Original full path preserved in item-level tag (`path:work-reading-ai-papers`) so power users can rebuild manually.

## 10. Empty Collections / Groups

- Empty Collection from import: created with placeholder description "Imported empty from <source>".
- Empty Group: skipped (Groups must contain ≥ 1 item).

## 11. Validation rules

Before commit, each record:
- `url` valid HTTP/HTTPS (or `mailto:`, `tel:`, `javascript:` rejected).
- `url` length ≤ 4 KB.
- `title` length ≤ 500 chars (truncated with `...`).
- `description` length ≤ 5 KB (truncated).
- `note` length ≤ 200 KB (truncated).
- `tags` ≤ 50 per item; each ≤ 32 chars.
- Total tags per Org ≤ plan cap.

Records failing validation → logged with reason; user sees in preview.

## 12. Telemetry

- `import.dedup_summary` `{ matched, inserted, skipped, mode }`
- `import.tag_normalized_count`
- `import.flatten_applied_count`
- `import.url_normalized_count`

## 13. Edge cases

| Case | Behavior |
|---|---|
| Same URL with different fragments (`#section`) | Treated as same after normalization |
| Same URL different query order | Same after sort |
| `http://` and `https://` of same URL | Same IF HTTPS reachable; else distinct |
| URL with unicode path | Punycoded for normalization; original preserved |
| Tracking-param-only difference | Same after stripping |
| Tag with leading/trailing whitespace | Trimmed; duplicates merged |
| Two source folders mapping to same name | Suffixed: `Reading List`, `Reading List (2)` |
| Source has Group-only items (no Collection wrapper) | Auto-wrapped in `<Source> Imports` Collection |

## 14. Tests

- URL normalization snapshot tests (1000 cases).
- Dedup correctness across all 3 modes.
- Merge conflict resolution per field.
- Cross-import external ID matching.
- Hierarchy flattening with deep nesting.
- Tag normalization unicode + emoji.
