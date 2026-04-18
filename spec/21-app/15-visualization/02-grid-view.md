# Grid View

Image-forward card layout. Best for visual content (articles, images, videos, design refs).

---

## 1. Card anatomy

```
┌──────────────────────┐
│                      │
│   [preview image]    │  ← 16:9 thumbnail (lazy + blurhash)
│                      │
├──────────────────────┤
│ 🔖 Title of item     │
│ host.com             │
│ ai · research  ⭐ ⋯ │
└──────────────────────┘
```

- Aspect ratio: 16:9 (default), 4:3, 1:1, "natural" — user-switchable.
- Title clamped to 2 lines.
- Host + tags + star + overflow on footer row.
- Card lifts on hover (1 px translate-y, soft shadow).
- Selected: 2 px primary border + check overlay top-left.

## 2. Sizes

- **Small**: 180 px wide.
- **Medium** (default): 240 px.
- **Large**: 320 px.
- **XL**: 420 px.
- Responsive: columns auto-fit `minmax(size, 1fr)`.

## 3. Image source priority

1. User-uploaded cover image (Pro+).
2. OpenGraph image fetched at save time.
3. First image scraped from page body.
4. Favicon enlarged on muted background (fallback).

Images stored in CDN with three resolutions (thumb / medium / full); served via `<picture>` srcset.

## 4. Hover overlay

On hover (or focus):
- Subtle gradient at bottom for legibility.
- Quick-action buttons fade in: Star · Tag · Open · ⋯.
- Tags chip row appears if not visible by default.

## 5. Multi-select

- Click checkbox in top-left corner (visible on hover or when ≥ 1 selected).
- `Shift+Click` range; `Cmd+Click` toggle.
- Selected cards get persistent check icon + tinted overlay.

## 6. Drag and drop

- Long-press (200 ms) or grab handle to start drag.
- Ghost shows count badge for multi-drag.
- Drop targets: other Collections / Groups in sidebar; reordering within grid via grid-cell drop.

## 7. Keyboard

| Key | Action |
|---|---|
| Arrow keys | Move focus across grid |
| Space | Toggle selection |
| Enter | Open primary action |
| Cmd+Enter | Open in new tab |
| `s` / `t` / `e` | Star / Tag / Edit |
| Delete | Trash |

Focus ring always visible (2 px primary).

## 8. Lazy loading

- IntersectionObserver loads images 200 px before viewport.
- Placeholder: blurhash decoded to canvas (10 × 6 px upscaled).
- Failed loads → favicon fallback after 1 retry.

## 9. Sorting & grouping

Same options as list view (`01-list-view.md` §§ 4-5). Group headers span full grid width.

## 10. Performance

| Metric | Budget (p95) |
|---|---|
| Initial paint (24 cards) | < 120 ms |
| Image decode (medium) | < 80 ms |
| Scroll FPS at 2k cards | ≥ 55 |
| Memory at 5k cards | < 400 MB |

Virtualization via `react-virtuoso` grid mode after 100 cards.

## 11. Empty state

- Friendly illustration + "Add a link with an image to see it here".
- CTA chips: "Try Pinterest import" / "Try Behance import".

## 12. Telemetry

- `view.grid.opened` `{ size, aspect, item_count }`
- `view.grid.size_changed`
- `view.grid.aspect_changed`
- `view.grid.image_load_failed` `{ source }`

## 13. Edge cases

| Case | Behavior |
|---|---|
| No image available | Letter-avatar block of card height |
| Mixed aspect ratios with "natural" | Masonry layout via CSS grid `grid-row: span` |
| Very tall image (≥ 4:1) | Cropped center; full visible on hover preview |
| GIF / video poster | Pause unless hovered (respect reduced-motion) |
| User uploaded NSFW (Team policy) | Blur until clicked (Org setting) |

## 14. Tests

- Aspect-ratio switch preserves scroll position.
- Lazy-load doesn't fire for off-screen cards.
- Drag of 50-item selection completes < 1 s.
- Masonry packs without gaps > 4 px.
- Image fallback chain coverage.
