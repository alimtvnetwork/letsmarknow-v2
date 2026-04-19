# 00 — Web App Folder Overview

> **Purpose.** Define every page, route, layout, and screen-level behaviour that runs on `app.letsmarknow.com` (authenticated SPA) and `letsmarknow.com` (marketing + public share viewer). UI primitives, design tokens, and component-level rules live in `06-ui-ux/`; this folder owns the **screens**.

---

## 1. Responsibilities

1. **Route map.** Every URL the SPA serves, what it renders, what data it loads, who can see it.
2. **Layout shell.** Top bar, side nav, breadcrumbs, command-palette mount point, toast region, modal stack rules.
3. **Per-page specs.** Dashboard, onboarding, account settings, org settings, member management, billing, trash, activity feed, import/export UI, share management, share viewer.
4. **Marketing site.** Public pages on the apex domain (home, pricing, changelog, docs entry, legal).
5. **PWA behaviour.** Installability, offline shell, service-worker scope, update prompt.
6. **SEO.** Per-route metadata, canonical, OpenGraph, JSON-LD, sitemap.

---

## 2. File-by-file behaviour

| File | Owns |
|---|---|
| `01-routes.md` | Complete route table for app + marketing + share viewer; auth requirement; data prefetch. |
| `02-shell.md` | App shell: top bar, sidebar, breadcrumb, command palette mount, toast region, modal stack. |
| `03-dashboard.md` | Default authenticated landing: pinned, recent, quick capture, suggestions. |
| `04-onboarding.md` | First-run flow: pick plan, install extension, import bookmarks, create first Space. |
| `05-account-settings.md` | Profile, password, MFA, sessions, notifications, language, danger zone. |
| `06-org-settings.md` | Org profile, branding, default permissions, custom domain entry point. |
| `07-member-management.md` | Invite, role assignment, deactivate, transfer ownership, audit hooks. |
| `08-billing-page.md` | Plan, seat count, invoices, payment method, dunning state surfacing. |
| `09-trash.md` | Soft-deleted items per Org, restore-to-original-path, 30-day purge countdown. |
| `10-activity-feed.md` | Stream of `history_events` filtered by scope; jump-to-source from each entry. |
| `11-import-export-ui.md` | Wizard surface for the importer/exporter pipelines defined in `11-import-export/`. |
| `12-share-management.md` | List, edit, revoke shares; analytics summary per share. |
| `13-marketing-site.md` | Apex-domain pages: home, pricing, changelog, docs entry, legal. |
| `14-share-viewer.md` | Public `/t/{slug}` reader: password gate, unlock cookie, view-mode picker. |
| `15-pwa.md` | Manifest, service worker scope, install prompt, update toast. |
| `16-seo.md` | Per-route titles, descriptions, canonical, OG, sitemap, robots. |

---

## 3. Tasks performed by this folder

- **Compose primitives into pages.** Components from `06-ui-ux/` are arranged into the screens listed above.
- **Bind routes to data.** Each route declares which API calls run on enter, which on focus return, which on visibility change.
- **Define layout invariants.** Sidebar width, top-bar height, breadcrumb truncation, modal stacking order.
- **Drive SEO and PWA behaviour** for both authenticated and public surfaces.
- **Front the share viewer** that anonymous users hit via `letsmarknow.com/t/{slug}`.

---

## 4. What this folder is NOT

- **Not the design system.** Tokens, components, motion, accessibility live in `06-ui-ux/`.
- **Not the API.** Endpoint contracts live in `03-api-endpoints/`.
- **Not the extension.** Anything inside Chrome lives in `04-extension/`.
- **Not features-as-capabilities.** "Save a tab", "tag an item", "search" are in `07-features/`; this folder *places* those features into screens.

---

## 5. Cross-references

- Component primitives: `06-ui-ux/03-component-library.md`.
- Layout grid + breakpoints: `06-ui-ux/04-layout-grid.md`, `06-ui-ux/19-breakpoints.md`.
- Route auth derived from session model: `09-auth-accounts/06-sessions.md`.
- Share viewer security model: `19-security-privacy/05-share-link-security.md`.
- Marketing → pricing source of truth: `10-licensing-billing/01-plans-matrix.md` (W-3 lock).
