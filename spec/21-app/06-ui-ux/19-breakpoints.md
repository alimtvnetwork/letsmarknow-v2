# Responsive Breakpoints

> **Closes gap M9.** Enumerates breakpoints, intended layouts per surface, and the design-token mapping.
> **Locked rule:** Breakpoint tokens below are the ONLY allowed responsive thresholds. PRs introducing arbitrary `min-width` values are rejected.

---

## 1. Breakpoint tokens (Tailwind aligned)

| Token | min-width | Devices | Tailwind prefix |
|---|---|---|---|
| `xs` | 0 px | small phones | (default) |
| `sm` | 640 px | large phones / phablet | `sm:` |
| `md` | 768 px | tablet portrait | `md:` |
| `lg` | 1024 px | tablet landscape / small laptop | `lg:` |
| `xl` | 1280 px | laptop / desktop | `xl:` |
| `2xl` | 1536 px | wide desktop | `2xl:` |

These match the existing `tailwind.config.ts` defaults — no overrides — so `06-ui-ux/01-design-tokens.md` does not need changes.

## 2. Intended layout per surface

| Surface | xs / sm | md | lg / xl / 2xl |
|---|---|---|---|
| Marketing landing | Single column, sticky CTA bottom | Two-column hero | Three-section with screenshot grid |
| Sign-in / Sign-up | Single column form, full-bleed | Centered card 480 px | Centered card 480 px + side illustration |
| Dashboard shell | Bottom tab bar (5 items) + drawer | Collapsed sidebar (icons) + content | Expanded sidebar (240 px) + content + right panel |
| Item list view | One card per row | Two cards per row | Three to four cards per row (grid) |
| Item grid view | Disabled (use list) | 3 columns | 4–6 columns |
| Item compact view | Available | 2 columns | 3 columns |
| Mind-map view | Disabled (notice + link to list) | Available, pinch to zoom | Full canvas |
| Share viewer | Single column | Two column | Three column with TOC |
| Onboarding | Full-screen sheet | Centered card | Centered card 720 px max |
| Billing | Stacked plans | Two-column comparison | Four-column comparison |
| Settings | Stacked sections | Stacked sections | Sidebar nav + content |
| Command palette | Full-screen modal | Centered modal 640 px | Centered modal 720 px |

## 3. Touch vs. pointer

- `< md` AND `pointer: coarse` → **mobile mode**: bottom tab bar, larger tap targets (44×44 min), drag handles visible on press.
- `≥ md` AND `pointer: fine` → **desktop mode**: sidebar, hover states, keyboard hints.
- `lg` with `pointer: coarse` (iPad) → **tablet mode**: sidebar collapsed by default, drag-and-drop with long-press.

Stored as `useDeviceMode()` hook returning `'mobile' | 'tablet' | 'desktop'`.

## 4. Density

| Mode | Row height | Padding | Font scale |
|---|---|---|---|
| Comfortable (default desktop) | 56 px | 16 px | 1.0 |
| Cozy (default tablet) | 48 px | 12 px | 0.95 |
| Compact (opt-in) | 40 px | 8 px | 0.9 |
| Mobile | 64 px | 16 px | 1.0 |

Density override per-user in account settings; persists in `accounts.preferences.density`.

## 5. Print

Print stylesheet (`16-print-stylesheet.md`) ignores breakpoints; uses A4-portrait baseline. No responsive considerations.

## 6. Locked rules

1. Only the 6 named breakpoints. No `min-width: 900px` etc.
2. Mobile-first CSS. Default styles target `xs`; larger breakpoints layer on.
3. Every new view MUST specify behavior at xs, md, lg in this file's table before ship.
4. Bottom tab bar exists ONLY on `< md`. Above `md`, sidebar replaces it.
5. Mind-map view is hidden on `< md` (UX bypass: link "Open on desktop").
