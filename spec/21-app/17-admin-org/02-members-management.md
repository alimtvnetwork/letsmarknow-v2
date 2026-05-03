# Members Management

Invite, suspend, remove, transfer ownership. The single source of truth for who's in the Org.

---

## 1. Surface

- Route: `/o/{org_slug}/members`.
- Visible to roles ≥ Admin.
- Layout: searchable table + invite panel.

## 2. Member row anatomy

| Column | Notes |
|---|---|
| Avatar + name + email | Click → member profile drawer |
| Role | Inline editor (Admin only); Owner role transfer is separate flow |
| Status | Active / Pending / Suspended / Removed |
| Last active | Relative time |
| Joined | ISO date |
| 2FA | ✅ / ⚠️ |
| ⋯ | Actions menu |

## 3. Invite flow

- Top button "Invite members".
- Modal:
  - Email addresses (multi; comma / newline / paste).
  - Role per row (default: Viewer).
  - Optional: target Collection access list.
  - Personal message (≤ 500 chars).
- Submit → `POST /v1/members/invites` (per `03-api-endpoints/11-members-invites.md`).
- Each invitee gets email with magic-link. **TTL: 14 days default; configurable 1 h–90 d** — SoT `09-auth-accounts/07-org-membership.md §2` (do not duplicate the number elsewhere).
- Pending invites visible in table with "Resend" / "Revoke" actions.

## 4. Bulk invite

- CSV upload (Pro+): `email,role,collections`.
- Up to 1,000 rows per upload.
- Server validates row-by-row; previews errors before commit.
- Domain-restricted Orgs auto-reject non-matching emails.

## 5. Role changes

- Inline dropdown in role column.
- Confirmation modal for elevations (Member → Admin) with brief description of new permissions.
- Demotions are immediate.
- Member's open sessions are NOT signed out on role change; new permissions apply on next request.
- Audit log entry created.

## 6. Suspend / unsuspend

- Suspended members:
  - Cannot sign in to this Org.
  - Their content remains; ownership preserved.
  - Their share links remain active (configurable: "auto-revoke shares from suspended members").
- Unsuspend restores immediately; no email sent unless manually triggered.
- Suspension reason text (free-form, internal-only) stored in audit log.

## 7. Remove member

- Confirmation: "Remove `<name>` from `<Org>`?".
- Choice on item handling:
  - Transfer all their items to: `<member picker>` (default: Owner).
  - Or "Move to Org Inbox" (no specific owner).
  - Or "Delete all their items" (only with double-confirm + typed name).
- Open sessions invalidated.
- Member's profile retained 30 days (for re-invite continuity); then purged from Org membership table.
- Audit log entry includes item disposition.

## 8. Transfer ownership

- Owner-only flow.
- Modal:
  - Pick new Owner from existing Admin members.
  - Or invite new Owner by email (must be Admin first).
  - Confirm: "You will become Admin and `<name>` becomes Owner. Continue?"
  - Owner password re-entry required.
- New Owner gets confirmation email + must accept within 72 h.
- Original Owner can rescind during the 72 h window.
- After acceptance: roles swap; original Owner now Admin; audit log entry; both parties emailed.

## 9. Member profile drawer

Opens on row click:
- Avatar, name, email, joined, last active.
- Sessions list (device + IP + last seen) with "Revoke" per session.
- 2FA status; "Require 2FA reset" button.
- Recent activity (last 30 days, scoped to Org).
- "Download activity log" button.
- Audit log filter shortcut: "Show all events for this member".

## 10. SCIM provisioning (Enterprise)

- Endpoint: `https://api.letsmarknow.com/scim/v2/`.
- Auth: bearer token per Org.
- Supports User + Group resources.
- Auto-provision: new IDP user → invite created with default role.
- Auto-deprovision: IDP removal → suspend (configurable: suspend or remove).
- See `09-auth-accounts/05-sso-saml.md`.

## 11. Permissions matrix (member management)

| Action | Viewer | Editor | Admin | Owner |
|---|---|---|---|---|
| View members list | ✅ | ✅ | ✅ | ✅ |
| Invite members | — | — | ✅ | ✅ |
| Change roles (non-Owner) | — | — | ✅ | ✅ |
| Suspend members | — | — | ✅ | ✅ |
| Remove members | — | — | ✅ | ✅ |
| Transfer ownership | — | — | — | ✅ |
| View own profile | ✅ | ✅ | ✅ | ✅ |
| Revoke own sessions | ✅ | ✅ | ✅ | ✅ |

## 12. Telemetry

- `members.invited` `{ count, role }`
- `members.bulk_imported` `{ count, errors }`
- `members.role_changed` `{ from, to }`
- `members.suspended`
- `members.removed` `{ item_disposition }`
- `members.ownership_transferred`

## 13. Edge cases

| Case | Behavior |
|---|---|
| Last Owner tries to leave | Block with "Transfer ownership first" |
| Invite to email already in another Org | Allowed; user accepts and joins both |
| Invite expires (default 14 d, see SoT) | Pending row marked "Expired"; one-click resend |
| Invitee already accepted from another invite | New invite no-ops with friendly message |
| Member uses SSO + tries to change role to Owner | Allowed; SSO doesn't restrict role |
| Removed member re-invited within 30 d | Original profile + activity restored |

## 14. Tests

- Last-Owner protection.
- Item disposition correctness on remove.
- Ownership transfer 72h window + rescission.
- SCIM auto-provision/deprovision round-trip.
- Bulk invite CSV error handling.
- Suspended member's shares behavior per Org policy.
