# Entity: Member

## Purpose

The membership record linking an Account to an Organization with a Role. One Account can be a Member of many Organizations; one Organization can have many Members.

## Fields

| Name | Type | Null | Default | Validation | Description |
|---|---|---|---|---|---|
| `id` | uuid | no | — | — | UUIDv7. |
| `organization_id` | uuid (Organization.id) | no | — | — | — |
| `account_id` | uuid (Account.id) | yes | null until accepted | — | Null until invitee signs up / accepts. |
| `invited_email` | email | no | — | lowercased | Email used for invite. Stays even after accept. |
| `role` | enum(`owner`\|`admin`\|`editor`\|`viewer`\|`billing`\|`guest`\|`system`) | no | `viewer` | — | Canonical 7-value `org_role` enum locked in `17-admin-org/03-roles.md` §1. `billing` = access to billing/invoices only, no content access. `guest` is rare on Members (typically tracked via Share access); when present, it represents an explicit guest-seat invite. `system` is server-issued only — never user-assigned (enforced by SQL CHECK in `17-admin-org/03-roles.md` §2). |
| `status` | enum(`pending`\|`active`\|`suspended`\|`removed`) | no | `pending` | — | `pending` until accept; `active` after; `suspended` by Admin; `removed` is hard tombstone. |
| `invited_by` | uuid (Account.id) | no | — | — | Who sent the invite. |
| `invited_at` | timestamp | no | — | — | — |
| `accepted_at` | timestamp | yes | null | — | — |
| `removed_at` | timestamp | yes | null | — | — |
| `last_active_at` | timestamp | yes | null | — | Updated on any user action in this Org. |
| `space_access` | enum(`all`\|`explicit`) | no | `all` | — | `all` = sees every Space in Org; `explicit` = only Spaces explicitly granted (see `space_ids` below). |
| `space_ids` | array<uuid> | no | `[]` | required non-empty when `space_access=explicit` | Per-Space access list. |
| `accepted_2fa` | bool | no | false | — | If Org requires 2FA, member must enable before access. |

## Invariants

1. Exactly one Member per Org with `role=owner` and `status=active`.
2. `(organization_id, invited_email)` unique among non-removed members.
3. `(organization_id, account_id)` unique among non-removed members (where account_id not null).
4. Owner cannot be `removed` or `suspended`. Must transfer ownership first.
5. Total active+pending Members ≤ Org's plan seat limit.
6. Removing a Member preserves their `created_by` references on entities (no cascade).

## Indexes (recommended)

- `(organization_id, status)`
- `(account_id)` for "list my orgs"
- `(invited_email)`

## Lifecycle

- **Invite:** Admin/Owner enters email → row created with `status=pending`, `account_id=null`, magic-link email sent.
- **Accept:** invitee clicks link → if no Account, sign-up flow first → on success, `account_id` set, `status=active`, `accepted_at=now()`.
- **Resend invite:** allowed; throttled to 1/hour per email.
- **Change role:** Admin/Owner only; Owner role transferable only via dedicated "Transfer Ownership" action with confirmation.
- **Suspend / Re-activate:** Admin/Owner only. Suspended Members keep data references but cannot sign in to that Org.
- **Remove:** sets `status=removed`, `removed_at`. Member's data references preserved.

## Permission checks (summary — full matrix in `08-sharing-collab/05-permissions-matrix.md`)

| Action | Owner | Admin | Editor | Viewer |
|---|---|---|---|---|
| Read content | ✅ | ✅ | ✅ | ✅ |
| Create/update/delete content | ✅ | ✅ | ✅ | ❌ |
| Invite/remove members | ✅ | ✅ | ❌ | ❌ |
| Change roles (non-Owner) | ✅ | ✅ | ❌ | ❌ |
| Manage subscription/billing | ✅ | ✅ | ❌ | ❌ |
| Delete organization | ✅ | ❌ | ❌ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ | ❌ |
| Configure SSO / audit log (Team) | ✅ | ✅ | ❌ | ❌ |

## Events emitted

- `member.invited`
- `member.accepted`
- `member.role_changed`
- `member.suspended`
- `member.reactivated`
- `member.removed`
- `member.space_access_changed`

## Role-enforcement contract

This table is the **sole** source of `(account_id, organization_id) → role`. Never store `role` on `accounts`, `profiles`, or any other table — doing so reintroduces the privilege-escalation class that the `<user-roles>` directive explicitly forbids.

All server-side authorization checks MUST go through the SECURITY DEFINER `has_role(_user_id uuid, _role app_role)` function defined as the canonical pattern in [`19-security-privacy/01-threat-model.md`](../19-security-privacy/01-threat-model.md) → "Elevation of privilege" row (pinned Session 90). RLS policies on every other entity (`01-organization` … `11-account`, plus `12-next-item`) call this function rather than joining `members` directly, which both prevents recursive RLS evaluation and centralizes the role-resolution logic.

The `system` role is server-issued only (background workers, migrations) and MUST NOT be assignable through any user-facing endpoint; enforcement lives in `17-admin-org/03-roles.md §2` (SQL `CHECK` + endpoint guard).
