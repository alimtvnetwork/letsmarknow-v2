# 00 — Admin / Org Folder Overview

> **Purpose.** Define **organisation-level administration** — settings, member management, roles, audit log, data export/delete. This folder is what an Org owner or admin uses to govern their workspace.

---

## 1. Responsibilities

1. **Organisation settings.** Org profile, branding, default member permissions, custom domain entry point (Team plan).
2. **Members management.** Invite, role assignment, deactivate, transfer ownership; bulk actions.
3. **Roles.** Authoritative 7-value role enum (`owner, admin, editor, viewer, billing, guest, system`) with per-role action matrix; backed by SQL `CHECK` to prevent drift (W-1 lock).
4. **Audit log.** Org-scoped audit trail of admin-relevant events: role changes, member adds/removes, share creations/revocations, billing events.
5. **Data export & delete.** Org-level GDPR export; org-level "delete this organisation" flow with confirmation gates.

---

## 2. File-by-file behaviour

| File | Owns |
|---|---|
| `01-organization-settings.md` | Profile, branding, default permissions, custom domain entry. |
| `02-members-management.md` | Invite/accept/role/deactivate/transfer ownership flows. |
| `03-roles.md` | Locked 7-value enum + SQL `CHECK`; per-role action matrix; W-1 closure source. |
| `04-audit-log.md` | What is logged at the Org admin level; retention; export. |
| `05-data-export-delete.md` | Org-level GDPR export and full Org-deletion flow. |

---

## 3. Tasks performed by this folder

- **Govern the workspace** — who is in it, what they can do, how they were added/removed.
- **Lock the role enum** at the schema level so RLS, JWT claims, and UI cannot drift.
- **Surface compliance evidence** via the audit log and export tooling.
- **Provide a clean exit** — Org-level deletion that is deliberate, recoverable for 30 days, then irreversible.

---

## 4. What this folder is NOT

- **Not user-level settings.** Personal account settings are in `05-web-app/05-account-settings.md`.
- **Not billing.** Plan/seat/invoice management is in `10-licensing-billing/`.
- **Not sharing.** Share permissions are in `08-sharing-collab/05-permissions-matrix.md` (which references the role enum locked here).

---

## 5. Cross-references

- Member table: `02-data-model/08-member.md`.
- Permission matrix: `08-sharing-collab/05-permissions-matrix.md`.
- Member management UI: `05-web-app/07-member-management.md`.
- Audit-event row schema: `02-data-model/09-history-event.md`.
- Org-level deletion + GDPR cross-cutting: `19-security-privacy/04-gdpr-ccpa.md`.
