# 05 — Web App

`https://app.letsmarknow.com` (the authenticated web client) and `https://letsmarknow.com` (marketing + share viewer).

The web app mirrors the extension's dashboard but adds Account, Billing, Org admin, Member management, Trash, Activity, and Onboarding. It is the **only** surface for billing actions.

## Reading order

1. `routes.md` — every route, auth requirement, and redirect rule.
2. `shell.md` — top-level app shell (left rail, sidebar, header, footer, command palette).
3. `dashboard.md` — Space/Collection/Group/Item rendering (shares 80% with new-tab in extension).
4. `onboarding.md` — first-run experience.
5. `account-settings.md` — profile, security, sessions, MFA, danger zone.
6. `org-settings.md` — Org profile, theme, default Space, danger zone, ownership transfer.
7. `member-management.md` — invite/remove/role-change UI.
8. `billing-page.md` — plans, seats, invoices, lifetime redemption, portal entry.
9. `trash.md` — soft-deleted entities review/restore/purge.
10. `activity-feed.md` — History Events stream + filters.
11. `import-export-ui.md` — file pickers, progress UI, error review.
12. `share-management.md` — list/edit/revoke shares per entity.
13. `marketing-site.md` — `letsmarknow.com` (home, pricing, docs, blog, changelog).
14. `share-viewer.md` — `letsmarknow.com/t/{slug}` reader experience.
15. `pwa.md` — installable web-app manifest, offline shell, push.
16. `seo.md` — meta, sitemap, OG, schema.org, robots.

## Files

| File | Purpose |
|---|---|
| `routes.md` | URL map |
| `shell.md` | App chrome |
| `dashboard.md` | Core browsing UI |
| `onboarding.md` | First-run flow |
| `account-settings.md` | /me/* pages |
| `org-settings.md` | /org/:id/settings |
| `member-management.md` | /org/:id/members |
| `billing-page.md` | /org/:id/billing |
| `trash.md` | /org/:id/trash |
| `activity-feed.md` | /org/:id/activity |
| `import-export-ui.md` | /org/:id/import + /export |
| `share-management.md` | /shares dashboards |
| `marketing-site.md` | letsmarknow.com |
| `share-viewer.md` | /t/{slug} |
| `pwa.md` | PWA shell |
| `seo.md` | SEO conventions |

## Locked rules

- **Stack:** React 18, Vite 5, TypeScript 5, Tailwind v3, semantic design tokens (HSL only).
- **Routing:** TanStack Router (file-based, type-safe).
- **State:** TanStack Query for server cache; Zustand for ephemeral UI; URL is the source of truth for view state (selected Collection, search query, view mode).
- **No SSR for `app.*`** — fully CSR SPA. SSR only on `letsmarknow.com` (marketing + share viewer) for SEO + social previews.
- **No client-side feature flags.** Entitlements drive all gating, decoded from JWT or `/v1/me/entitlements`.
- **Shared component library** with extension (in `packages/ui/`) so popup and dashboard look identical.
- **All forms** use `react-hook-form` + `zod`.
- **All async UI** has explicit loading, empty, and error states. No bare spinners.
