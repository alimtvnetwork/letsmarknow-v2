# 05 — Web App

`https://app.letsmarknow.com` (the authenticated web client) and `https://letsmarknow.com` (marketing + share viewer).

The web app mirrors the extension's dashboard but adds Account, Billing, Org admin, Member management, Trash, Activity, and Onboarding. It is the **only** surface for billing actions.

## Reading order

1. `01-routes.md` — every route, auth requirement, and redirect rule.
2. `02-shell.md` — top-level app shell (left rail, sidebar, header, footer, command palette).
3. `03-dashboard.md` — Space/Collection/Group/Item rendering (shares 80% with new-tab in extension).
4. `04-onboarding.md` — first-run experience.
5. `05-account-settings.md` — profile, security, sessions, MFA, danger zone.
6. `06-org-settings.md` — Org profile, theme, default Space, danger zone, ownership transfer.
7. `07-member-management.md` — invite/remove/role-change UI.
8. `08-billing-page.md` — plans, seats, invoices, lifetime redemption, portal entry.
9. `09-trash.md` — soft-deleted entities review/restore/purge.
10. `10-activity-feed.md` — History Events stream + filters.
11. `11-import-export-ui.md` — file pickers, progress UI, error review.
12. `12-share-management.md` — list/edit/revoke shares per entity.
13. `13-marketing-site.md` — `letsmarknow.com` (home, pricing, docs, blog, changelog).
14. `14-share-viewer.md` — `letsmarknow.com/t/{slug}` reader experience.
15. `15-pwa.md` — installable web-app manifest, offline shell, push.
16. `16-seo.md` — meta, sitemap, OG, schema.org, robots.

## Files

| File | Purpose |
|---|---|
| `01-routes.md` | URL map |
| `02-shell.md` | App chrome |
| `03-dashboard.md` | Core browsing UI |
| `04-onboarding.md` | First-run flow |
| `05-account-settings.md` | /me/* pages |
| `06-org-settings.md` | /org/:id/settings |
| `07-member-management.md` | /org/:id/members |
| `08-billing-page.md` | /org/:id/billing |
| `09-trash.md` | /org/:id/trash |
| `10-activity-feed.md` | /org/:id/activity |
| `11-import-export-ui.md` | /org/:id/import + /export |
| `12-share-management.md` | /shares dashboards |
| `13-marketing-site.md` | letsmarknow.com |
| `14-share-viewer.md` | /t/{slug} |
| `15-pwa.md` | PWA shell |
| `16-seo.md` | SEO conventions |

## Locked rules

- **Stack:** React 18, Vite 5, TypeScript 5, Tailwind v3, semantic design tokens (HSL only).
- **Routing:** TanStack Router (file-based, type-safe).
- **State:** TanStack Query for server cache; Zustand for ephemeral UI; URL is the source of truth for view state (selected Collection, search query, view mode).
- **No SSR for `app.*`** — fully CSR SPA. SSR only on `letsmarknow.com` (marketing + share viewer) for SEO + social previews.
- **No client-side feature flags.** Entitlements drive all gating, decoded from JWT or `/v1/me/entitlements`.
- **Shared component library** with extension (in `packages/ui/`) so popup and dashboard look identical.
- **All forms** use `react-hook-form` + `zod`.
- **All async UI** has explicit loading, empty, and error states. No bare spinners.
