# Routes

Complete URL map for `app.letsmarknow.com` and `letsmarknow.com`.

---

## 1. Conventions

- All app routes under `app.letsmarknow.com`.
- Marketing/docs/share-viewer under `letsmarknow.com` (apex).
- Active Org slug is **NOT** in URL by default (server picks last-used). User can pin a route to a specific Org via `?org=<slug>` query param.
- Trailing slashes normalized off.
- 404 page: branded, with search bar.
- 410 page (revoked share): branded, with "create your own" CTA.

## 2. `app.letsmarknow.com` routes

| Path | Auth | Component | Notes |
|---|---|---|---|
| `/` | required | redirect | → `/dashboard` |
| `/dashboard` | required | `Dashboard` | active Org, default Space, no specific Collection |
| `/s/:space_slug` | required | `Dashboard` | Space overview (column mode) |
| `/c/:collection_slug` | required | `Dashboard` | Single Collection (default view mode per Collection) |
| `/c/:collection_slug/g/:group_slug` | required | `Dashboard` | Collection focused on a Group |
| `/i/:item_id` | required | `ItemDetail` modal over Dashboard | deep link to single Item |
| `/search` | required | `SearchResults` | `?q=` driven |
| `/trash` | required | `Trash` | per active Org |
| `/activity` | required | `Activity` | per active Org |
| `/me` | required | `AccountSettings` | redirect to `/me/profile` |
| `/me/profile` | required | profile form |  |
| `/me/security` | required | password, MFA, sessions |  |
| `/me/notifications` | required | email/push prefs |  |
| `/me/connected` | required | OAuth providers connected |  |
| `/me/danger` | required | delete account |  |
| `/org/:id/settings` | required + Owner/Admin | `OrgSettings` |  |
| `/org/:id/members` | required | `Members` | Owners/Admins can mutate; others read-only |
| `/org/:id/billing` | required + Owner/Billing | `Billing` |  |
| `/org/:id/billing/success` | required | post-checkout return | reads Stripe `session_id` |
| `/org/:id/billing/portal-return` | required | post-portal return | re-fetches state |
| `/org/:id/import` | required + Editor+ | `Import` |  |
| `/org/:id/export` | required + Editor+ | `Export` |  |
| `/org/:id/shares` | required | `ShareManagement` | all shares in this Org |
| `/org/new` | required | `CreateOrg` | wizard |
| `/login` | none | `Login` | redirects to `/` if signed in |
| `/signup` | none | `Signup` | accepts `?invite_token` |
| `/auth/callback/:provider` | none | OAuth handler |  |
| `/auth/magic` | none | magic-link consume |  |
| `/auth/reset` | none | password-reset form (with token) |  |
| `/invite/:token` | optional | `InviteAccept` | post-accept redirects to active Org |
| `/onboarding` | required | `Onboarding` | first-run |
| `/changelog` | none | redirect to letsmarknow.com/changelog |  |
| `/help` | none | redirect to letsmarknow.com/docs |  |
| `*` | — | `NotFound` |  |

## 3. `letsmarknow.com` routes (SSR)

| Path | Cache | Notes |
|---|---|---|
| `/` | edge 1 h | Marketing home |
| `/pricing` | edge 1 h | Pricing tables |
| `/features/:slug` | edge 1 h | Per-feature landing pages |
| `/blog` | edge 5 min | Blog index |
| `/blog/:slug` | edge 5 min | Post |
| `/changelog` | edge 5 min | Versioned changelog |
| `/docs/*` | edge 5 min | MDX docs |
| `/legal/terms` | edge 1 h |  |
| `/legal/privacy` | edge 1 h |  |
| `/legal/dpa` | edge 1 h |  |
| `/security` | edge 1 h |  |
| `/login` | none | Same as app `/login` (redirect to app subdomain) |
| `/signup` | none | Same |
| `/welcome` | none | Post-extension-install landing |
| `/t/:slug` | none | Public Share Viewer (server-rendered for OG; auth gates content client-side) |
| `/t/:slug/i/:item_id` | none | Item-focused share view |
| `*` | — | 404 |

## 4. Redirects

| From | To | Why |
|---|---|---|
| `app.letsmarknow.com/login?from=ext` | sets `?next=/onboarding-ext` after sign-in | extension flow |
| any auth-required page when not signed in | `/login?next=<original>` | preserve deep link |
| `/c/:slug` when no active Org chosen | resolves Org from cookie / sets default | seamless |
| `/org/:id/*` when caller not member | 404 (no enumeration) |  |
| `letsmarknow.com/app` | `app.letsmarknow.com` | convenience |
| `letsmarknow.com/login` | `app.letsmarknow.com/login` |  |
| `app.letsmarknow.com/welcome` | `letsmarknow.com/welcome` | marketing handles welcome |

## 5. URL state

Search/filter state lives in the URL so that:
- Back/forward works
- Shareable links to filtered views
- Deep linking from omnibox / extension messages

Reserved query params:
- `q` — search query
- `tag` — repeatable tag filter
- `view` — `grid|list|compact|column` override
- `org` — pin Org for this navigation
- `next` — post-auth redirect target
- `from` — analytics source (`ext`, `marketing`, `email`)

## 6. Custom domains (Team plan)

Owners can set a CNAME like `bookmarks.example.com` → `app.letsmarknow.com`. Routes work identically; SSL provisioned automatically. Share URLs become `bookmarks.example.com/t/{slug}` when Custom Share Domain entitlement is active.
