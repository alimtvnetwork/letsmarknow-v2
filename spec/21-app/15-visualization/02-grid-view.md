# Grid View

Image-forward card layout. Best for visual content (articles, images, videos, design refs). Phase 0.

> Folder-wide rules in `readme.md` §C1–C13. This file owns only grid-specific spec.

---

## 1. Card anatomy

```
┌──────────────────────┐
│                      │
│   [preview image]    │  ← aspect-ratio per §2 (lazy + blurhash)
│                      │
├──────────────────────┤
│ 🔖 Title of item     │
│ host.com             │
│ ai · research  ⭐ ⋯ │
└──────────────────────┘
```

- Title clamped to 2 lines via `line-clamp-2`.
- Host + tags + star + overflow on footer row.
- Card lifts on hover (1 px translate-y, `shadow-md` token).
- Selected: 2 px `--primary` border + check overlay top-left (16×16).
- Card root: `<button role="option" aria-selected={...}>` for grid keyboard model.

## 2. Sizes

Persisted at `collections.view_settings.size` per `readme.md` §C2.

| Size | Card width | Aspect default | Entitlement (per `readme.md` §C10) |
|---|---|---|---|
| `small` | 180 px | 16:9 | Free |
| `medium` (default) | 240 px | 16:9 | Free |
| `large` | 320 px | 16:9 | Free |
| `xl` | 420 px | 16:9 | Pro (`view.grid.size_xl`) |

Grid uses CSS `grid-template-columns: repeat(auto-fit, minmax(<size>, 1fr))`. Number of columns derives from container width and chosen `size`; the breakpoints in `06-ui-ux/19-breakpoints.md` §1 govern container width but NOT grid column count.

## 3. Aspect ratio

Persisted at `collections.view_settings.aspect`. Options: `16:9`, `4:3`, `1:1`, `natural` (masonry). Default `16:9`.

When `natural`: layout uses CSS grid `grid-row: span <calc>` based on each image's intrinsic dimensions (from `item.metadata.image_width` / `image_height` per `02-data-model/05-item.md`). Falls back to `16:9` if dimensions absent.

## 4. Image source priority

For each card's preview image, resolve in this order; fall through if missing:

1. **User-uploaded cover image** (Pro+, entitlement `view.grid.custom_cover`). Stored in bucket `attachments` per `22-infrastructure/12-storage-layout.md` §1, path `{org_id}/items/{item_id}/cover.{ext}`.
2. **OpenGraph image** fetched at save time per `06-ui-ux/18-favicon-pipeline.md` §3 (note: same pipeline workflow even though these are page images, not favicons; bucket `share-snapshots` for OG images per F-M01).
3. **First inline `<img>`** scraped from page body (per `07-features/12-embeds-and-previews.md`).
4. **Favicon enlarged on muted background** — final fallback. Uses `06-ui-ux/18-favicon-pipeline.md` rendered at 96 px on `bg-muted`.

Images stored at three resolutions (thumb 256w / medium 640w / full 1280w) per `06-ui-ux/18-favicon-pipeline.md` §2. Served via `<picture><source srcset="..."></picture>` with `loading="lazy"` and `decoding="async"`.

## 5. Hover overlay

On hover (or focus):
- Subtle gradient at bottom for legibility (`bg-gradient-to-t from-background/80 to-transparent`).
- Quick-action buttons fade in: Star · Tag · Open · ⋯.
- Tags chip row appears if not visible by default.
- Animation respects `prefers-reduced-motion` per `readme.md` §C8 (instant show instead of fade).

## 6. Multi-select

Per folder rule `readme.md` §C6.

- Click checkbox in top-left corner (visible on hover or when ≥ 1 selected).
- `Shift+Click` range; `Cmd+Click` toggle.
- Selected cards get persistent check icon + tinted overlay (`bg-primary/12`).

## 7. Drag and drop

Per `06-ui-ux/09-drag-and-drop.md`.

- Long-press (200 ms) on touch / direct mousedown on grab area to start drag.
- Ghost shows count badge for multi-drag (e.g., "5 items").
- Drop targets: other Collections / Groups in sidebar; reordering within grid via grid-cell drop.
- Server mutation: `PATCH /v1/items/{id}` with `{ collection_id, group_id, position }` per `03-api-endpoints/08-items.md`. Optimistic per `12-history-undo/02-undo-redo.md` §5.

## 8. Keyboard

| Key | Action |
|---|---|
| Arrow keys | Move focus across grid (column-wrap aware) |
| Space | Toggle selection |
| Enter | Open primary action (open URL in new tab) |
| Cmd/Ctrl+Enter | Open in current tab |
| `s` / `t` / `e` | Star / Tag / Edit |
| Delete | Trash (`item.trashed` event) |

All shortcuts registered in `06-ui-ux/08-keyboard-input.md` §3. Focus ring always visible (2 px `--ring`).

## 9. Lazy loading

- IntersectionObserver loads images 200 px before viewport (`rootMargin: 200px`).
- Placeholder: blurhash decoded to canvas (10 × 6 px upscaled). Source: `item.metadata.blurhash`.
- Failed loads → favicon fallback (per §4) after 1 retry with 2 s exponential backoff.
- Failed-load telemetry per §12.

## 10. Sorting & grouping

Same options as list view (`01-list-view.md` §§ 4-5). Group headers span full grid width via `grid-column: 1 / -1`. State persistence identical (`collections.view_settings.sort` / `.group_by`).

## 11. Performance

| Metric | Budget (p95) |
|---|---|
| Initial paint (24 cards) | < 120 ms |
| Image decode (medium 640w) | < 80 ms |
| Scroll FPS at 2k cards | ≥ 55 |
| Memory at 5k cards | < 400 MB |

Virtualization via `@tanstack/react-virtual` grid mode after 100 cards (per `readme.md` §C7).

## 12. Telemetry

Namespace `view.grid.*`. Catalog in `18-analytics-telemetry/03-events.md`.

- `view.grid.opened` `{ size, aspect, item_count, collection_id }`
- `view.grid.size_changed` `{ from, to }`
- `view.grid.aspect_changed` `{ from, to }`
- `view.grid.image_load_failed` `{ source: "user_cover" | "og" | "scraped" | "favicon", item_id }`
- `view.grid.cover_uploaded` `{ item_id, size_bytes }` (Pro+ only)

## 13. Edge cases

| Case | Behavior | Spec ref |
|---|---|---|
| No image available | Letter-avatar block of card height | `06-ui-ux/18-favicon-pipeline.md` §4 |
| Mixed aspect ratios with `natural` | Masonry layout via CSS grid `grid-row: span` | §3 |
| Very tall image (≥ 4:1) | Cropped center; full visible on hover preview | — |
| GIF / video poster | Pause unless hovered (respect reduced-motion) | `readme.md` §C8 |
| User uploaded NSFW (Team policy) | Blur until clicked (Org setting `org.content_blur_default=true`) | `17-admin-org/01-organization-settings.md` |
| Free user tries XL size | UI hides XL chip; if URL-deeplinked with `?size=xl`, server returns `BILLING_QUOTA_EXCEEDED` and client downgrades to `large` | `readme.md` §C10 |
| Cover-image upload while offline | Queued in `pending_mutations` (per `04-extension/10-sync-and-offline.md`); retries on reconnect | — |

## 14. A11y

- Grid is `<div role="grid">`; cards are `<button role="gridcell" aria-selected="...">`.
- 2D arrow-key navigation MUST handle the auto-fit column count (recompute on resize).
- All decorative images: `alt=""`. Meaningful covers: `alt={item.title}`.
- Focus visible at 3:1 contrast minimum per `06-ui-ux/20-accessibility-wcag.md` §2.

## 15. Copy strings used

- `view.grid.empty.headline`
- `view.grid.empty.sub`
- `view.grid.empty.cta_pinterest_import`
- `view.grid.empty.cta_behance_import`
- `view.grid.upload_cover_button`
- `upgrade.modal.feature_locked` (shared, on XL or custom-cover gate)

## 16. Tests

- Aspect-ratio switch preserves scroll position.
- Lazy-load doesn't fire for off-screen cards.
- Drag of 50-item selection completes < 1 s including server PATCH ack.
- Masonry packs without gaps > 4 px at all breakpoints (`xs`–`3xl`).
- Image fallback chain coverage: each of 4 sources tested in isolation.
- Grid keyboard nav handles dynamic column count after resize.
- Entitlement gate: free user → no XL chip in size menu.
