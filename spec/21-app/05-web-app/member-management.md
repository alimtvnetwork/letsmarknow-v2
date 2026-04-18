# Member Management (`/org/:id/members`)

Invite, list, change-role, remove. UI for the API in `03-api-endpoints/members-invites.md`.

---

## 1. Page layout

```
┌──────────────────────────────────────────────────────────┐
│  Members  ·  3 active · 2 pending · 5 / 10 seats          │
│  ──────────────────────────────────────────────────────  │
│  [ Invite members ]   [ Filter: All ▾ ]   [ 🔍 search ]   │
│  ──────────────────────────────────────────────────────  │
│  Avatar  Name           Email          Role     Last act │
│  ──────────────────────────────────────────────────────  │
│  AK     Alim Ul Karim   alim@…         Owner    just now │
│  SR     Sara Rahman     sara@…         Editor   2h ago   │
│  ⏳     (pending)        joe@…          Viewer   sent 1d  │
│                                                            │
│  [ Load more ]                                            │
└──────────────────────────────────────────────────────────┘
```

## 2. Invite flow

### 2.1 Single / batch invite modal

Fields:
- Emails (chips input; comma/Enter-separated; up to 50 at once)
- Role (radio: Admin / Editor / Viewer / Billing). Owner cannot be invited.
- Add to Spaces (multi-select; default: all Spaces with `visibility=org`).
- Personal message (textarea, optional, max 500 chars).
- "Send" button.

### 2.2 Validation
- Each email validated client-side; invalid show red border.
- Server returns per-email result via `/v1/members/invites` 207. UI surfaces per-row status with retry per row.
- Seat enforcement: if accepting all invites would exceed `seats`, show inline upsell ("Buy 3 more seats →") before sending.

### 2.3 Post-send
- Pending rows appear immediately in members table with "⏳ Pending" badge and "Resend / Cancel" actions.
- Toast: "Sent 3 invites."

## 3. Row actions

| Action | Constraint |
|---|---|
| Change role (dropdown) | Owner can change anyone's; Admin can change Editor/Viewer/Billing only; cannot demote sole Owner |
| Remove member | Owner/Admin; cannot remove sole Owner; confirmation modal |
| Resend invite | Pending only |
| Cancel invite | Pending only |
| Transfer ownership | Owner only; opens dedicated re-auth flow |
| View activity | Anyone; opens filtered Activity feed for this Member |

## 4. Bulk actions

- Multi-select with checkboxes.
- Actions: Change role, Remove, Resend invite (pending only).
- Confirmation modal lists affected rows.

## 5. Filters & search

- Filter by Role (All / Owner / Admin / Editor / Viewer / Billing / Pending).
- Filter by status (Active / Pending / Disabled).
- Search by name or email substring (server-side).
- Sort by Last active, Name A→Z, Joined date.

## 6. Self row

Your own row is highlighted; "Leave organization" button replaces "Remove" (cannot remove yourself directly).

## 7. Empty / error states

- 0 members other than self: prominent CTA "Invite your team" with example email shown.
- Seat cap at 100% used: row at top "All seats used. Buy more seats →".
- API errors per row: red badge with tooltip; one-click retry.

## 8. Telemetry

- `org.member.invited` with `{ count, roles: [...] }`
- `org.member.role_changed` with `{ from, to }`
- `org.member.removed`
- `org.member.invite_accepted` (server-side too; surfaced in activity)
- `org.member.invite_canceled`
- `org.member.transfer_ownership_initiated` / `_completed`

## 9. A11y

- Table is semantic `<table>` with caption + scope headers.
- Row actions reachable via keyboard (Tab to row → Enter opens menu).
- Bulk-select announces count via ARIA live.
