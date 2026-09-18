# Entity: Share

## Purpose

A configuration that exposes a Space, Collection, Group, or Item to people outside the Organization via a `letsmarknow.com/t/{slug}` URL, with optional password, expiry, and invite-only access list.

## Fields

| Name | Type | Null | Default | Validation | Description |
|---|---|---|---|---|---|
| Audit Block | — | — | — | — | — |
| `organization_id` | uuid (Organization.id) | no | derived | — | For tenancy + counting. |
| `target_type` | enum(`space`\|`collection`\|`group`\|`item`\|`mindmap_layout`) | no | — | `mindmap_layout` first emitted at P3 per sequencing audit S-5 (2026-04-19); column must be added by P2 so the share table is forward-compatible when mindmap ships in P3 (`15-visualization/04-mindmap-view.md` §7). | What is being shared. |
| `target_id` | uuid | no | — | must exist & belong to same Org | The target entity id. |
| `slug` | slug | no | random `[a-z0-9]{10}` | unique globally, `[a-z0-9-]{3,64}` | URL component → `letsmarknow.com/t/{slug}`. Custom slug only on Pro+. |
| `is_custom_slug` | bool | no | false | — | True if user picked the slug. |
| `memorable_slug` | slug | yes | null | per `08-sharing-collab/13-share-link.md` §1.2 (1–60 chars, no leading/trailing/double hyphen) | Optional memorable shortlink → `letsmarknow.com/lmk/{org_handle}/{memorable_slug}`. Org-scoped uniqueness (two Orgs may share `lmk/hr`). Pro+ entitlement (`custom_share_slug`). Reserved-slug list per `08-sharing-collab/13-share-link.md` §2 plus extras: `lmk`, `t`, `new`, `edit`. |
| `mode` | enum(`public`\|`password`\|`invite_only`) | no | `public` | — | Access mode. |
| `password_hash` | string(255) | yes | null | argon2id | Required when `mode=password`. Never returned by API. |
| `expires_at` | timestamp | yes | null | future or null | When the share stops working. Null = never. |
| `revoked_at` | timestamp | yes | null | — | Manual revoke marker. Revoked shares 410 Gone. |
| `allow_clone_to_my_account` | bool | no | true | — | Whether viewer can "Save to my Organization" (deep-copy). |
| `show_owner_branding` | bool | no | true | — | Display Organization avatar + name on share page. |
| `allowed_emails` | array<email> | no | `[]` | required when `mode=invite_only`, ≤ 500 | Whitelist for invite-only. Each email must auth before access. |
| `allowed_email_roles` | json | no | `{}` | map email→`viewer`\|`editor` | Per-email role for invite-only mode. |
| `view_count` | int | no | 0 | — | Total page views. |
| `unique_viewer_count` | int | no | 0 | — | Distinct authenticated/IP-bucketed viewers. |
| `last_viewed_at` | timestamp | yes | null | — | — |
| `analytics_enabled` | bool | no | true | — | Whether to track per-item clicks. |
| `meta_title` | string(120) | yes | null | — | Optional override for OG title. |
| `meta_description` | string(300) | yes | null | — | Optional OG description. |
| `meta_image_url` | url | yes | null | https | Optional OG image. |

## Relationships

- **Parent:** Organization.
- **Refers to:** target entity (Space/Collection/Group/Item).
- **Has:** ShareView records (separate analytics entity, see `08-sharing-collab/11-share-analytics.md`).

## Invariants

1. `slug` globally unique, case-insensitive, never reused (even after delete) for 90 days.
2. Reserved slugs blocked: `t`, `app`, `api`, `admin`, `pricing`, `docs`, `vs`, `login`, `signup`, `account`, plus a configurable blocklist.
3. `password_hash` REQUIRED when `mode=password`; rejected otherwise.
4. `allowed_emails` REQUIRED non-empty when `mode=invite_only`; rejected otherwise.
5. `expires_at` MUST be in the future at create time.
6. Custom slug only allowed when Org's License entitlement includes `custom_share_slug`.
7. Soft-deleting the target entity revokes all its Shares atomically (sets `revoked_at`).
8. `memorable_slug` is OPTIONAL. When set, `(organization_id, memorable_slug)` is unique case-insensitively. The random `slug` is the universal fallback and remains globally unique whether or not `memorable_slug` is set.
9. `memorable_slug` follows reserved-slug rules in `08-sharing-collab/13-share-link.md` §2 plus extras: `lmk`, `t`, `new`, `edit`.
10. Repointing a Share to a new target (orphaned-state recovery) is allowed only when the new target shares the same `target_type` and `organization_id`. Logs `share.target_repointed` and clears `revoked_at`.

## Indexes (recommended)

- `(slug)` unique
- `(organization_id, memorable_slug)` unique partial where `memorable_slug is not null`
- `(organization_id, target_type, target_id)`
- `(expires_at)` partial where not null
- `(revoked_at)` partial where null

## Lifecycle

- **Create:** by Editor+ on the target entity. Server generates random slug or accepts custom (Pro+ only).
- **Update:** mode, password, expiry, allowed_emails, branding, analytics flag — yes. Slug — only re-generate via "Rotate link" action (creates new slug, revokes old).
- **Revoke:** sets `revoked_at = now()`. Public viewer returns 410 Gone with friendly page.
- **Hard-delete:** allowed only when `revoked_at` set. Slug remains reserved 90 days.

## Public viewer behavior (summary — full spec in `05-web-app/14-share-viewer.md`)

| Mode | Auth required | Flow |
|---|---|---|
| `public` | none | Direct render. |
| `password` | password form | Submit → server compares argon2id → set short-lived signed cookie. |
| `invite_only` | sign-in with email in `allowed_emails` | Magic-link sign-in → check email match → render with role. |

## Events emitted

- `share.created` (with `target_type`, `mode`)
- `share.updated` (per-field diff; password changes never log the value)
- `share.slug_rotated`
- `share.revoked`
- `share.expired` (auto, when cron crosses `expires_at`)
- `share.viewed` (analytics-only, not in Undo)
- `share.item_clicked` (analytics-only)
- `share.cloned_to_account` (when `allow_clone_to_my_account` is used)
- `share.hard_deleted`
- `share.target_repointed` (orphaned-state recovery, see invariant §10)
- `share.access_requested` (visitor without access submits the request-access form, see `08-sharing-collab/13-share-link.md` §8)

## Permissions

> Role × action mapping for this entity lives in [`08-sharing-collab/05-permissions-matrix.md`](../08-sharing-collab/05-permissions-matrix.md) (search anchor: `share`). RLS policies in §RLS below translate that matrix into row-level predicates via `has_role()`; do not duplicate the matrix here.

## Foreign keys

> See [`00-overview.md §4a`](./00-overview.md#4a-master-foreign-key-on-delete-table) for the canonical on-delete actions across the data model. Carve-out: `target_id` is polymorphic (Space/Collection/Group/Item/mindmap_layout) — application-managed via trigger, not a Postgres FK. Soft-delete of target sets `revoked_at` (Invariant 7); hard-delete cascades.

## RLS

> Follows the per-entity template at [`templates/entity-rls.md`](./templates/entity-rls.md). This entity OWNS the SECURITY DEFINER helper `share_grants_access(_target_type, _target_id, _account_id)` that other entity policies call.

- enable row level security
- SELECT: `has_role(auth.account_id(), 'viewer')` for `organization_id`. Public viewer access (`/t/{slug}`) does NOT go through this policy — it uses a SECURITY DEFINER `resolve_share_by_slug(slug, password?, viewer_email?)` RPC that returns the rendered payload without exposing the row.
- INSERT: `has_role(auth.account_id(), 'editor')` for `organization_id` AND target entity write access. WITH CHECK that `target_id` belongs to `organization_id` (invariant on `target_id`).
- UPDATE: `editor`+ on Org. `slug` immutable except via "Rotate link" RPC. `password_hash` writes go through the password-set RPC (server hashes argon2id; column never accepts plaintext).
- DELETE: soft (revoke) = `editor`+; hard = `admin`+ AND `revoked_at IS NOT NULL` (lifecycle constraint).
- Notes: `password_hash` MUST be excluded from any `SELECT` projection returned to non-service-role callers (column-level grant or view). Custom slug INSERT/UPDATE additionally requires `entitlements.custom_share_slug = true` on the Org's License (invariant 6), enforced in the share-create/update RPC.
