# Template: Per-Entity RLS Section

> Canonical template referenced by every `## RLS` section in `02-data-model/01-organization.md` … `11-account.md` and `12-next-item.md`. Closes audit finding **DM1** (`23-audits/audit-2026-04-29-data-model-sweep-99.md`). Implementer AIs (Lovable / Cursor / Raw-LLM) translate the per-entity intent declared here into `CREATE POLICY` SQL.

## 1. Universal rules

1. Every table in `02-data-model/` has `enable row level security` set. There are no exceptions — disabling RLS is a F-class spec violation.
2. All role checks go through the SECURITY DEFINER function `has_role(_user_id uuid, _role app_role)` defined as the canonical pattern in [`19-security-privacy/01-threat-model.md`](../../19-security-privacy/01-threat-model.md) → "Elevation of privilege" row (pinned Session 90). Never join `members` directly inside an RLS policy (causes recursive evaluation).
3. Share-mediated reads go through SECURITY DEFINER helper `share_grants_access(_target_type text, _target_id uuid, _account_id uuid)` (resolves to true when an active, non-revoked, non-expired Share covers the target for the requesting Account). Implementation owner: `02-data-model/07-share.md`.
4. The `system` role is server-issued only — never appears in JWT claims, only in service-role contexts. Policies SHOULD NOT special-case `system`; service role bypasses RLS entirely by Postgres convention.
5. Soft-delete: `SELECT` policies MUST exclude rows where `deleted_at IS NOT NULL` UNLESS the caller has a Trash-scoped read (see `05-web-app/09-trash.md` — uses a separate `trash_view_*` policy).
6. The auth helper `auth.account_id()` returns the calling Account's UUID (Supabase JWT claim). Never trust `account_id` from request body for authorization.

## 2. Per-entity intent shape

Each `## RLS` section in entity files MUST declare:

```
## RLS

- enable row level security
- SELECT: <predicate referencing has_role / share_grants_access / per-Account scope>
- INSERT: <predicate (WITH CHECK) — who may create>
- UPDATE: <predicate — typically same as SELECT plus a min role>
- DELETE: <predicate — soft-delete preferred via UPDATE; hard-delete usually owner/admin only>
- Notes: <any entity-specific carve-outs (e.g. Member.invite_only mode, Share password gate, License billing-role visibility)>
```

## 3. Role-to-action defaults (entity-agnostic)

| Action | Min role (Org-scoped entities) |
|---|---|
| Read content | `viewer` (or share-mediated) |
| Create / update content | `editor` |
| Soft-delete content | `editor` |
| Hard-delete content | `admin` |
| Manage Members | `admin` |
| Manage License / billing | `billing` or `admin` |
| Transfer ownership / delete Org | `owner` |

Entities that are per-Account (`12-next-item`, parts of `11-account`) bypass Org role gates entirely — see `12-next-item.md §RLS`.

## 4. What this template does NOT cover

- Concrete `CREATE POLICY` SQL (DB team translates).
- Realtime channel auth (lives in `08-sharing-collab/14-realtime-transport.md`).
- Edge-function / RPC authorization (lives in `03-api-endpoints/01-conventions.md`).

## 5. Cross-references

- Role-enforcement SoT: `02-data-model/08-member.md §Role-enforcement contract`.
- Threat model: `19-security-privacy/01-threat-model.md`.
- Permissions matrix: `08-sharing-collab/05-permissions-matrix.md`.
