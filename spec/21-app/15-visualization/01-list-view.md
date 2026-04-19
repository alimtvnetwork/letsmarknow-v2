# List View

Default view mode. Dense, scannable, keyboard-friendly rows. Phase 0.

> All folder-wide rules (data shape, `view_mode` storage, API surface, realtime, virtualization, entitlements, copy-string keys, error codes, telemetry namespace) live in `readme.md` §C1–C13. This file owns only the list-specific spec.

---

## 1. Row anatomy

```
┌─────────────────────────────────────────────────────────────────────┐
│ ☐ 🔖  Title of the saved item              ai · research  ⭐ 2d ⋯  │
│       host.com/path · note preview…                                 │
└─────────────────────────────────────────────────────────────────────┘
```

- Checkbox (multi-select) — appears on hover or when ≥ 1 row selected. Hit area 24×24 px (per `06-ui-ux/20-accessibility-wcag.md` §3 minimum touch target).
- Favicon (16 × 16) — lazy-loaded; falls back to letter avatar via the `06-ui-ux/18-favicon-pipeline.md` fallback chain.
- Title — single line, ellipsis on overflow; `text-sm font-semibold` per design tokens.
- Tags — first 3 visible; `+N` chip for the rest. Click tag chip → filter by that tag (no navigation; updates `view_settings.filters`).
- Star icon — toggle on click; mutates `item.starred` per `12-history-undo/01-event-log.md` §4.
- Relative time — `MAX(item.last_opened_at, item.updated_at)` formatted per `06-ui-ux/17-copy-strings.md` `time.relative.*` keys.
- `⋯` overflow menu — keyboard reachable via Tab; opens DropdownMenu per `06-ui-ux/03-component-library.md` §dropdown.
- Subtitle line: host + first 80 chars of `item.note` (muted color: `--muted-foreground`).

## 2. Density

| Density | Row height | Vertical padding | Subtitle visible? | Default |
|---|---|---|---|---|
| `comfortable` | 56 px | 8 px | Yes | ✅ default |
| `cozy` | 44 px | 6 px | Yes | |
| `compact` | 32 px | 4 px | No (auto-hidden) | |

Switchable from view-options popover. **Persisted to `collections.view_settings.density`** per `readme.md` §C2.

## 3. Columns (optional, Pro+)

Entitlement: `view.list.extra_columns` per `readme.md` §C10.

User can enable extra columns:
- Created date (`item.created_at`)
- Updated date (`item.updated_at`)
- Last opened (`item.last_opened_at`)
- Size (`item.metadata.size_bytes`, for files)
- Author (`item.created_by` resolved to display name; Team only)
- Word count (`item.metadata.word_count`, for note items)

Column visibility persisted at `collections.view_settings.columns: string[]`. Drag column headers to reorder; right-click header for visibility menu (ContextMenu per `06-ui-ux/03-component-library.md`).

When entitlement absent: menu item shows lock icon and triggers upsell modal with copy-string key `upgrade.modal.feature_locked` substituting `feature="extra columns"`.

## 4. Sorting

- Click column header to sort.
- Triple-state cycle: ascending → descending → manual (drag-order).
- Sort indicator arrow (Lucide `ArrowUp` / `ArrowDown`) on active column.
- Default: `updated_at desc`. Persisted at `collections.view_settings.sort` per `readme.md` §C2.
- Sort state cleared by drag-reorder of any row (auto-switch to `manual`); confirm toast: copy-string key `view.list.sort_disabled_by_drag`.

## 5. Grouping

- Optional: group by Tag, Date (Today / Yesterday / This Week / Older), Domain, Author.
- Group headers sticky on scroll (`position: sticky; top: 0`).
- Collapse/expand per group; state persisted in `sessionStorage` under `lmn.list.collapsed.{collection_id}`.
- Group-by `Author` requires Team plan (entitlement: `view.list.group_by_author`).

## 6. Selection

Per folder rule `readme.md` §C6:

- Click row body → focus.
- Click checkbox or `Space` → toggle selection.
- `Shift+Click` → range select.
- `Cmd/Ctrl+A` → select all visible.
- Selected rows: 2 px `--primary` left border + tinted background `bg-primary/8`.

## 7. Keyboard

| Key | Action | Conflict-checked? |
|---|---|---|
| ↑ / ↓ | Move focus | yes — global registry per `06-ui-ux/08-keyboard-input.md` §3 |
| Space | Toggle selection | yes |
| Enter | Open primary action (open URL in new tab) | yes |
| Cmd/Ctrl+Enter | Open in current tab | yes |
| → | Expand row to inline preview | yes |
| ← | Collapse preview | yes |
| Delete | Move to Trash (with undo toast) | yes — fires `item.trashed` per `12-history-undo/01-event-log.md` §4 |
| `e` | Edit title inline | yes |
| `t` | Add tag (opens picker) | yes |
| `s` | Toggle star | yes |

All shortcuts MUST be registered in `06-ui-ux/08-keyboard-input.md` §3 to avoid collisions with other surfaces.

## 8. Inline preview

- `→` or hover-dwell 400 ms expands a 200 px detail strip below the row.
- Shows full `item.note`, all tags, image preview if `item.metadata.og_image` present, action buttons.
- `←` or Esc collapses.
- Only one preview open at a time.
- Preview content fetched via `GET /v1/items/{id}` per `03-api-endpoints/08-items.md`. Cached for 5 min in TanStack Query.

## 9. Virtualization

Per folder rule `readme.md` §C7. Library: `@tanstack/react-virtual` (variable size; row heights cached by `item.id`). Overscan 5 rows. Scroll position preserved across navigation via TanStack Router scroll restoration.

## 10. Empty state

Per `06-ui-ux/12-empty-error-loading.md`. List view shows:
- Centered illustration (asset key `lmn-empty-list.svg` per `06-ui-ux/05-iconography.md`).
- Headline copy-string key: `view.list.empty.headline`.
- Sub copy-string key: `view.list.empty.sub`.
- Primary CTA: copy-string key `view.list.empty.cta_primary` ("Save your first link").
- Secondary CTA: copy-string key `view.list.empty.cta_secondary` ("Import from…") → opens `11-import-export/03-import-pipeline.md` flow.

## 11. Performance

| Metric | Budget (p95) | Measured how |
|---|---|---|
| Initial render (50 rows) | < 80 ms | React profiler at first paint |
| Scroll FPS at 5k items | ≥ 55 | Chrome DevTools Performance panel |
| Sort/filter re-render | < 100 ms | mark/measure between user input and paint |
| Image lazy-load p95 | < 300 ms after viewport entry | PerformanceObserver `element` entries |

Reported via telemetry events in §12; alerted in observability dashboard per `22-infrastructure/10-observability.md` §3.

## 12. Telemetry

Namespace: `view.list.*` per `18-analytics-telemetry/03-events.md`.

- `view.list.opened` `{ density, item_count, collection_id }`
- `view.list.density_changed` `{ from, to }`
- `view.list.column_toggled` `{ column, on: bool }`
- `view.list.sort_changed` `{ column, direction }`
- `view.list.preview_opened` `{ item_id, via: "keyboard" | "hover" }`
- `view.list.fps_p50` `{ value, item_count }` (sampled 1%)

## 13. Edge cases

| Case | Behavior | Spec ref |
|---|---|---|
| Item with no title | Show `item.url_normalized` as title; muted style | `02-data-model/05-item.md` |
| Item with no favicon | Letter avatar from host name | `06-ui-ux/18-favicon-pipeline.md` §4 |
| 10k+ items | Virtualization mandatory; "showing N of M" footer | `readme.md` §C7 |
| All items in one tag group | Group header still rendered | — |
| Sort + manual order conflict | Manual order disabled chip; click to re-enable | §4 |
| Remote delete arrives while row focused (P0: cross-tab via `BroadcastChannel`; P2: cross-device via realtime) | Move focus to next sibling; toast copy-key `view.list.item_removed_remotely` | `readme.md` §C5 |
| Concurrent `view_settings` PATCH | Server returns `409 CONFLICT`; client refetches; LWW per `12-history-undo/03-conflict-resolution.md` §3 | — |

## 14. A11y

- Each row is a `<div role="option">` inside `<div role="listbox">`.
- Selected state: `aria-selected="true"`.
- Focus ring: 2 px `--ring` (per design tokens) — never removed.
- Screen reader announces selection count on change ("3 items selected").
- All interactive controls hit-target ≥ 24×24 px per WCAG 2.1 AA (`06-ui-ux/20-accessibility-wcag.md` §3).

## 15. Copy strings used

All keys live in `06-ui-ux/17-copy-strings.md`. Add new strings there first, then reference here.

- `view.list.empty.headline`
- `view.list.empty.sub`
- `view.list.empty.cta_primary`
- `view.list.empty.cta_secondary`
- `view.list.sort_disabled_by_drag`
- `view.list.item_removed_remotely`
- `time.relative.*` (shared)
- `upgrade.modal.feature_locked` (shared, on Pro+ column toggle)

## 16. Tests

- Keyboard navigation across 1k items.
- Selection persistence on sort change.
- Virtualization scroll integrity (scrollTop math after viewport resize).
- Density switch preserves focus.
- Inline preview keyboard close.
- Cache invalidation P0: simulate `BroadcastChannel('lmn.invalidate')` postMessage → row removed within 500 ms.
- Cache invalidation P2 (deferred until realtime ships): simulate `collection:{id}` Supabase Realtime event → row removed within 500 ms.
- Entitlement gate: as Free user, click "Add column" → upsell modal opens; no PATCH fired.
