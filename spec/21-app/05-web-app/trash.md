# Trash (`/org/:id/trash`)

Soft-deleted entities, ready to review, restore, or purge.

---

## 1. Data source

`GET /v1/trash?limit=50` (cursor-paginated).

## 2. Layout

```
┌────────────────────────────────────────────────────────────┐
│  Trash · 142 items · oldest will be permanently deleted    │
│  on May 18, 2026.                                           │
│                                                              │
│  [ Restore selected ] [ Delete forever ] [ Empty trash ]   │
│  ──────────────────────────────────────────────────────────│
│  Filter: All types ▾   Older than: any ▾   Deleted by: any│
│  ──────────────────────────────────────────────────────────│
│  ☐ icon  Name                Type     Deleted     Purges   │
│  ──────────────────────────────────────────────────────────│
│  ☐ 📈    Old Marketing       Coll.    2d  by Alim  in 28d │
│  ☐ 🌐    react-spring        Item     5d  by Sara  in 25d │
│  ☐ 🐤    Quick Tools         Group    7d  by Alim  in 23d │
│  ...                                                        │
└────────────────────────────────────────────────────────────┘
```

Each row clickable to a preview drawer (right-side) showing entity snapshot + "Restore" / "Delete forever" buttons.

## 3. Filters

- Entity type (Space / Collection / Group / Item / Tag / Share / Member).
- Age (older than 1 day / 7 days / 30 days).
- Deleted by (multi-select Members).
- Search by name (substring).

## 4. Restore

- Single: row action.
- Bulk: select rows → "Restore selected" → confirmation modal listing count.
- Server: `POST /v1/trash/restore` with `entity_ids`.
- Restores cascade: if a Collection is restored, its children that were soft-deleted in the same batch are restored too (they appear in trash with a "child of" badge and are auto-selected when parent is selected).
- Conflicts (e.g. parent Space hard-deleted): row shows red "Cannot restore: parent gone" with option to "Restore to..." picker.

## 5. Delete forever

- Single or bulk; requires re-auth (current password).
- "Empty trash" purges everything in active Org's trash; same re-auth.
- Server returns `202` with `job_id` for large purges (>1k entities).

## 6. Auto-purge schedule

- Items, Groups, Tags: 30 days after `deleted_at`.
- Collections, Spaces, Shares: 30 days.
- Members: 7 days (since they may want to be re-invited quickly).
- A daily server job purges expired rows; emits `system.purged` events into Activity.

## 7. Permissions

- Anyone in the Org can VIEW Trash (transparent audit).
- Editors can RESTORE.
- Owners/Admins can PURGE.
- Free tier: same rules; trash retention is still 30 days.

## 8. Empty state

- "Trash is empty." with cheerful illustration. Tip: "Deleted items appear here for 30 days."

## 9. Telemetry

- `trash.viewed`
- `trash.restored` with `{ count, entity_types: [...] }`
- `trash.purged` with `{ count }`
- `trash.emptied` with `{ count }`

## 10. Accessibility

- Row checkboxes have ARIA labels.
- Bulk action announcements via live region ("3 items selected").
- Date formatted in user's locale + relative (`2 days ago · Apr 16, 2026`).
