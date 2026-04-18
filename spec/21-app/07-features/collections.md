# Collections

The primary container of items. Live inside a Space.

---

## 1. Lifecycle

- **Create**: from sidebar `+`, dashboard CTA, command palette (`n c`), extension popup picker, or via Save Tab when destination doesn't exist (inline create).
- **Rename**: inline (double-click sidebar label, `F2`, or right-click → Rename); URL slug auto-updates if not customized.
- **Move**: drag to another Space, or right-click → Move to Space.
- **Duplicate**: copies items + groups + tags-on-items; new ID; "(Copy)" suffix.
- **Archive** (Pro+): hides from sidebar without deleting; appears under "Archived" footer in sidebar.
- **Soft-delete**: `deleted_at` set; cascades hide of children; recoverable from Trash 30 days.
- **Restore**: from Trash; cascades restore.
- **Purge**: from Trash; permanent.

## 2. Defaults

- View mode: inherits Space default (configurable).
- Sort: `position_hint` (manual ordering).
- Density: inherits Account.
- Visibility: inherits Space.

## 3. Properties

| Field | Notes |
|---|---|
| `id` | ULID |
| `slug` | URL-safe; auto from name; user-editable |
| `name` | 1–120 chars |
| `description` | 4 KB Markdown-lite (optional) |
| `icon` | emoji OR uploaded image OR none (initials tile) |
| `color` | HSL triplet for accent |
| `default_view` | grid \| list \| compact \| column |
| `default_sort` | manual \| created_at_desc \| title_asc \| domain_asc |
| `space_id` | parent Space |
| `is_archived` | bool |
| `position_hint` | float for sibling ordering |
| `share_id?` | if shared |
| `created_at`, `updated_at`, `deleted_at?` | timestamps |
| `created_by` | account_id |

## 4. Permissions

- Editor+ can create/rename/move/duplicate/delete in Spaces they have write to.
- Viewer can open and read.
- Owner/Admin override across all Spaces.

## 5. Capacity

| Plan | Items per Collection | Collections per Org |
|---|---|---|
| Free | 200 | 20 |
| Pro | 5,000 | unlimited |
| Team | 20,000 | unlimited |

Soft-limit notifications appear at 80% of cap.

## 6. Collaboration

- Real-time updates via WebSocket.
- Other Members' presence shown as avatars in top-right when actively viewing.
- "Editing" indicator next to a Member's avatar if they're modifying an Item.

## 7. Sub-routes

| Path | View |
|---|---|
| `/c/:slug` | Whole Collection |
| `/c/:slug/g/:group_slug` | Focused on a Group |
| `/c/:slug?view=column` | Override view mode |
| `/c/:slug?tag=react` | Filter by tag |

## 8. Bulk operations

- Multi-select items via Shift/Cmd-click or `Space`.
- Bulk move, tag, delete, share-as-set.

## 9. Sharing

- "Share" button in header → opens Share Sheet.
- Share modes: public / password / invite-only.
- All items in Collection plus Groups visible to viewers.

## 10. Entitlements

| Feature | Free | Pro | Team |
|---|---|---|---|
| Create Collection | ✅ (≤ 20) | ✅ unlimited | ✅ unlimited |
| Custom slug | ❌ | ✅ | ✅ |
| Custom icon image | ❌ | ✅ | ✅ |
| Description | ✅ | ✅ | ✅ |
| Archive | ❌ | ✅ | ✅ |
| Default sort | ✅ | ✅ | ✅ |
| Per-Collection theme accent | ❌ | ❌ | ✅ |

## 11. Telemetry

- `collection.created` `{ via, has_description }`
- `collection.renamed`
- `collection.moved` `{ across_spaces }`
- `collection.duplicated` `{ item_count }`
- `collection.archived` / `_unarchived`
- `collection.deleted` / `_restored` / `_purged`

## 12. Edge cases

| Case | Behavior |
|---|---|
| Name conflicts in same Space | Allowed; differentiate by slug |
| Move to Space user can't write | Blocked; explanation tooltip |
| Duplicate exceeds plan cap | Partial duplicate up to cap + warning |
| Archive shared Collection | Share remains active; viewers unaware |
| Delete shared Collection | Share auto-revoked; banner during 30-day grace allows restore |
