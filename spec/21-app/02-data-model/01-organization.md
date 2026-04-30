# Entity: Organization

## Purpose

The top-level container — the colored "workspace bubble" (PE / AU / XL …) shown in the left rail. Holds Members, billing/subscription, and Spaces. One Account can own or belong to many Organizations.

## Fields

| Name | Type | Null | Default | Validation | Description |
|---|---|---|---|---|---|
| Audit Block | — | — | — | — | see `README.md` |
| `name` | string(120) | no | "My Organization" | trim, non-empty | Display name (e.g. "Personal", "Atto Property"). |
| `slug` | slug | no | auto from name | unique globally | Used in URLs that reference the org (rarely public-facing). |
| `avatar_token` | string(8) | no | first 2 chars of name uppercased | `[A-Z0-9]{1,4}` | The 2-letter monogram for the bubble (e.g. `PE`). |
| `avatar_color` | color | no | hash(name) → palette | from theme palette | Bubble background color. |
| `avatar_image_url` | url | yes | null | https only | Optional uploaded logo, supersedes monogram. |
| `theme` | enum(`pink`\|`indigo`\|`emerald`\|`amber`\|`rose`\|`slate`) | no | `pink` | — | Accent theme for this org's UI. Default matches Toby. |
| `description` | text | yes | null | ≤ 4000 chars | Free-text description. |
| `owner_account_id` | uuid (Account.id) | no | — | exactly 1 Owner per org | The current Owner. Transferable. |
| `subscription_id` | uuid (License.id) | yes | null | — | Pointer to active License. Null = Free tier. |
| `default_space_id` | uuid (Space.id) | yes | null | must belong to this org | Space to open when user clicks the bubble. |
| `settings` | json | no | `{}` | see schema below | Per-org preferences (see § Settings JSON). |

### Settings JSON

```json
{
  "default_view_mode": "grid",          // list|grid|compact|mindmap|column
  "show_open_tabs_panel": true,
  "open_tabs_panel_width_px": 320,
  "history_window_days": 30,             // capped per tier
  "allow_member_invite_by_admin": true,
  "require_2fa_for_members": false,      // Team plan
  "audit_log_retention_days": 365        // Team plan
}
```

## Relationships

- **Parent:** none.
- **Children:** Spaces (1..N), Members (1..N), Shares (0..N inherited via children), History Events (0..N).
- **Cross-refs:** `subscription_id` → License.

## Invariants

1. Exactly one Member with role=`Owner` exists at all times.
2. `owner_account_id` MUST match the Member with role=`Owner`.
3. Cannot delete the Organization while it has > 0 Members other than the Owner — must remove them first.
4. `slug` immutable after creation (avoids breaking any cached references).
5. `avatar_token` length 1–4 chars; truncated/uppercased on write.

## Indexes (recommended)

- `(slug)` unique
- `(owner_account_id)`
- `(deleted_at)` partial where null

## Lifecycle

- **Create:** triggered by sign-up (auto "My Organization" for new Account) or by user "Create new workspace" action. On create, server inserts: 1 Organization + 1 Member (Owner) + 1 default Space "My Collections".
- **Update:** any field except `id`, `slug`, `created_at`, `created_by`.
- **Soft-delete:** sets `deleted_at`. All children cascade-soft-delete in same transaction. Recoverable for 30 days via Trash.
- **Hard-delete:** after 30 days OR immediate via "Permanently delete" with double-confirmation. Cascades to all children. License subscription must be canceled first.
- **Transfer ownership:** updates `owner_account_id` and the corresponding Member roles. Old Owner becomes Admin by default.

## Events emitted

- `organization.created`
- `organization.updated` (per-field diff)
- `organization.soft_deleted`
- `organization.restored`
- `organization.hard_deleted`
- `organization.ownership_transferred`
- `organization.theme_changed`
- `organization.avatar_changed`

## Permissions

> Role × action mapping for this entity lives in [`08-sharing-collab/05-permissions-matrix.md`](../08-sharing-collab/05-permissions-matrix.md) (search anchor: `organization`). RLS policies in §RLS below translate that matrix into row-level predicates via `has_role()`; do not duplicate the matrix here.

## Foreign keys

> See [`00-overview.md §4a`](./00-overview.md#4a-master-foreign-key-on-delete-table) for the canonical on-delete actions across the data model. Carve-outs: `owner_account_id` → Account `restrict` (Owner-loss forbidden); `subscription_id` / `default_space_id` → `set null`.

## RLS

> Follows the per-entity template at [`templates/entity-rls.md`](./templates/entity-rls.md). Calls `has_role()` per the role-enforcement SoT in `08-member.md §Role-enforcement contract`.

- enable row level security
- SELECT: `EXISTS (members where account_id = auth.account_id() and organization_id = id and status = 'active')` AND `deleted_at IS NULL`.
- INSERT: any authenticated Account may create an Org (becomes Owner via the Org-create RPC, which inserts the matching Member row in the same transaction). WITH CHECK `owner_account_id = auth.account_id()`.
- UPDATE: `has_role(auth.account_id(), 'admin')` OR `has_role(auth.account_id(), 'owner')` for this `id`. `owner_account_id`, `slug`, `subscription_id` editable by `owner` only.
- DELETE (soft): `owner` only. Hard-delete: `owner` only AND `subscription_id IS NULL` (license must be canceled first — invariant 3).
- Notes: `billing` role sees the Org row (needed to render billing page) but UPDATE is gated to billing-only fields (`subscription_id` proxied via license RPC). `guest` role MUST NOT appear on Members of an Org root row.
