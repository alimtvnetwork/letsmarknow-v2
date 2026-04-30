# Share Model (v2 design note — NOT shipped in v1)

> ⚠️ **STATUS: v2 future design.** The shipping v1 contract is the **single-table** model in `02-data-model/07-share.md`. This file documents a richer multi-table design (`Share` + `ShareLink` + `ShareInvite` + `ShareView`) intended for a later release when multiple links per share, embed URLs, and custom domains land. **Do not implement against this file for v1.**

The data model and lifecycle for every shareable surface.

---

## 1. Entities

### `Share`
One per shareable scope (Collection, Group, or Item). Bag of policy.

| Field | Type | Notes |
|---|---|---|
| `id` | UUIDv7 | |
| `org_id` | UUIDv7 | |
| `target_type` | `collection \| group \| item` | **Naming reconciled with v1** (`02-data-model/07-share.md`). Earlier drafts of this v2 note used `scope_type`; do not reintroduce. |
| `target_id` | UUIDv7 | the shared entity (was `scope_id` in earlier drafts) |
| `memorable_slug` | string? | Org-scoped uniqueness. Pro+. Carried forward unchanged from v1 (`02-data-model/07-share.md` + `13-share-link.md §1.2`). Reserved-slug list in `13-share-link.md §2`. v2 does NOT move this onto `ShareLink` — memorable URL stays one-per-Share. |
| `created_by` | account_id | |
| `is_active` | bool | revoked = false |
| `include_notes` | bool | default false |
| `include_pinned_only` | bool | default false |
| `allow_comments` | bool | Pro+ |
| `allow_reactions` | bool | Pro+ |
| `theme` | enum | `auto \| light \| dark` |
| `og_image_url` | string? | custom OG override (Pro+) |
| `branding` | object? | Team brand overrides |
| `expires_at` | timestamptz? | optional TTL |
| `created_at`, `updated_at`, `revoked_at?` | | |

### `ShareLink`
A specific URL to a Share. Multiple per Share.

| Field | Type | Notes |
|---|---|---|
| `id` | UUIDv7 | |
| `share_id` | UUIDv7 | |
| `slug` | string | URL-safe; 8–32 chars; user-customizable |
| `mode` | `public \| password \| invite` | |
| `password_hash` | string? | argon2id |
| `password_salt` | string? | |
| `max_views` | int? | optional cap |
| `view_count` | int | |
| `last_viewed_at` | timestamptz? | |
| `expires_at` | timestamptz? | overrides Share TTL |
| `is_active` | bool | individually revocable |
| `created_at`, `revoked_at?` | | |

### `ShareInvite` (mode = invite)
| Field | Type | Notes |
|---|---|---|
| `id` | UUIDv7 | |
| `share_link_id` | UUIDv7 | |
| `email` | citext | |
| `token_hash` | string | one-time magic-link token (hashed) |
| `accepted_at` | timestamptz? | |
| `last_seen_at` | timestamptz? | |

### `ShareView` (analytics; Pro+)
Append-only ring buffer per ShareLink for last 90 days.

| Field | Type | Notes |
|---|---|---|
| `share_link_id` | UUIDv7 | |
| `viewed_at` | timestamptz | |
| `country` | iso2 | from CDN headers |
| `referrer_host` | string? | |
| `viewer_kind` | `anon \| authed \| invited` | |
| `viewer_account_id?` | account_id | when authed |

## 2. URL forms

| Mode | Format |
|---|---|
| Public | `https://letsmarknow.com/t/{slug}` |
| Password | `https://letsmarknow.com/t/{slug}` (asks for password) |
| Invite | `https://letsmarknow.com/t/{slug}?inv={token}` (one-time → cookie) |
| Embed | `https://letsmarknow.com/e/{slug}` (iframe-friendly) |
| Custom domain (Team) | `https://share.acme.com/{slug}` (CNAME → us) |

## 3. Lifecycle

1. Owner clicks "Share" → server creates `Share` (if absent) + first `ShareLink` (mode default = public).
2. Owner can add additional links (e.g. a public one for marketing + a password one for clients).
3. Each link revocable independently (`POST /v1/shares/links/:id/revoke`).
4. Revoke whole Share → all links flipped to `is_active=false`, Redis cache busted, viewers see "This share has been revoked" within 5 s.
5. Expired links return 410 Gone with helpful message.

## 4. Visibility scopes

- **Item** share: only that one Item visible.
- **Group** share: items of the Group, ordered by Group's order.
- **Collection** share: groups + items in their canonical order; viewer toggles view-mode (grid/list) but defaults to share owner's pick.

## 5. Inheritance

- Group/Item inside a shared Collection are accessible via Collection share but get **their own canonical URL** only if the user creates a sub-share.
- Sub-shares inherit `include_notes` default but can be overridden.

## 6. Caching

- Anonymous Share view responses cached at edge (Cloudflare) for 60 s.
- Cache key includes `share_link_id` + `etag`.
- Mutations (revoke, edit) bust via tag-based purge.

## 7. Indexability (SEO)

- Default: `noindex, nofollow`.
- Pro+ owners can flip "Allow search engines" per Share → `index, follow`.
- Custom OG image, title, description in Share settings.
- Sitemap NOT auto-generated; opt-in per Share.

## 8. Capacity

| Plan | Active Shares per Org | Links per Share |
|---|---|---|
| Free | 3 | 1 |
| Pro | 100 | 5 |
| Team | unlimited | 25 |

## 9. Telemetry

- `share.created` `{ scope_type, mode }`
- `share.link_created` `{ mode }`
- `share.link_revoked` `{ reason }`
- `share.expired_visit` `{ scope_type }`
- `share.viewed` `{ mode, viewer_kind, country }`

## 10. Edge cases

| Case | Behavior |
|---|---|
| Scope deleted while share active | Share auto-revoked; cache busted |
| Scope archived | Share remains active (archive is a sidebar concern) |
| Owner downgraded plan exceeding share cap | Excess shares deactivated oldest-first; owner notified |
| Slug collision | Reject with 409; suggest alternates |
| Custom domain DNS broken | Fallback `t/{slug}` URL still works |
