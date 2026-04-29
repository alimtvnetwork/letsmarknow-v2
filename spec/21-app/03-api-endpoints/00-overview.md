# 00 — API Endpoints Overview

> **Purpose.** A single, scannable index of every REST endpoint in the system, **grouped by HTTP method**. Use this file to discover *what exists*; open the per-domain file (column **Source**) for the full contract (request body, response, errors, rate-limit class, idempotency, examples).
>
> **Scope.** ~140 endpoints across 16 domain files. All endpoints are versioned under `/v1/`.
>
> **Read this with** `01-conventions.md` (auth headers, error envelope, pagination, idempotency, rate limits, ETag/concurrency). Every row below inherits those conventions.

---

## How to read this file

| Column | Meaning |
|---|---|
| **Method** | HTTP verb. Locked rule: `PATCH` for partial updates; `PUT` only for full-replace bodies (rare). |
| **Path** | Always under `/v1/`. `:name` = path param. |
| **Auth** | `none` (public), `bearer` (access JWT), `bearer+org` (also requires `X-Organization-Id`), `bearer+role` (also requires Org role), `share-cookie` (public viewer after unlock), `invite-token`, `webhook-sig`. |
| **Idem.** | `Y` = `Idempotency-Key` header **required**; `O` = optional (still honored if sent); `—` = N/A (read or replace-style). |
| **Purpose** | One-line behavior. See **Source** for full request/response. |
| **Source** | File where the contract is defined. |

**Rate-limit classes** (full table in `01-conventions.md` §8): `read` 1000/min, `write` 200/min, `bulk` 20/min, `auth` 30/5min/IP, `search` 120/min, `webhook` 10000/min.

---

## 1. GET — read endpoints

> Idempotent and safe by definition. Cacheable. Most return an `ETag` (entity's `updated_at`) and respect cursor pagination per `01-conventions.md` §5.

### 1.1 Auth & sessions

| Method | Path | Auth | Purpose | Source |
|---|---|---|---|---|
| GET | `/v1/auth/oauth/:provider/start` | none | Begin OAuth flow; redirects to provider with PKCE state. | `03-auth.md` |
| GET | `/v1/auth/oauth/:provider/callback` | none | Provider redirect target; exchanges code → issues tokens & sets refresh cookie. | `03-auth.md` |
| GET | `/v1/auth/sessions` | bearer | List my active devices/sessions (current device flagged). | `03-auth.md` |
| GET | `/v1/auth/verify` | verify-token | Consume an email-verification token (sets `email_verified_at`). | `03-auth.md` |
| GET | `/v1/auth/magic/callback` | magic-token (`?t=`) | Magic-link landing target — consumes single-use token, sets refresh cookie, 302 → app shell. (HTML/redirect counterpart of `POST /v1/auth/magic-link/consume`.) | `03-auth.md` |

### 1.2 Public share viewer (`/t/{slug}`)

| Method | Path | Auth | Purpose | Source |
|---|---|---|---|---|
| GET | `/v1/public/shares/:slug` | none / share-cookie | Resolve a share slug → metadata, mode (`public` / `password` / `invite`), gate state. | `02-public-share-viewer.md` |
| GET | `/v1/public/shares/:slug/contents` | share-cookie (if gated) | Fetch the items/groups/notes the share exposes. | `02-public-share-viewer.md` |
| GET | `/v1/public/shares/:slug/items` | share-cookie (if gated) | Paginated subset of items in the share (infinite scroll, embed widgets). | `02-public-share-viewer.md` |

### 1.3 Organizations & members

| Method | Path | Auth | Purpose | Source |
|---|---|---|---|---|
| GET | `/v1/organizations` | bearer | List Orgs the Account belongs to (Personal + invited). | `04-organizations.md` |
| GET | `/v1/organizations/:id` | bearer+org | Get a single Org (settings, plan summary, counts). | `04-organizations.md` |
| GET | `/v1/members` | bearer+org | List members of the active Org (filterable by role / status). | `11-members-invites.md` |
| GET | `/v1/members/:id` | bearer+org | Get one member's profile + role. | `11-members-invites.md` |

### 1.4 Spaces / Collections / Groups / Items (the CRUD ladder)

| Method | Path | Auth | Purpose | Source |
|---|---|---|---|---|
| GET | `/v1/spaces` | bearer+org | List Spaces in active Org (sidebar feed). | `05-spaces.md` |
| GET | `/v1/spaces/:id` | bearer+org | Get one Space + denormalized children stubs. | `05-spaces.md` |
| GET | `/v1/collections` | bearer+org | List Collections (filter by `space_id`). | `06-collections.md` |
| GET | `/v1/collections/:id` | bearer+org | Get one Collection (full notes, settings, child counts). | `06-collections.md` |
| GET | `/v1/groups` | bearer+org | List Groups (filter by `collection_id`). | `07-groups.md` |
| GET | `/v1/groups/:id` | bearer+org | Get one Group. | `07-groups.md` |
| GET | `/v1/items` | bearer+org | List Items (filters: `collection_id`, `group_id`, `tag`, `is_starred`, etc.). | `08-items.md` |
| GET | `/v1/items/:id` | bearer+org | Get one Item (full URL, favicon, notes, tags). | `08-items.md` |

### 1.5 Tags

| Method | Path | Auth | Purpose | Source |
|---|---|---|---|---|
| GET | `/v1/tags` | bearer+org | List all tags in the active Org. | `09-tags.md` |
| GET | `/v1/tags/:id` | bearer+org | Get one tag. | `09-tags.md` |
| GET | `/v1/tags/suggest` | bearer+org | Autocomplete suggestions for a typed prefix. | `09-tags.md` |

### 1.6 Shares (management side)

| Method | Path | Auth | Purpose | Source |
|---|---|---|---|---|
| GET | `/v1/shares` | bearer+org | List shares for an entity (`?target_type=...&target_id=...`). | `10-shares.md` |
| GET | `/v1/shares/:id` | bearer+org | Get one share's settings. | `10-shares.md` |
| GET | `/v1/shares/:id/analytics` | bearer+org | Views, unique viewers, item-click breakdown over a date range. | `10-shares.md` |

### 1.7 Sessions-save (extension)

| Method | Path | Auth | Purpose | Source |
|---|---|---|---|---|
| GET | `/v1/sessions/recent` | bearer+org | Extension popup history of the user's recent saves. | `12-sessions-save.md` |

### 1.8 Search

| Method | Path | Auth | Purpose | Source |
|---|---|---|---|---|
| GET | `/v1/search` | bearer+org | Full global search (items, collections, groups, tags). | `13-search.md` |
| GET | `/v1/search/quick` | bearer+org | Latency-optimized for the omnibox / popup quick-find. | `13-search.md` |
| GET | `/v1/search/suggest` | bearer+org | Type-ahead suggestions (entity + tag + saved-search). | `13-search.md` |
| GET | `/v1/search/recent` | bearer | List the Account's recent search queries. | `13-search.md` |
| GET | `/v1/items/search` | bearer+org | Item-scoped search (subset of `/v1/search`, returns only item results with snippets/highlights). Used by in-Collection filter bars. | `../14-search/02-item-search.md` |

### 1.9 History, undo & trash

| Method | Path | Auth | Purpose | Source |
|---|---|---|---|---|
| GET | `/v1/history` | bearer+org | Paginated event log for the active Org. | `14-history.md` |
| GET | `/v1/history/:id` | bearer+org | One event's full diff. | `14-history.md` |
| GET | `/v1/history/for/:entity_type/:entity_id` | bearer+org | Sidebar activity feed for one entity (generic form). | `14-history.md` |
| GET | `/v1/history/for/item/:id` | bearer+org | Item-specific activity feed (concrete instantiation of the generic form for `entity_type=item`). | `14-history.md` |
| GET | `/v1/items/:id/history` | bearer+org | Convenience alias for `/v1/history/for/item/:id` (item History tab). | `14-history.md` |
| GET | `/v1/trash` | bearer+org | Soft-deleted entities with TTL countdown. | `14-history.md` |

### 1.10 Import / Export

| Method | Path | Auth | Purpose | Source |
|---|---|---|---|---|
| GET | `/v1/imports/:import_id` | bearer+org | Job status (`queued`/`running`/`done`/`failed`) + counters. | `15-import-export.md` |
| GET | `/v1/imports/:id/preview` | bearer+org | Preview parsed import before commit (totals, duplicates, warnings, tree). | `15-import-export.md` |
| GET | `/v1/imports/:id/status` | bearer+org | Lightweight progress polling / SSE stream (phase, percent, ETA). | `15-import-export.md` |
| GET | `/v1/imports` | bearer+org | List recent imports. | `15-import-export.md` |
| GET | `/v1/exports/:export_id` | bearer+org | Job status + signed download URL when ready. | `15-import-export.md` |
| GET | `/v1/exports/lmn-json/:account_token` | path-token (no bearer) | Out-of-band scriptable export using migration token. | `15-import-export.md` |
| GET | `/v1/exports` | bearer+org | List recent exports. | `15-import-export.md` |

### 1.11 Licenses & billing

| Method | Path | Auth | Purpose | Source |
|---|---|---|---|---|
| GET | `/v1/me/entitlements` | bearer | Aggregate entitlements for the Account across all Orgs. | `16-licenses.md` |
| GET | `/v1/organizations/:id/billing` | bearer+role(owner/admin/billing) | Plan, seats, next renewal, invoices summary. | `16-licenses.md` |
| GET | `/v1/organizations/:id/data-export/:export_id` | bearer+role(owner/admin) | Poll an Org GDPR data-export job (status + signed download URL). | `04-organizations.md` |
| GET | `/v1/organizations/:id/billing/invoices` | bearer+role(owner/admin/billing) | Paginated list of invoices for the Org (id, period, total, status, PDF link). | `16-licenses.md` |
| GET | `/v1/billing/invoices/:id/pdf` | bearer+role(owner/admin/billing) | 302 to processor's signed invoice PDF; JSON form available via `Accept: application/json`. | `16-licenses.md` |

### 1.12 Webhooks (admin diagnostics)

| Method | Path | Auth | Purpose | Source |
|---|---|---|---|---|
| GET | `/v1/webhooks/_recent` | bearer+role(owner/admin) | Recent webhook deliveries (debug billing). | `17-billing-webhooks.md` |

### 1.13 Account (cross-Org)

> Account-scoped reads. `X-Organization-Id` header ignored.

| Method | Path | Auth | Purpose | Source |
|---|---|---|---|---|
| GET | `/v1/me/entitlements` | bearer | (also listed under §1.11) Aggregate entitlements. | `16-licenses.md` |

---

### 1.14 Jobs, flags & mindmap layouts

> Generic async-job poller, runtime flag evaluation, and mindmap-layout reads.

| Method | Path | Auth | Purpose | Source |
|---|---|---|---|---|
| GET | `/v1/jobs/:job_id` | bearer+org | Generic poller for any background job (returns normalized status envelope). | `20-jobs.md` |
| GET | `/v1/flags` | bearer+(org) | List all feature flags visible to the current `(account, org)` with their evaluated values (debug/admin variant of `POST /v1/flags/evaluate`). | `21-flags.md` |
| GET | `/v1/mindmap-layouts` | bearer+org | List saved mindmap layouts for a scope. | `23-mindmap-layouts.md` |
| GET | `/v1/mindmap-layouts/:id` | bearer+org | Get a single layout (full payload incl. node positions). | `23-mindmap-layouts.md` |

---

### 1.15 Extension health, sync & updates feed

> Extension service-worker probes, delta-sync poll, and product updates feed.

| Method | Path | Auth | Purpose | Source |
|---|---|---|---|---|
| GET | `/v1/health/extension` | bearer (optional) | Lightweight liveness/version probe used by the extension service worker before each session burst. Returns `{ ok, server_time, min_extension_version }`. | `../04-extension/03-service-worker.md` |
| GET | `/v1/sync/since` | bearer+org | Delta-sync poll: returns entities (items, collections, groups, tags) changed since `?cursor=<opaque>` for offline reconciliation. | `../04-extension/10-sync-and-offline.md` |
| GET | `/v1/whats-new` | bearer | In-app updates feed (release notes, product announcements, maintenance banners). Filtered by user locale + last-seen cursor. | `../16-notifications-updates/01-in-app-updates-feed.md` |

---

## 2. POST — create, action, and command endpoints

> Two flavors:
> - **Create** (returns a new resource). Requires `Idempotency-Key` (column **Idem.** = `Y`).
> - **Action / command** (verb-style sub-paths like `/move`, `/restore`, `/star`). `Idempotency-Key` optional unless the action allocates an external resource (e.g. checkout session).

### 2.1 Auth (sign-up, sign-in, tokens, MFA)

| Method | Path | Auth | Idem. | Purpose | Source |
|---|---|---|---|---|---|
| POST | `/v1/auth/signup` | none | Y | Create Account + Personal Org via email+password. | `03-auth.md` |
| POST | `/v1/auth/signin` | none | — | Exchange password (and MFA code) for tokens. | `03-auth.md` |
| POST | `/v1/auth/magic-link/send` | none | — | Email a one-time sign-in link. | `03-auth.md` |
| POST | `/v1/auth/magic-link/consume` | none | — | Exchange magic-link token for tokens. | `03-auth.md` |
| POST | `/v1/auth/token` | refresh-cookie | — | Rotate refresh cookie + issue new access token; also switches active Org. | `03-auth.md` |
| POST | `/v1/auth/signout` | bearer | — | Revoke current session. | `03-auth.md` |
| POST | `/v1/auth/signout-all` | bearer | — | Bump `token_version` → invalidates every active token. | `03-auth.md` |
| POST | `/v1/auth/password/forgot` | none | — | Email password-reset token (always 200 to avoid enumeration). | `03-auth.md` |
| POST | `/v1/auth/password/reset` | reset-token | — | Consume reset token → set new password. | `03-auth.md` |
| POST | `/v1/auth/password/change` | bearer | — | Change password while signed in (re-auth required). | `03-auth.md` |
| POST | `/v1/auth/mfa/enroll` | bearer | — | Begin TOTP enrollment (returns secret + QR payload). | `03-auth.md` |
| POST | `/v1/auth/mfa/verify` | bearer / signin-challenge | — | Verify TOTP code (during enroll or sign-in challenge). | `03-auth.md` |

### 2.2 Public share viewer

| Method | Path | Auth | Idem. | Purpose | Source |
|---|---|---|---|---|---|
| POST | `/v1/public/shares/:slug/unlock` | none | — | Submit password → set `lmn_share_<slug>` cookie. | `02-public-share-viewer.md` |
| POST | `/v1/public/shares/:slug/views` | share-cookie | — | Record a viewer impression (analytics). | `02-public-share-viewer.md` |
| POST | `/v1/public/shares/:slug/items/:item_id/clicks` | share-cookie | — | Record an item click. | `02-public-share-viewer.md` |
| POST | `/v1/public/shares/:slug/comments` | varies by mode | — | Post a comment on a share (Phase 2 — collab). | `02-public-share-viewer.md` |

### 2.3 Organizations

| Method | Path | Auth | Idem. | Purpose | Source |
|---|---|---|---|---|---|
| POST | `/v1/organizations` | bearer | Y | Create a new Org (caller becomes Owner). | `04-organizations.md` |
| POST | `/v1/organizations/:id/transfer-ownership` | bearer+role(owner) | — | Transfer Owner role to another Member. | `04-organizations.md` |
| POST | `/v1/organizations/:id/restore` | bearer+role(owner) | — | Undo soft-delete within grace window. | `04-organizations.md` |
| POST | `/v1/organizations/:id/purge` | bearer+role(owner) | — | Hard-delete now (skips 30-day grace; password re-auth required). | `04-organizations.md` |
| POST | `/v1/organizations/:id/data-export` | bearer+role(owner) | — | Queue GDPR export job. | `04-organizations.md` |

### 2.4 Spaces

| Method | Path | Auth | Idem. | Purpose | Source |
|---|---|---|---|---|---|
| POST | `/v1/spaces` | bearer+org | Y | Create a Space. | `05-spaces.md` |
| POST | `/v1/spaces/:id/reorder` | bearer+org | — | Move Space to a new sidebar position. | `05-spaces.md` |
| POST | `/v1/spaces/:id/star` | bearer | — | Per-Account star (UI-only, not Org-wide). | `05-spaces.md` |
| POST | `/v1/spaces/:id/unstar` | bearer | — | Per-Account unstar. | `05-spaces.md` |
| POST | `/v1/spaces/:id/collapsed-collections` | bearer | — | Persist sidebar collapse state. | `05-spaces.md` |
| POST | `/v1/spaces/:id/duplicate` | bearer+org | Y | Deep-copy a Space (subject to plan limits). | `05-spaces.md` |
| POST | `/v1/spaces/:id/restore` | bearer+org | — | Undo soft-delete. | `05-spaces.md` |

### 2.5 Collections

| Method | Path | Auth | Idem. | Purpose | Source |
|---|---|---|---|---|---|
| POST | `/v1/collections` | bearer+org | Y | Create a Collection inside a Space. | `06-collections.md` |
| POST | `/v1/collections/:id/move` | bearer+org | — | Cross-Space move (same Org). | `06-collections.md` |
| POST | `/v1/collections/:id/reorder` | bearer+org | — | Reposition within Space. | `06-collections.md` |
| POST | `/v1/collections/:id/duplicate` | bearer+org | Y | Deep-copy Collection + children. | `06-collections.md` |
| POST | `/v1/collections/:id/tags` | bearer+org | — | Attach/detach tags (idempotent set ops). | `06-collections.md` |
| POST | `/v1/collections/:id/open-all` | bearer+org | — | Returns ordered URL list for browser to open (no mutation). | `06-collections.md` |
| POST | `/v1/collections/:id/restore` | bearer+org | — | Undo soft-delete. | `06-collections.md` |

### 2.6 Groups

| Method | Path | Auth | Idem. | Purpose | Source |
|---|---|---|---|---|---|
| POST | `/v1/groups` | bearer+org | Y | Create a Group inside a Collection. | `07-groups.md` |
| POST | `/v1/groups/:id/move` | bearer+org | — | Cross-Collection move (same Org). | `07-groups.md` |
| POST | `/v1/groups/:id/reorder` | bearer+org | — | Reposition within Collection. | `07-groups.md` |
| POST | `/v1/groups/:id/hide` | bearer+org | — | Toggle hidden flag (filters out of default lists). | `07-groups.md` |
| POST | `/v1/groups/:id/unhide` | bearer+org | — | Reverse `hide`. | `07-groups.md` |
| POST | `/v1/groups/:id/duplicate` | bearer+org | Y | Deep-copy Group + items. | `07-groups.md` |
| POST | `/v1/groups/:id/open-all` | bearer+org | — | Returns ordered URL list for browser to open. | `07-groups.md` |
| POST | `/v1/groups/:id/restore` | bearer+org | — | Undo soft-delete. | `07-groups.md` |

### 2.7 Items

| Method | Path | Auth | Idem. | Purpose | Source |
|---|---|---|---|---|---|
| POST | `/v1/items` | bearer+org | Y | Create an Item (URL-typed bookmark). | `08-items.md` |
| POST | `/v1/items/:id/move` | bearer+org | — | Cross-Collection / in-out-of-Group move. | `08-items.md` |
| POST | `/v1/items/:id/reorder` | bearer+org | — | Reposition within parent. | `08-items.md` |
| POST | `/v1/items/:id/star` | bearer | — | Per-Account star. | `08-items.md` |
| POST | `/v1/items/:id/unstar` | bearer | — | Per-Account unstar. | `08-items.md` |
| POST | `/v1/items/:id/tags` | bearer+org | — | Attach/detach tags. | `08-items.md` |
| POST | `/v1/items/:id/favicon/refresh` | bearer+org | — | Re-fetch favicon (server-side). | `08-items.md` |
| POST | `/v1/items/:id/opens` | bearer | — | Record open (powers "recent" + jump-to-tab). | `08-items.md` |
| POST | `/v1/items/:id/duplicate` | bearer+org | Y | Copy Item. | `08-items.md` |
| POST | `/v1/items/:id/restore` | bearer+org | — | Undo soft-delete. | `08-items.md` |
| POST | `/v1/bulk/items` | bearer+org | Y | Mixed batch (`create` / `update` / `delete` / `move` / `tag`); rate-limit class **bulk**. | `08-items.md` |

### 2.8 Tags

| Method | Path | Auth | Idem. | Purpose | Source |
|---|---|---|---|---|---|
| POST | `/v1/tags` | bearer+org | Y | Create a tag. | `09-tags.md` |
| POST | `/v1/tags/:id/merge` | bearer+org | — | Merge tag into target tag (rewrites references). | `09-tags.md` |

### 2.9 Shares

| Method | Path | Auth | Idem. | Purpose | Source |
|---|---|---|---|---|---|
| POST | `/v1/shares` | bearer+org | Y | Create a share for a Collection / Group / Item / mindmap_layout. | `10-shares.md` |
| POST | `/v1/shares/:id/rotate-slug` | bearer+org | — | Issue a new slug; old slug 410. | `10-shares.md` |
| POST | `/v1/shares/:id/revoke` | bearer+org | — | Disable share (returns 410 to viewers). | `10-shares.md` |
| POST | `/v1/shares/:id/restore` | bearer+org | — | Re-enable a revoked share. | `10-shares.md` |
| POST | `/v1/shares/:id/invites/resend` | bearer+org | — | Resend invite-mode emails. | `10-shares.md` |
| POST | `/v1/shares/:id/purge` | bearer+role(owner/admin)+reauth | Y | Hard-delete a share (skips 90-day analytics grace). | `10-shares.md` |
| POST | `/v1/shares/links/:id/revoke` | bearer+org | — | Revoke a single share-link (v2 multi-link). | `10-shares.md` |

### 2.10 Members & invites

| Method | Path | Auth | Idem. | Purpose | Source |
|---|---|---|---|---|---|
| POST | `/v1/members/invites` | bearer+role(owner/admin) | Y | Send one or many invites (batched). | `11-members-invites.md` |
| POST | `/v1/members/:id/invite/resend` | bearer+role(owner/admin) | — | Resend a pending invite. | `11-members-invites.md` |
| POST | `/v1/members/invites/accept` | invite-token | — | Accept invite (no bearer needed; auth via signed token). | `11-members-invites.md` |
| POST | `/v1/members/invites/decline` | invite-token | — | Decline invite. | `11-members-invites.md` |
| POST | `/v1/members/me/leave` | bearer+org | — | Self-leave Org (Owner blocked unless transfer first). | `11-members-invites.md` |
| POST | `/v1/members/me/refresh-entitlements` | bearer | — | Re-issue access token after role/plan change. | `11-members-invites.md` |

### 2.11 Sessions-save (extension Save Session)

| Method | Path | Auth | Idem. | Purpose | Source |
|---|---|---|---|---|---|
| POST | `/v1/sessions/save` | bearer+org | Y | Persist a window's tabs as a Collection or Group. | `12-sessions-save.md` |
| POST | `/v1/sessions/save/preview` | bearer+org | — | Dry-run save (dedup count, plan-limit check). | `12-sessions-save.md` |
| POST | `/v1/sessions/restore` | bearer+org | — | Reverse op: open a Collection/Group as a tab session. | `12-sessions-save.md` |
| POST | `/v1/sessions/:id/undo` | bearer+org | — | Undo a single session-save operation (rolls back the items/groups it created within the grace window). Distinct from generic `/v1/history/:id/undo` — operates on the synthetic session-save event without needing the underlying history event id. | `12-sessions-save.md` |

### 2.12 History & trash

| Method | Path | Auth | Idem. | Purpose | Source |
|---|---|---|---|---|---|
| POST | `/v1/history/:id/undo` | bearer+org | — | Undo a single (or grouped) event. | `14-history.md` |
| POST | `/v1/history/:id/redo` | bearer+org | — | Redo a previously undone event. | `14-history.md` |
| POST | `/v1/trash/restore` | bearer+org | — | Bulk restore trash rows by `entity_id`. | `14-history.md` |
| POST | `/v1/trash/purge` | bearer+role(owner) | — | Bulk hard-delete (password re-auth). | `14-history.md` |
| POST | `/v1/trash/empty` | bearer+role(owner) | — | Hard-delete everything in trash; returns 202 + `job_id`. | `14-history.md` |

### 2.13 Import / Export

| Method | Path | Auth | Idem. | Purpose | Source |
|---|---|---|---|---|---|
| POST | `/v1/imports` | bearer+org | Y | Start an import job (two-phase: presigned PUT then process). Class **bulk**. | `15-import-export.md` |
| POST | `/v1/imports/upload` | bearer+org | Y | One-shot multipart import for files ≤ 25 MB. Class **bulk**. | `15-import-export.md` |
| POST | `/v1/imports/:id/commit` | bearer+org | Y | Commit a previewed import (writes rows). Class **bulk**. | `15-import-export.md` |
| POST | `/v1/imports/:id/parse` | bearer+org | Y | Trigger the parse phase on a previously-uploaded import source (`?source=<id>`). Spawns background job; status via `GET /v1/imports/:id/status`. Class **bulk**. | `../11-import-export/03-import-pipeline.md` |
| POST | `/v1/imports/:import_id/cancel` | bearer+org | — | Cancel a running/queued import. | `15-import-export.md` |
| POST | `/v1/exports` | bearer+org | Y | Start an export job (selectors + format). Class **bulk**. | `15-import-export.md` |
| POST | `/v1/exports/:export_id/refresh-url` | bearer+org | Y | Mint a fresh signed download URL for a completed export. | `15-import-export.md` |
| POST | `/v1/transfers/cross-org` | bearer+role(owner) | Y | Move data between two Orgs you own. | `15-import-export.md` |
| POST | `/v1/me/gdpr-export` | bearer+reauth | Y (auto, 1/24h per Account) | Trigger Account-wide GDPR export job. Class **bulk**. | `19-account.md` |

### 2.14 Licenses & billing

| Method | Path | Auth | Idem. | Purpose | Source |
|---|---|---|---|---|---|
| POST | `/v1/organizations/:id/billing/checkout` | bearer+role(owner/admin/billing) | Y | Create Stripe/Paddle checkout session. | `16-licenses.md` |
| POST | `/v1/organizations/:id/billing/portal` | bearer+role(owner/admin/billing) | — | Open hosted billing portal. | `16-licenses.md` |
| POST | `/v1/organizations/:id/billing/change` | bearer+role(owner/admin/billing) | — | Change plan / seat count in-app. | `16-licenses.md` |
| POST | `/v1/organizations/:id/billing/cancel` | bearer+role(owner/admin/billing) | — | Cancel subscription at period end. | `16-licenses.md` |
| POST | `/v1/organizations/:id/billing/lifetime/redeem` | bearer+role(owner) | Y | Redeem a lifetime-deal code. | `16-licenses.md` |
| POST | `/v1/organizations/:id/billing/lifetime/stack` | bearer+role(owner) | Y | Stack additional lifetime code. | `16-licenses.md` |

### 2.15 Webhooks (inbound)

| Method | Path | Auth | Idem. | Purpose | Source |
|---|---|---|---|---|---|
| POST | `/v1/webhooks/stripe` | webhook-sig | — | Stripe events (subscription, invoice, charge). | `17-billing-webhooks.md` |
| POST | `/v1/webhooks/paddle` | webhook-sig | — | Paddle events. | `17-billing-webhooks.md` |
| POST | `/v1/webhooks/lifetime-redeem` | webhook-sig | — | AppSumo / PitchGround redeem callback. | `17-billing-webhooks.md` |
| POST | `/v1/webhooks/email-in` | webhook-sig (Postmark/SES) | — | Inbound email-to-Org address; creates item-from-email job. | `17-billing-webhooks.md` |
| POST | `/v1/webhooks/inbound/:webhook_token` | path-token (no bearer) | Idem-Key | Generic inbound webhook (Zapier / RSS bridges); creates item from JSON. | `17-billing-webhooks.md` |

---

### 2.16 Flags, layouts & internal

| Method | Path | Auth | Idem. | Purpose | Source |
|---|---|---|---|---|---|
| POST | `/v1/flags/evaluate` | bearer+(org) | — | Evaluate feature flags for the current `(account, org, context)`. | `21-flags.md` |
| POST | `/v1/mindmap-layouts` | bearer+org | Y | Create a saved mindmap layout for a scope. | `23-mindmap-layouts.md` |
| POST | `/v1/internal/feedback` | bearer | Y | Submit in-app feedback / bug report (creates support ticket). | `22-internal.md` |
| POST | `/v1/internal/feedback/attachments` | bearer | Y | Upload screenshot / log attachment for a feedback ticket; returns signed URL stored on the ticket. | `22-internal.md` |
| POST | `/v1/realtime/ticket` | bearer+org | — | Mint a short-lived ticket (≤ 60 s) the extension/web client exchanges with the realtime transport (WS/SSE) to subscribe to Org channels. | `../04-extension/10-sync-and-offline.md` |

---

## 3. PATCH — partial update endpoints

> Use for *partial* field changes. Tree-shape changes (move/reorder) are POST actions instead, per the locked rule in `readme.md`. All PATCH endpoints accept `If-Match: <updated_at>` for optimistic concurrency.

| Method | Path | Auth | Purpose | Source |
|---|---|---|---|---|
| PATCH | `/v1/organizations/:id` | bearer+role(owner/admin) | Update Org name, settings, branding. | `04-organizations.md` |
| PATCH | `/v1/spaces/:id` | bearer+org | Update Space (name, color, icon). | `05-spaces.md` |
| PATCH | `/v1/collections/:id` | bearer+org | Update Collection (name, color, icon, description). | `06-collections.md` |
| PATCH | `/v1/groups/:id` | bearer+org | Update Group (name, color). | `07-groups.md` |
| PATCH | `/v1/items/:id` | bearer+org | Update Item (title, URL, notes, favicon). | `08-items.md` |
| PATCH | `/v1/tags/:id` | bearer+org | Rename / recolor a tag. | `09-tags.md` |
| PATCH | `/v1/shares/:id` | bearer+org | Update share settings (mode, password, expiry, perms). | `10-shares.md` |
| PATCH | `/v1/members/:id` | bearer+role(owner/admin) | Change a member's role. | `11-members-invites.md` |
| PATCH | `/v1/account/preferences` | bearer | Update Account preferences (default view, theme, locale, layout). | `19-account.md` |
| PATCH | `/v1/mindmap-layouts/:id` | bearer+org+(creator OR owner/admin) | Update a saved mindmap layout (name, node positions, default flag). | `23-mindmap-layouts.md` |

---

## 4. PUT — full-replace endpoints

> Reserved for content where partial-merge semantics are awkward (large bodies). Currently only one.

| Method | Path | Auth | Purpose | Source |
|---|---|---|---|---|
| PUT | `/v1/collections/:id/notes` | bearer+org | Replace the long-form notes body wholesale (Markdown). | `06-collections.md` |

---

## 5. DELETE — soft-delete & revocation endpoints

> All DELETE on entities are **soft-delete** (move to trash, 30-day TTL). Hard-delete is reached via `POST /:id/purge` or `POST /trash/purge`. Auth-side DELETEs (sessions, invites) are immediate.

| Method | Path | Auth | Purpose | Source |
|---|---|---|---|---|
| DELETE | `/v1/auth/sessions/:id` | bearer | Revoke a single session/device. | `03-auth.md` |
| DELETE | `/v1/organizations/:id` | bearer+role(owner) | Soft-delete Org (30-day grace). | `04-organizations.md` |
| DELETE | `/v1/spaces/:id` | bearer+org | Soft-delete Space. | `05-spaces.md` |
| DELETE | `/v1/collections/:id` | bearer+org | Soft-delete Collection. | `06-collections.md` |
| DELETE | `/v1/groups/:id` | bearer+org | Soft-delete Group. | `07-groups.md` |
| DELETE | `/v1/items/:id` | bearer+org | Soft-delete Item. | `08-items.md` |
| DELETE | `/v1/tags/:id` | bearer+org | Delete tag (detached from items first if `?cascade=detach`). | `09-tags.md` |
| DELETE | `/v1/members/:id` | bearer+role(owner/admin) | Remove a member from the active Org. | `11-members-invites.md` |
| DELETE | `/v1/members/:id/invite` | bearer+role(owner/admin) | Cancel a pending invite. | `11-members-invites.md` |
| DELETE | `/v1/search/recent` | bearer | Clear recent searches (or one entry via `?q=...`). | `13-search.md` |
| DELETE | `/v1/mindmap-layouts/:id` | bearer+org+(creator OR owner/admin) | Delete a saved mindmap layout; promotes new default if needed. | `23-mindmap-layouts.md` |

---

## 6. Common request patterns (cheat sheet)

These rules apply to **every** request unless an endpoint overrides them.

```
Authorization:    Bearer <access_token>            # except 'none' rows above
X-Organization-Id: <uuid>                          # required on every Org-scoped row
X-Client:         chrome-ext/1.4.0 | web/1.4.0
X-Request-Id:     <client uuid>                    # echoed in response + logs
Idempotency-Key:  <uuid>                           # required where Idem. = Y
If-Match:         <updated_at>                     # PATCH/DELETE optimistic concurrency
Content-Type:     application/json; charset=utf-8  # except OAuth callbacks + webhooks
```

### Pagination (cursor-only)

```
GET /v1/items?limit=50&cursor=<opaque>
→ { "data": [...], "page": { "next_cursor": "...", "has_more": true, "limit": 50 } }
```

### Filtering & sorting

```
GET /v1/items?collection_id=01J...&is_starred=true&tag=react&tag=ui&sort=-updated_at
```

### Sparse fields & embedded refs

```
GET /v1/items/:id?fields=id,title,url&expand=tags,shares
```

### Error envelope (every non-2xx)

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "...",
    "field": "name",
    "details": { "min": 1, "max": 120 },
    "request_id": "01J...",
    "doc_url": "https://docs.letsmarknow.com/errors/validation_failed"
  }
}
```

Full code list lives in `01-conventions.md` §4 and `18-error-codes.md`.

---

## 7. Endpoint counts (sanity check)

| Method | Count |
|---|---|
| GET | 46 |
| POST | 90 |
| PATCH | 9 |
| PUT | 1 |
| DELETE | 11 |
| **Total** | **157** |

> If you add or remove an endpoint in any per-domain file, also update the matching row here. This file is the canonical index — out-of-sync rows are a spec bug.

---

## 8. Cross-references

- **Conventions (read first):** `01-conventions.md`
- **Error codes catalog:** `18-error-codes.md`
- **Data model (entity shapes returned in `data`):** `../02-data-model/`
- **Auth model (token contents, refresh flow):** `../09-auth-accounts/06-sessions.md`, `../09-auth-accounts/01-identity-model.md`
- **Permissions matrix (who can call what):** `../08-sharing-collab/05-permissions-matrix.md`, `../08-sharing-collab/permissions-matrix.json`
- **Rate-limit values:** `01-conventions.md` §8 + `../09-auth-accounts/13-rate-limit-values.md`
- **Extension call patterns:** `../04-extension/12-messaging.md`, `../04-extension/11-auth-bridge.md`
