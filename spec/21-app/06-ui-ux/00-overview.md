# 00 — UI/UX Folder Overview

> **Purpose.** Define the **design system and interaction language** used by every surface (web app, marketing, share viewer, extension popup, new-tab). Tokens, components, motion, accessibility, copy, and density rules all live here. Pages and screens live in `05-web-app/`; this folder is the *vocabulary they compose with*.

---

## 1. Responsibilities

1. **Design tokens.** Colour palette (HSL only), typography ramp, spacing scale, radius scale, shadow scale, z-index scale, motion durations and easings.
2. **Theming.** Light/dark mapping, semantic token names (`--background`, `--foreground`, `--primary`, etc.), per-Org branding overrides for Team plan.
3. **Component library.** Every shadcn-based primitive plus product-level composites: button, input, dialog, sheet, popover, command, toast, table, item-card, share-banner.
4. **Layout & grid.** Page grid, sidebar widths, content max-widths, breakpoint table.
5. **Iconography & illustration.** Icon set, sizes, stroke weights; illustration usage rules.
6. **Motion.** Duration, easing, reduced-motion fallback, transition budget per route.
7. **Input.** Keyboard shortcuts, drag-and-drop affordances, form patterns, validation states.
8. **Feedback.** Toasts, loading skeletons, empty/error states.
9. **Navigation patterns.** Sidebar collapse, breadcrumbs, command palette invocation, tab focus order.
10. **Copy.** Voice & tone, microcopy strings catalogue, error message phrasing.
11. **Density.** Comfortable / compact toggles per view.
12. **Accessibility.** WCAG 2.2 AA target, contrast ratios, focus rings, ARIA usage rules.
13. **Print stylesheet, favicon pipeline, breakpoints.**
14. **Wireframes** (sub-folder) — low-fidelity reference layouts for the highest-traffic screens.

---

## 2. File-by-file behaviour

| File | Owns |
|---|---|
| `01-design-tokens.md` | All token definitions in HSL; semantic mapping; never raw colours in components. |
| `02-theming.md` | Light/dark switch logic, Org-level brand overrides. |
| `03-component-library.md` | Inventory of every primitive + composite, with API and variants. |
| `04-layout-grid.md` | Grid system, container widths, sidebar widths, gutters. |
| `05-iconography.md` | Icon set choice, sizing, stroke, semantic icon usage. |
| `06-illustration.md` | Empty-state and onboarding illustration rules. |
| `07-motion.md` | Duration/easing tokens; reduced-motion fallback; per-component motion budget. |
| `08-keyboard-input.md` | Global chord table; conflict resolution; focus-trap rules in modals. |
| `09-drag-and-drop.md` | DnD affordances, drop zones, keyboard equivalent, accessibility. |
| `10-forms.md` | Field grid, inline validation, error placement, submit-state model. |
| `11-feedback.md` | Toasts (sonner), inline alerts, progress indicators, success/error semantics. |
| `12-empty-error-loading.md` | Required state for every list/detail screen: empty, loading, error, partial. |
| `13-navigation-patterns.md` | Sidebar, breadcrumbs, tabs, command palette invocation, back-nav rules. |
| `14-copy-voice.md` | Voice principles, tone shifts per surface (marketing vs in-app vs error). |
| `15-data-density.md` | Comfortable vs compact mode and which views support each. |
| `16-print-stylesheet.md` | What renders on print; what hides. |
| `17-copy-strings.md` | Catalogue of all microcopy strings with keys for i18n later. |
| `18-favicon-pipeline.md` | Per-Item favicon fetch, fallback, caching, storage path. |
| `19-breakpoints.md` | Breakpoint table; mobile-first thresholds. |
| `20-accessibility-wcag.md` | WCAG 2.2 AA acceptance criteria per component class. |
| `wireframes/` | Low-fi references for dashboard, popup, share viewer, onboarding, billing. |

---

## 3. Tasks performed by this folder

- **Lock the visual vocabulary** so screens cannot drift.
- **Enforce HSL-only tokens** (no raw hex in components).
- **Provide the keyboard chord table** that the extension and web app both honour.
- **Provide the empty/error/loading contract** every page must satisfy.
- **Be the input** to `05-web-app/02-shell.md` (shell uses these tokens) and `04-extension/04-popup.md` (popup uses the same components).

---

## 4. What this folder is NOT

- **Not pages.** Page composition is in `05-web-app/`.
- **Not features.** Feature behaviour is in `07-features/`.
- **Not implementation.** Tailwind config, CSS variables, and shadcn install are implementation artefacts (deferred per spec-only mode).

---

## 5. Cross-references

- Pages composing these primitives: `05-web-app/**`.
- Extension surfaces composing these primitives: `04-extension/04-popup.md`, `05-new-tab.md`.
- Pricing surface using copy + tokens: `10-licensing-billing/01-plans-matrix.md` rendered in `05-web-app/13-marketing-site.md`.
- Accessibility acceptance criteria: `20-roadmap/06-definition-of-done.md` §a11y.
