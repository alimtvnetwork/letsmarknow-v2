# Entity: Item

## Purpose

A single saved tab. The leaf of the hierarchy. Lives directly inside a Collection OR inside a Group. Carries URL, title, favicon, description, tags, notes, position, timestamps, and last-opened tracking.

## Fields

| Name | Type | Null | Default | Validation | Description |
|---|---|---|---|---|---|
| Audit Block | — | — | — | — | — |
| `collection_id` | uuid (Collection.id) | no | — | must exist | The owning Collection (always set, even if Item lives in a Group — denormalized for query speed). |
| `group_id` | uuid (Group.id) | yes | null | must belong to same Collection | When non-null, Item lives inside this Group; when null, lives directly in Collection. |
| `space_id` | uuid (Space.id) | no | derived | denormalized | — |
| `organization_id` | uuid (Organization.id) | no | derived | denormalized | — |
| `url` | url | no | — | RFC 3986, ≤ 2048 chars, scheme http/https/chrome-extension/file | The tab URL. |
| `url_normalized` | url | no | derived | strip fragment unless meaningful, lower-case host, sort query keys | Used for dedupe + jump-to-tab matching. |
| `title` | string(500) | no | derived from page or "Untitled" | trim | The tab title. User-editable. |
| `description` | text | yes | null | ≤ 4000 chars | User-editable. |
| `notes` | text | yes | null | ≤ 8000 chars | User-editable. |
| `favicon_url` | url | yes | null | https | Cached favicon URL (server-fetched, mirrored to CDN). |
| `favicon_color` | color | yes | null | derived | Dominant color, used as fallback tile color. |
| `position` | bigint | no | max(siblings)+1024 | — | Order within parent (Collection or Group). |
| `is_starred` | bool | no | false | — | Per-Account. |
| `starred_pin_position` | float8 | yes | null | non-null iff `is_starred=true` | Manual ordering within the parent Collection's "⭐ Starred" pinned section (Toby parity, SI-021). Independent of `position`. |
| `color_label` | enum(`none`\|`red`\|`orange`\|`yellow`\|`green`\|`teal`\|`blue`\|`purple`\|`pink`) | no | `none` | — | Per-Item color tag (Toby parity, SI-021). Renders as 4px left border on cards and a colored dot in list view. Resolved hex values defined in `06-ui-ux/01-design-tokens.md` `--color-label-*` tokens. Independent of Collection `color` and Tag colors. |
| `tag_ids` | array<uuid> | no | `[]` | ≤ 32 | — |
| `last_opened_at` | timestamp | yes | null | — | Updated on Jump-to-Tab or open. |
| `open_count` | int | no | 0 | ≥ 0 | Lifetime open count for sort-by-most-used. |
| `source` | enum(`manual`\|`save_session`\|`drag_from_tabs`\|`import_toby`\|`import_tabextend`\|`import_chrome`\|`import_json`\|`api`) | no | `manual` | — | How this Item was created. Useful for analytics + import dedup. |
| `import_origin_id` | string(120) | yes | null | — | Original ID from imported source (for re-import dedup). |
| `metadata` | json | no | `{}` | — | Page metadata snapshot at save time (see § Metadata JSON). |
| `search_tsv` | tsvector | no | generated | — | **Computed column.** See `14-search/06-search-engine.md` §2.2 for the generation expression and weight table (F-M17 reconciliation, 2026-04-19). Used by global, item, and workspace search. Indexed via GIN. Never written by application code. |

### Metadata JSON (snapshot at save time, never auto-refreshed)

```json
{
  "site_name": "GitHub",
  "og_image_url": "https://...",
  "og_description": "...",
  "language": "en",
  "saved_from_window_id": 12,    // Chrome window id at save time, for Save-Session attribution
  "saved_from_user_agent": "Chrome/124..."
}
```

## Relationships

- **Parent:** Collection (always) + optionally Group.
- **Children:** Shares (0..N — single-item shares).
- **Cross-refs:** `tag_ids[]` → Tag.

## Invariants

1. `collection_id` always set, even when `group_id` is set. They are consistent: `Group.collection_id == Item.collection_id`.
2. `url` validated, max 2048 chars. Truncation forbidden (reject).
3. `url_normalized` recomputed on every URL update.
4. `tag_ids` all from same Org.
5. Position scoped to `(collection_id, group_id)` so reordering inside a Group does not affect siblings outside it.
6. `open_count` and `last_opened_at` updated atomically.
7. `starred_pin_position` is non-null iff `is_starred = true`. Toggling `is_starred=false` MUST null the pin position; toggling to `true` MUST assign `max(starred siblings in same collection_id+group_id scope)+1024` if no explicit value provided. (SI-021.)
8. `color_label` is purely visual; it does NOT affect search, sort, or entitlement gating.

## Indexes (recommended)

- `(collection_id, group_id, position)` for render
- `(organization_id, url_normalized)` for dedupe / jump-to-tab
- `(organization_id, deleted_at)`
- GIN on `tag_ids`
- **GIN on `search_tsv`** for global / item / workspace search — definition lives in `14-search/06-search-engine.md` §2.2
- `(organization_id, last_opened_at DESC)` for "Recently opened"

> **Note on full-text search:** The legacy line "Full-text on `(title, description, notes, url)`" is superseded by the generated `search_tsv` column above. Analogous `search_tsv` columns also exist on `collections`, `spaces`, and `groups` per the same source spec.

## Lifecycle

- **Create:** by Editor+. Sources:
  - Manual "+ Add Item" button.
  - Drag from Open Tabs panel → drops into Collection/Group → optionally closes the source tab.
  - Save Session → batch-create from current window's tabs.
  - Import flows.
  - API.
- **Dedup on create:** if same `url_normalized` already exists in same Collection, server may merge (configurable, default = allow duplicate, surface a warning).
- **Update:** any mutable field. URL update recomputes `url_normalized`, refetches favicon async.
- **Move:** between Collections / Groups within same Org. Updates `collection_id`, `group_id`, `space_id`, `organization_id` accordingly.
- **Duplicate:** new row, name = `"<title> copy"`, position = end of same parent.
- **Open / Jump-to:** non-mutating except `last_opened_at` and `open_count`. Emits `item.opened` (not in Undo).
- **Soft-delete:** standard.

## Favicon handling

- On Item create/update with new URL: server enqueues async favicon fetch.
- Fetch: try `/favicon.ico`, then `<link rel="icon">` from HTML, then Google's favicon proxy as fallback.
- Cache to CDN; store CDN URL in `favicon_url`.
- Compute `favicon_color` (dominant color) for fallback tile background.
- Refetch on demand (user "Refresh favicon" action) or scheduled refresh every 90 days.

## Events emitted

- `item.created` (with `source`)
- `item.updated` (per-field diff)
- `item.moved` (collection/group change)
- `item.reordered`
- `item.duplicated`
- `item.opened` (analytics-only, NOT undoable)
- `item.starred` / `item.unstarred`
- `item.tagged` / `item.untagged`
- `item.note_updated`
- `item.favicon_refreshed`
- `item.shared` / `item.unshared`
- `item.soft_deleted`
- `item.restored`
- `item.hard_deleted`
