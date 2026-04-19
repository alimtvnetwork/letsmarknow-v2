# Roles & Permissions

Role definitions, the permission matrix, and the rules for combining them.

---

## 1. Role definitions

> **Canonical enum (locked):** `owner, admin, editor, viewer, billing, guest, system`. This list MUST match `00-overview/02-glossary.md` and `02-data-model/08-member.md`. Do not add, rename, or remove a role without updating all three files in the same change.

| Role | Invitable? | Purpose |
|---|---|---|
| **Owner** | transfer-only | Sole legal/billing owner. Exactly 1 per Org (transferable). Full access. |
| **Admin** | yes | Org-wide management except billing + ownership transfer. |
| **Editor** | yes | Create / edit / delete content. No member or settings access. |
| **Viewer** | yes | Read-only access to all content the Org exposes to them. |
| **Billing** | yes | Billing-only: invoices, payment method, plan changes. No content access. |
| **Guest** | per-share only | Per-resource access only (via share). Not a full Org member. |
| **System** | NEVER (server-issued) | Internal service principal for background jobs, webhooks, migrations. Never assignable through invite UI or API; only created by server-side workflows. |

## 2. Storage

Per `<user-roles>` policy:

```sql
-- Canonical 7-value enum. Matches glossary + member.md. Do not edit in isolation.
create type public.org_role as enum (
  'owner',
  'admin',
  'editor',
  'viewer',
  'billing',
  'guest',
  'system'
);

create table public.member_roles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role org_role not null,
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now(),
  unique (org_id, user_id, role)
);
alter table public.member_roles enable row level security;

-- 'system' role is server-issued only. Block any path that attempts to grant it
-- through normal mutation (invite accept, role-change endpoint, bulk import).
-- Enforced via a CHECK + a security-definer guard on the invite/role endpoints.
alter table public.member_roles
  add constraint member_roles_no_user_assigned_system
  check (role <> 'system' OR granted_by IS NULL);
```

A user CAN have multiple roles in different Orgs. Within one Org, a user has exactly one role (enforced at app layer; unique constraint on `(org_id, user_id)` via partial index excluding guests). The `system` role is reserved for the platform itself and is never returned by member-list endpoints.

## 3. `has_role` security definer function

```sql
create or replace function public.has_role(_user_id uuid, _org_id uuid, _role org_role)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.member_roles
    where user_id = _user_id and org_id = _org_id and role = _role
  );
$$;
```

Use this in every RLS policy. Never check role via subquery on `member_roles` from inside an `auth.uid()`-referencing policy → recursion risk.

## 4. Permission matrix

Legend: ✅ allowed · ✏ allowed with constraints · — denied

> **System role omitted** from all matrices below — it bypasses RLS as a security-definer principal and has implicit full access for background jobs only. It MUST never appear in user-facing UI.

### Content

| Capability | Viewer | Editor | Admin | Owner | Billing | Guest |
|---|---|---|---|---|---|---|
| View Spaces / Collections (Org-visible) | ✅ | ✅ | ✅ | ✅ | — | per-share |
| Create Collection | — | ✅ | ✅ | ✅ | — | — |
| Edit Collection meta | — | ✏ own | ✅ | ✅ | — | — |
| Delete Collection | — | ✏ own | ✅ | ✅ | — | — |
| Create Item | — | ✅ | ✅ | ✅ | — | per-share |
| Edit Item (any) | — | ✅ | ✅ | ✅ | — | per-share |
| Delete Item | — | ✏ own | ✅ | ✅ | — | — |
| Move to Trash | — | ✏ own | ✅ | ✅ | — | — |
| Restore from Trash | — | ✏ own | ✅ | ✅ | — | — |
| Empty Trash (Org-wide) | — | — | ✅ | ✅ | — | — |

### Sharing

| Capability | Viewer | Editor | Admin | Owner | Billing | Guest |
|---|---|---|---|---|---|---|
| Share content read-only | — | ✅ | ✅ | ✅ | — | — |
| Share content with edit | — | ✏ if Org allows | ✅ | ✅ | — | — |
| Make content public | — | ✏ if Org allows | ✅ | ✅ | — | — |
| Revoke any share | — | own | ✅ | ✅ | — | — |
| Set share password | — | ✅ | ✅ | ✅ | — | — |
| Create embed widget | — | ✅ | ✅ | ✅ | — | — |

### Members & Org

| Capability | Viewer | Editor | Admin | Owner | Billing | Guest |
|---|---|---|---|---|---|---|
| View member list | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Invite members | — | — | ✅ | ✅ | — | — |
| Change member roles | — | — | ✅ | ✅ | — | — |
| Remove members | — | — | ✅ | ✅ | — | — |
| Transfer ownership | — | — | — | ✅ | — | — |
| Edit Org settings | — | — | ✅ | ✅ | — | — |
| Manage billing (plans, payment, invoices) | — | — | — | ✅ | ✅ | — |
| Delete Org | — | — | — | ✅ | — | — |

### Audit & data

| Capability | Viewer | Editor | Admin | Owner | Billing | Guest |
|---|---|---|---|---|---|---|
| View own activity | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| View Org audit log | — | — | ✅ | ✅ | — | — |
| View billing events in audit log | — | — | ✅ | ✅ | ✅ | — |
| Export Org data | — | — | ✅ | ✅ | — | — |
| Restore from snapshot | — | — | ✅ | ✅ | — | — |

## 5. Constraint rules

- **Editor `own` rules**: Editor can only modify/delete content they personally created OR were explicitly granted edit on.
- **Org-allow gates**: When Org policy disables public sharing, even Editors can't enable it.
- **Cascade on role downgrade**: Demoting Admin → Editor doesn't undo their past actions; future actions follow new role.

## 6. Custom roles (Enterprise, future)

- Out of scope for v1.
- Schema reserved: `custom_roles` table with `(org_id, name, permissions jsonb)`.
- v1 uses fixed enum.

## 7. Role inference for shared resources

When a Guest accesses a shared Collection:
- They get Guest role for the share scope only.
- Permissions defined on the `share` row: `view` / `comment` / `edit`.
- Stored in `share_grants` per `08-sharing-collab/01-share-model.md`.

## 8. UI surfaces

- Role badge appears next to member name in lists, comments, presence indicators.
- Color: Owner gold, Admin red, Editor blue, Viewer gray, Guest neutral.
- Hover tooltip explains capabilities.

## 9. Server enforcement

- Every API endpoint checks via `has_role(auth.uid(), org_id, required_role)`.
- Reject with `403 FORBIDDEN` and machine-readable `code: INSUFFICIENT_ROLE` (UPPER_SNAKE_CASE per `03-api-endpoints/01-conventions.md` §4 / `18-error-codes.md`).
- Front-end pre-checks for UX (hide buttons), but never trusts itself.

## 10. Telemetry

- `permission.denied` `{ endpoint, required_role, actual_role }` (sampled; PII-free)
- `role.assigned` `{ role }`
- `role.revoked` `{ role }`
- `role.escalation_attempt` (security event; alert if > N/min)

## 11. Edge cases

| Case | Behavior |
|---|---|
| Multiple Owners attempted | Database constraint rejects; transfer flow swaps atomically |
| User on two devices, role downgraded mid-session | Next request 403; client refreshes role + re-renders |
| Guest's parent share revoked | Their access removed instantly; their cached UI errors gracefully |
| Role function returns inconsistent result mid-tx | Wrap in single tx; use `has_role` consistently |
| Free-tier Org tries to assign Admin to a 4th member | Plan gate triggers upgrade modal |

## 12. Tests

- RLS policy correctness via fixture matrix (every role × every endpoint).
- `has_role` function never recurses.
- Role downgrade revokes UI access immediately.
- Last-Owner constraint via DB-level check.
- Guest scope leak test (try to access sibling Collection).
- Custom role schema reservation doesn't break v1 queries.
