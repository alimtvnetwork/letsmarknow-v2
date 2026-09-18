# Layout & Grid

Breakpoints, container widths, gutters, and how surfaces scale.

---

## 1. Breakpoints

Tailwind defaults with one addition:

| Name | Min width | Devices |
|---|---|---|
| `xs` | 0 | Phones (default base) |
| `sm` | 640 px | Large phones |
| `md` | 768 px | Tablets portrait |
| `lg` | 1024 px | Tablets landscape, small laptops |
| `xl` | 1280 px | Laptops |
| `2xl` | 1536 px | Desktops |
| `3xl` | 1920 px (custom) | Wide monitors |

## 2. Container widths

```ts
container: {
  center: true,
  padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem", xl: "2.5rem" },
  screens: { sm: "640px", md: "768px", lg: "1024px", xl: "1200px", "2xl": "1360px", "3xl": "1600px" },
}
```

Marketing pages cap at `3xl`; app dashboard fills viewport.

## 3. App shell scaffolding

| Element | Width | Notes |
|---|---|---|
| Org rail | 64 px | Always visible ≥ md |
| Sidebar | 280 px (default), 64 px (collapsed) | Resize handle 4 px hit area |
| Top bar | 100% × 48 px | Sticky |
| Main | flex-1 | min-width 0 to allow truncation |
| Right drawer | 360 px (analytics, item detail) | Overlays at < lg |

Below `md`: org rail and sidebar both collapse behind hamburger; bottom-tab nav appears (Dashboard / Search / Saves / Account).

## 4. Grid systems

### 4.1 Card grid (Collections, Items)

CSS grid `repeat(auto-fill, minmax(220px, 1fr))` with `gap-4`. Cards never wider than 320 px in `grid` mode.

### 4.2 List view

Single column with rows of fixed height; `divide-y divide-border`.

### 4.3 Column view (Kanban)

Horizontal scroll, column width 280 px, `gap-3`, snap-x mandatory. Each column body is its own vertical scroll area.

### 4.4 Form grid

`grid grid-cols-1 lg:grid-cols-3 gap-6` for settings pages: label column (`lg:col-span-1`), input column (`lg:col-span-2`).

## 5. Density

Three density modes affect padding, row height, and font size on data-heavy surfaces (members table, items list, activity feed). See `15-data-density.md`.

## 6. Safe areas

- iOS PWA: respect `env(safe-area-inset-*)` on top bar and bottom nav.
- Notched devices: backgrounds extend through; padding only on content.

## 7. Stacking & overflow

- `<main>` is the scroll container; sidebar and top bar are `sticky`/`fixed`.
- No body scroll; prevents Safari elastic glitches.
- Modals lock body scroll via Radix Dialog.

## 8. Aspect ratios

| Surface | Ratio |
|---|---|
| Item thumbnail (grid) | 16:11 |
| OG image | 1.91:1 (1200×630) |
| Embed previews | 16:9 |
| Avatar | 1:1 |
| Marketing hero | 16:9 max-w 1120 |

## 9. Mobile patterns

- Long lists virtualized at > 50 rows.
- Swipe left on item row → quick actions (Star, Tag, Delete).
- Pull-to-refresh on dashboard.
- Sticky filter chips below top bar; horizontal scroll.

## 10. Responsive type

- Headings scale with `clamp()` between mobile and desktop:
  - `--text-h1: clamp(1.75rem, 1.5rem + 1.2vw, 2.25rem)`
  - `--text-display: clamp(2.25rem, 1.6rem + 3vw, 3.5rem)`
- Body type stays at `1rem` everywhere.

## 11. Spacing scale by surface

| Surface | Default density |
|---|---|
| Marketing | Generous (`py-24` sections) |
| Dashboard | Cozy (`py-4` containers) |
| Settings forms | Comfortable (`py-6` between fields) |
| Tables | Compact (`py-2` rows) |
| Popups (extension) | Compact (`p-3`) |

## 12. Print

- Single column; max width 640 px; no shell chrome; see `16-print-stylesheet.md`.
