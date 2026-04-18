# Lets Mark Now — Master Specification (`21-app`)

> **Codename:** `21-app`
> **Product name:** Lets Mark Now
> **Domain:** `letsmarknow.com`
> **Public share URL pattern:** `letsmarknow.com/t/{slug}`
> **Primary surface:** Chrome Extension (MV3) — New Tab override **+** toolbar popup
> **Future surfaces:** Edge, Brave, Arc, Opera (Chromium parity), then Firefox
> **Inspiration:** [Toby](https://www.gettoby.com) (hierarchy, sharing, collaboration) + [Tab Extend](https://tabextend.com) (typography, column layout, group-in-group)
> **Goal:** Build the most powerful, beautiful, AI-era replacement for Toby and Tab Extend — fixing every flaw in both, with no artificial limits in paid tiers.

---

## How to read this spec

This spec is written so **any AI implementer can build the product blindly**. Every folder under `spec/21-app/` is a self-contained module. Read in order:

1. `00-overview/` — vision, glossary, personas, competitive analysis
2. `01-information-architecture/` — the data hierarchy (Workspace → Space → Collection → Group → Item)
3. `02-data-model/` — entity contracts (field-level, no SQL — DB is built separately)
4. `03-api-endpoints/` — REST/JSON endpoint contracts (request, response, errors, auth) — **carefully crafted**
5. `04-extension/` — Chrome MV3 extension (manifest, surfaces, permissions, background, popup, new-tab, content scripts)
6. `05-web-app/` — `letsmarknow.com` marketing site + share viewer (`/t/{slug}`) + dashboard
7. `06-ui-ux/` — design system, typography, color, layout, animation, visualization modes
8. `07-features/` — every feature spec, one file per feature (search, undo/redo, save-session, jump-to, drag-drop, notes, tags, etc.)
9. `08-sharing-collab/` — public links, password, expiry, invite-only roles, real-time collab
10. `09-auth-accounts/` — auth flows, sessions, SSO (Team plan)
11. `10-licensing-billing/` — Free / Pro / Team / Lifetime tiers, license manager, payments, discounts, support
12. `11-shortcuts/` — full keyboard shortcut map, command palette (Ctrl+K)
13. `12-history-undo/` — action history, undo/redo semantics, conflict resolution
14. `11-import-export/` — Toby/Tab Extend/Chrome bookmarks/JSON/CSV import + export
15. `14-search/` — workspace search, item search, fuzzy, filters, jump-to
16. `15-visualization/` — list, grid, compact, mind-map, Tab Extend column mode
17. `16-notifications-updates/` — in-app updates feed, app updater, release channel
18. `17-admin-org/` — organization settings, members, roles, audit log
19. `18-analytics-telemetry/` — opt-in analytics, error reporting
20. `19-security-privacy/` — threat model, data handling, GDPR
21. `20-roadmap/` — phased delivery (MVP → v1 → v2 → future)

Each subfolder contains its own `README.md` (overview) plus one `.md` per concrete feature/screen/endpoint group.

---

## Confirmed product decisions (locked)

| Decision | Value |
|---|---|
| Product name | Lets Mark Now |
| Marketing domain | `letsmarknow.com` |
| Public share URLs | `letsmarknow.com/t/{slug}` (custom slugs allowed in Pro+) |
| Primary platform | Chrome MV3 |
| Extension surface | New Tab override + toolbar popup (both) |
| Backend | API endpoints only in this spec (DB is built separately) |
| Pricing model | **Free + Pro + Team + Lifetime** (full ladder) |
| Sharing | Public link + password + expiry + invite-only with roles |
| Visualization modes (v1) | List + Grid + Compact + Mind-map + Tab Extend column mode |
| Typography | Apple system fonts + Ubuntu (Tab Extend stack) |
| Theme | Dark default, light optional, accent themes (Pink default à la Toby) |
| Limits in paid tiers | **None** — unlimited workspaces, spaces, collections, groups, items |
| History | Every mutation goes to history; Ctrl+Z / Ctrl+Y must always work |
| Save Session | Save all open tabs in current window/all-windows into a Collection |
| Jump-to-tab | If item is currently open in any window, focus it; else open new tab |

---

## Hierarchy at a glance

```
Account (User)
└── Organization (a.k.a. Workspace bubble — PE / AU / XL avatars on left rail)
    ├── Members (with roles: Owner, Admin, Editor, Viewer)
    ├── Subscription (Free / Pro / Team / Lifetime)
    └── Space (e.g. "My Collections", "Evatix", "Personal", "Gaming PC")
        ├── Sharing settings (private / public link / password / expiry / invite-only)
        └── Collection (e.g. "Marketing Improvements", "Quick Tools")
            ├── Color, icon, tags, notes, description, star
            └── Group (sub-group inside collection — Tab Extend style)
                └── Item (bookmark / saved tab)
                    ├── url, title, favicon, description, tags, notes
                    └── created_at, updated_at, last_opened_at, position
```

> **Naming reconciliation:** Toby calls them "Collections", Tab Extend calls them "Groups". We use **Collection** as the top container inside a Space, and **Group** as the optional sub-container inside a Collection. Both can be shared individually.

---

## Folder structure (to be created)

```
spec/21-app/
├── README.md                              ← this file (master index)
├── 00-overview/
│   ├── README.md
│   ├── vision.md
│   ├── glossary.md
│   ├── personas.md
│   └── competitive-analysis.md            (Toby vs Tab Extend vs us)
├── 01-information-architecture/
│   ├── README.md
│   └── hierarchy.md
├── 02-data-model/
│   ├── README.md
│   ├── organization.md
│   ├── space.md
│   ├── collection.md
│   ├── group.md
│   ├── item.md
│   ├── tag.md
│   ├── share.md
│   ├── member.md
│   ├── history-event.md
│   └── license.md
├── 03-api-endpoints/
│   ├── README.md
│   ├── conventions.md                     (auth headers, errors, pagination, idempotency)
│   ├── auth.md
│   ├── organizations.md
│   ├── spaces.md
│   ├── collections.md
│   ├── groups.md
│   ├── items.md
│   ├── tags.md
│   ├── shares.md
│   ├── members-invites.md
│   ├── sessions-save.md                   (Save Session to Collection)
│   ├── search.md
│   ├── history.md                         (undo/redo backend support)
│   ├── import-export.md
│   ├── licenses.md
│   ├── billing-webhooks.md
│   └── public-share-viewer.md             (unauthenticated /t/{slug} endpoints)
├── 04-extension/
│   ├── README.md
│   ├── manifest.md                        (MV3 manifest fields, permissions justified)
│   ├── new-tab-override.md
│   ├── toolbar-popup.md
│   ├── background-service-worker.md
│   ├── content-scripts.md                 (if any)
│   ├── tab-tracking.md                    (open tabs sidebar data source)
│   ├── window-management.md               (Window 1/2/3 grouping)
│   ├── drag-drop-from-tabs.md
│   ├── save-session.md
│   ├── jump-to-tab.md
│   ├── offline-cache.md                   (IndexedDB local mirror)
│   ├── sync-engine.md                     (push/pull, conflict resolution)
│   └── packaging-distribution.md          (zip, store listing, updates)
├── 05-web-app/
│   ├── README.md
│   ├── routes.md
│   ├── marketing-site.md                  (letsmarknow.com)
│   ├── pricing-page.md
│   ├── dashboard.md                       (full app on web, mirrors extension)
│   ├── share-viewer.md                    (/t/{slug} public viewer)
│   ├── account-settings.md
│   ├── billing-portal.md
│   └── support-portal.md
├── 06-ui-ux/
│   ├── README.md
│   ├── design-tokens.md                   (color, spacing, radius, shadow)
│   ├── typography.md                      (Apple system + Ubuntu stack)
│   ├── theming.md                         (Pink default, dark/light, accent themes)
│   ├── components.md                      (button, card, modal, popover, toast, etc.)
│   ├── layout-shell.md                    (left rail + sidebar + main + open tabs panel)
│   ├── workspace-bubbles.md               (left avatar rail UX)
│   ├── space-sidebar.md
│   ├── collection-card.md
│   ├── group-card.md
│   ├── item-card.md
│   ├── empty-states.md
│   ├── animation.md
│   └── accessibility.md
├── 07-features/
│   ├── README.md
│   ├── add-collection.md
│   ├── add-group.md
│   ├── add-item-hover-button.md           (the colorful + button on hover)
│   ├── drag-drop.md
│   ├── save-session-to-collection.md
│   ├── jump-to-tab.md
│   ├── duplicate.md
│   ├── move.md
│   ├── tagging.md
│   ├── color-coding.md
│   ├── star-favorite.md
│   ├── notes.md
│   ├── descriptions.md
│   ├── expand-collapse.md
│   ├── sort.md
│   ├── view-modes.md
│   ├── open-all-in-group.md
│   ├── copy-share-link.md
│   ├── edit-title-inline.md
│   ├── delete-with-undo.md
│   └── bulk-select.md
├── 08-sharing-collab/
│   ├── README.md
│   ├── share-link.md                      (public, custom slug Pro+)
│   ├── password-protection.md
│   ├── expiry.md
│   ├── invite-only.md
│   ├── permissions-matrix.md
│   ├── realtime-collab.md                 (presence, live updates)
│   └── share-analytics.md                 (views, opens — Pro+)
├── 09-auth-accounts/
│   ├── README.md
│   ├── signup-login.md
│   ├── magic-link.md
│   ├── oauth-google-apple-github.md
│   ├── sso-saml.md                        (Team plan)
│   ├── sessions-devices.md
│   └── password-reset.md
├── 10-licensing-billing/
│   ├── README.md
│   ├── plans-matrix.md                    (Free / Pro / Team / Lifetime feature matrix)
│   ├── pricing.md
│   ├── license-manager.md                 (key validation, device limits)
│   ├── payments-integration.md            (Stripe/Paddle abstraction)
│   ├── discounts-coupons.md
│   ├── trials.md
│   ├── invoices-receipts.md
│   ├── seat-management.md                 (Team plan)
│   └── support-system.md                  (ticketing, contact, SLA)
├── 11-shortcuts/
│   ├── README.md
│   ├── global-shortcuts.md
│   ├── command-palette.md                 (Ctrl+K)
│   └── workspace-switching.md             (Ctrl+Up / Ctrl+Down)
├── 12-history-undo/
│   ├── README.md
│   ├── event-log.md
│   ├── undo-redo.md
│   └── conflict-resolution.md
├── 11-import-export/
│   ├── README.md
│   ├── import-toby.md
│   ├── import-tabextend.md
│   ├── import-chrome-bookmarks.md
│   ├── import-json.md
│   ├── export-json.md
│   ├── export-html.md
│   └── export-csv.md
├── 14-search/
│   ├── README.md
│   ├── global-search.md
│   ├── item-search.md
│   ├── workspace-search.md
│   ├── filters.md
│   └── jump-to-result.md
├── 15-visualization/
│   ├── README.md
│   ├── list-view.md
│   ├── grid-view.md
│   ├── compact-view.md
│   ├── mindmap-view.md                    (bubble graph of workspaces/spaces)
│   ├── tabextend-column-view.md
│   └── resizable-sections.md
├── 16-notifications-updates/
│   ├── README.md
│   ├── in-app-updates-feed.md
│   ├── app-updater.md                     (extension auto-update + manual check)
│   └── release-channels.md                (stable / beta)
├── 17-admin-org/
│   ├── README.md
│   ├── organization-settings.md
│   ├── members-management.md
│   ├── roles.md
│   ├── audit-log.md
│   └── data-export-delete.md
├── 18-analytics-telemetry/
│   ├── README.md
│   ├── opt-in-analytics.md
│   └── error-reporting.md
├── 19-security-privacy/
│   ├── README.md
│   ├── threat-model.md
│   ├── data-handling.md
│   ├── encryption.md
│   ├── gdpr-ccpa.md
│   └── share-link-security.md
└── 20-roadmap/
    ├── README.md
    ├── phase-0-mvp.md
    ├── phase-1-v1.md
    ├── phase-2-collab.md
    ├── phase-3-mindmap-ai.md
    └── phase-4-cross-browser.md
```

---

## One-line summary per top-level folder

| Folder | What it specifies |
|---|---|
| **00-overview** | Why this exists, who it's for, what it beats and how. |
| **01-information-architecture** | The exact 5-level hierarchy, naming, parent/child rules, sharing scope per level. |
| **02-data-model** | Field-by-field entity contracts. No SQL — implementer designs the DB. |
| **03-api-endpoints** | Every REST endpoint with method, path, auth, request body, response body, error codes, idempotency, rate limits. |
| **04-extension** | Everything Chrome-MV3-specific: manifest, surfaces, tab/window APIs, sync engine, offline cache, packaging. |
| **05-web-app** | `letsmarknow.com` site: marketing, pricing, dashboard, public share viewer, billing, support. |
| **06-ui-ux** | Design system, tokens, typography (Apple+Ubuntu), components, animations, a11y. |
| **07-features** | One spec per user-visible feature. Atomic and composable. |
| **08-sharing-collab** | Public/password/expiry/invite-only links, roles, real-time presence. |
| **09-auth-accounts** | Sign up, login, OAuth, SSO (Team), sessions, password reset. |
| **10-licensing-billing** | Free/Pro/Team/Lifetime matrix, license manager, payments, discounts, support. |
| **11-shortcuts** | Full shortcut map and Ctrl+K command palette. |
| **12-history-undo** | Event log, undo/redo, multi-user conflict resolution. |
| **11-import-export** | All importers (Toby, Tab Extend, Chrome bookmarks, JSON) and exporters. |
| **14-search** | Fast fuzzy search across workspaces and items, with jump-to. |
| **15-visualization** | List / Grid / Compact / Mind-map / Tab Extend column modes + resizable panels. |
| **16-notifications-updates** | In-app updates feed and the app updater (versioning, channels). |
| **17-admin-org** | Org settings, members, roles, audit log, data export/delete. |
| **18-analytics-telemetry** | Opt-in product analytics and error reporting. |
| **19-security-privacy** | Threat model, encryption, GDPR/CCPA, share-link security. |
| **20-roadmap** | Phased delivery plan from MVP to cross-browser. |

---

## Things explicitly fixed vs Toby and Tab Extend

These problems from the references are **must-fix** and tracked across the spec:

1. **Tab Extend can't share groups** → we share at every level (Space, Collection, Group, even single Item).
2. **Tab Extend's search is slow & broken** → we ship instant fuzzy search with jump-to-result (`14-search/`).
3. **Tab Extend has no undo/redo** → every mutation is an event in history; Ctrl+Z always works (`12-history-undo/`).
4. **Tab Extend caps at 8 categories / 12-15 groups** → no caps in any paid tier; Free tier limits documented in `10-licensing-billing/plans-matrix.md`.
5. **Toby's free tier caps at 60 saved tabs** → we set a different free cap (TBD in plans matrix) and remove all paid caps.
6. **Toby has no per-item edit-mode for tags inline** → inline tag editor on every item card.
7. **Both lack a true "+" hover-add button** → spec'd in `07-features/add-item-hover-button.md`.
8. **Both lack mind-map / bubble visualization** → spec'd in `15-visualization/mindmap-view.md`.
9. **Both lack proper licensing/support infra** → `10-licensing-billing/` covers it end-to-end.
10. **Both lack a real app updater & release channel** → `16-notifications-updates/`.

---

## Open questions (to resolve during deep-dive)

These are flagged inline in the relevant folders and will be asked one folder at a time:

- Free-tier exact limits (workspaces / spaces / collections / items / shares).
- Custom-slug rules for `letsmarknow.com/t/{slug}` (length, charset, reservation, collisions).
- Mind-map interaction model (zoom, pan, edge creation, layout algorithm).
- Real-time collab transport (WebSocket vs SSE vs polling) — stays vendor-neutral in the API spec.
- Payments provider (Stripe vs Paddle) — abstracted behind `payments-integration.md`.
- SSO providers for Team plan (Google Workspace, Okta, Azure AD, generic SAML).
- Audit log retention by tier.
- Mobile companion app (out of scope for v1, noted in roadmap).

---

## Status

✅ **Outline + folder structure approved by user (this document).**
⏭️ **Next step:** Deep-dive folder by folder, in numeric order, starting with `00-overview/`.
On user's `go` for each folder, every `.md` inside is fully written.
