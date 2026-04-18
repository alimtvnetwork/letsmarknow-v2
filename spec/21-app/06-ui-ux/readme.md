# 06 — UI / UX

The cross-surface design system, interaction grammar, and visual language. Anything visible, clickable, or animated should trace back to here.

This folder is the **single source of truth** for both the extension (`04-extension/`) and the web app (`05-web-app/`). When the two surfaces disagree, this folder wins; the surface-specific files document the *delta*.

## Reading order

1. `01-design-tokens.md` — colors (HSL), typography, spacing, radius, shadow, motion.
2. `02-theming.md` — light/dark/system, org accent, custom branding for shared views.
3. `03-component-library.md` — shadcn baseline + custom components inventory.
4. `04-layout-grid.md` — breakpoints, container widths, gutters, density modes.
5. `05-iconography.md` — icon set, sizing, semantic mapping.
6. `06-illustration.md` — empty states, error pages, onboarding art style.
7. `07-motion.md` — animation tokens, easings, durations, reduced-motion rules.
8. `08-keyboard-input.md` — global keymap, focus order, key conflicts.
9. `09-drag-and-drop.md` — DnD grammar (cards, sidebar tree, file uploads).
10. `10-forms.md` — form patterns, validation, autosave, dirty-state UX.
11. `11-feedback.md` — toasts, banners, modals, confirms, error surfaces.
12. `12-empty-error-loading.md` — three-state guarantee for every async surface.
13. `13-navigation-patterns.md` — breadcrumbs, tabs, command palette, back-stack.
14. `14-copy-voice.md` — tone, terminology, microcopy patterns, error wording.
15. `15-data-density.md` — Comfortable / Cozy / Compact density across surfaces.
16. `16-print-stylesheet.md` — printable Collection / Item / Share viewer.

## Files

| File | Purpose |
|---|---|
| `01-design-tokens.md` | All design primitives |
| `02-theming.md` | Theme system |
| `03-component-library.md` | Component inventory + variants |
| `04-layout-grid.md` | Responsive scaffolding |
| `05-iconography.md` | Icons |
| `06-illustration.md` | Hand-drawn assets |
| `07-motion.md` | Animation system |
| `08-keyboard-input.md` | Keyboard UX |
| `09-drag-and-drop.md` | DnD UX |
| `10-forms.md` | Form UX |
| `11-feedback.md` | Toasts/banners/modals |
| `12-empty-error-loading.md` | Three-state guarantee |
| `13-navigation-patterns.md` | Nav primitives |
| `14-copy-voice.md` | Voice & tone |
| `15-data-density.md` | Density modes |
| `16-print-stylesheet.md` | Print CSS |

## Locked rules

- **HSL only.** Every color in tokens is `hsl(H S% L%)`. No hex in components. No raw RGB in CSS.
- **Tokens, not values.** Components reference `--primary`, never `#3b82f6`.
- **shadcn + Radix** as the primitive base. Custom variants extend via `cva`. Never fork a primitive into the codebase.
- **Tailwind v3** utility classes only; no styled-components, no CSS modules, no inline styles (except dynamic `transform`/`width` in animation).
- **One H1 per page.** Heading levels never skip.
- **Motion respects `prefers-reduced-motion`.** Animations under 200 ms pass through; longer ones become instant or fades.
- **Touch target ≥ 44×44 px** on mobile; ≥ 32×32 with 8 px hit-slop on desktop.
- **Focus visible always.** Outline 2 px, 2 px offset, in `--ring`.
- **No emoji as icons** in production UI; emoji are user-content only (Space/Collection emoji-as-icon is allowed because it is *user-chosen content*).
- **No hover-only affordances.** Every hover action also reachable via keyboard or right-click menu.
- **No color-only signaling.** Status uses color *plus* icon *plus* text.
