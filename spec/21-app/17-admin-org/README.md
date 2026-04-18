# 17 — Admin & Organization

Org-level controls: settings, members, roles, audit log, data export/delete.

## Reading order

1. `organization-settings.md` — Org profile, defaults, security policies.
2. `members-management.md` — Invite, suspend, remove, transfer ownership.
3. `roles.md` — Role definitions + permission matrix.
4. `audit-log.md` — Immutable record of admin-relevant actions.
5. `data-export-delete.md` — GDPR-grade export + Org deletion.

## Files

| File | Purpose |
|---|---|
| `organization-settings.md` | Org-wide preferences |
| `members-management.md` | Member CRUD + invites |
| `roles.md` | Roles + permissions |
| `audit-log.md` | Audit trail |
| `data-export-delete.md` | Export + delete entire Org |

## Locked rules

- **Owner is always > 0** — last Owner cannot leave or be demoted.
- **Roles stored in `member_roles` table** (separate from profiles) per `<user-roles>` policy.
- **Audit log is append-only**, retention varies by tier.
- **Org deletion is reversible for 30 days**, then permanent.
- **Data export is self-service** (no support ticket required) for Owners.
- **Free tier** has limited admin: no audit log access > 7 days, no SSO, no SCIM.
- **Personal Org** has no admin UI (it's a single-user Org with implicit Owner).
