# Illustration

Empty states, error pages, onboarding art, marketing hero scenes.

---

## 1. Style

- **Hand-drawn vector** with a single subtle stroke (1.5 px) and flat 2-tone fills.
- Palette pulls from `--brand-*` and `--muted` tokens — no off-token colors.
- Slightly imperfect (organic curves, no perfectly straight lines) — sets us apart from cookie-cutter SaaS.
- Always SVG. Never raster except for marketing photography.
- File size budget: < 12 KB per illustration after SVGO.

## 2. Composition

- Subject occupies central 60% of viewBox.
- Aspect ratios standardized:
  - Empty state: 320×220 (square-ish)
  - Error page: 480×320
  - Marketing hero: 1120×720
  - Onboarding step: 720×440

## 3. Cast of characters

A consistent set so users feel they're in one product:

- **Marko** — the friendly mascot (cat-bookmark hybrid). Appears on empty states and onboarding.
- **Tabs** — anthropomorphic browser tabs with little faces. Used for save flows.
- **Crate** — open box with floating bookmarks. Used for import/export.
- **Telescope** — for search empty states.
- **Sleeping Marko** — for trash and offline.

Each has 4–8 poses; reuse rather than commission new art.

## 4. Color recipes

```css
.illustration {
  --ink: hsl(var(--foreground));
  --paper: hsl(var(--background));
  --primary-fill: hsl(var(--primary) / 0.15);
  --secondary-fill: hsl(var(--muted));
  --accent: hsl(var(--primary));
}
```

Dark mode: switching theme automatically retints (since SVGs reference `currentColor` and CSS vars).

## 5. Where each illustration appears

| Surface | Asset |
|---|---|
| Empty Collection | `marko-empty-shelf.svg` |
| Empty Space | `marko-empty-room.svg` |
| Empty Search | `telescope-no-results.svg` |
| Empty Trash | `sleeping-marko.svg` |
| Empty Activity | `marko-quiet.svg` |
| 404 | `marko-lost.svg` + signpost |
| 410 (revoked share) | `crate-empty.svg` |
| 500 (server) | `marko-broken-bookmark.svg` |
| Offline | `sleeping-marko-cloud-x.svg` |
| Onboarding step 1 | `marko-greeting.svg` |
| Onboarding step 2 | `crate-importing.svg` |
| Onboarding step 3 | `tabs-cheering.svg` |
| Onboarding step 4 | `marko-thumbs-up.svg` |
| Marketing hero | `tabs-organized-scene.svg` |
| Pricing free | `marko-cup.svg` |
| Pricing pro | `marko-crown.svg` |
| Pricing team | `marko-team.svg` |
| Lifetime banner | `marko-infinity.svg` |
| Email transactional headers | reduced-motion poses of above |

## 6. Empty-state composition rule

```
[ Illustration 240–320 wide ]

Headline (text-h3, max 48 chars)
Subline (text-base text-muted-foreground, max 100 chars)

[Primary CTA]  [Secondary link]
```

No more than 2 CTAs. CTA verb-led ("Create your first collection", not "Click here").

## 7. Loading & micro-illustrations

- Avoid full-illustration loaders. Use skeletons for content-shaped placeholders.
- Brand-flavored loader allowed only on splash screens (max 600 ms).

## 8. Reduced motion

- Onboarding illustrations have subtle 4-frame loops (≤ 1 KB extra). When `prefers-reduced-motion: reduce`, they freeze at frame 0.

## 9. Production pipeline

- Source files in Figma; export via plugin to `src/assets/illustrations/<name>.svg`.
- SVGO config strips comments and metadata, preserves IDs needed for animation.
- A pre-commit hook validates: no embedded raster, no inline `style="fill:#..."`.

## 10. Localization

- Avoid text inside illustrations.
- If text is unavoidable (rare; e.g. signpost in 404), provide per-locale SVG variants in `src/assets/illustrations/i18n/<locale>/`.

## 11. Marketing photography

- Used only on `letsmarknow.com/customers/*` and `/about`.
- AVIF + WebP; never the only fallback (always JPEG).
- Real customers / team only — no stock photos.

## 12. Licensing

- All custom illustrations created in-house and proprietary.
- No third-party illustration packs.
- Marko character trademark filed; usage outside product requires written approval.
