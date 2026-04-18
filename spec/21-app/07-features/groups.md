# Groups

Collapsible clusters of items inside a Collection. Lightweight; no nesting.

---

## 1. Concept

A Group:
- Belongs to one Collection.
- Contains 0+ Items.
- Has a name, optional emoji, optional color.
- Is a single level (no Group inside Group).
- Is reorderable within Collection.

Use cases: "Quick Tools", "Reading List - Q2", "Onboarding videos".

## 2. Lifecycle

- **Create**: inline header in Collection ("+ Group"), drag-and-drop items into a "New Group" zone, or `n g` shortcut.
- **Rename**: inline; `F2`; right-click → Rename.
- **Move**: drag to another Collection (carries items).
- **Merge**: drag a Group onto another → "Merge into…" prompt.
- **Split**: select items inside a Group → "Move to new Group".
- **Soft-delete**: members released back to Collection root unless `cascade=true` opt-in.
- **Restore**: from Trash; if original Collection deleted, prompts for new home.

## 3. Properties

| Field | Notes |
|---|---|
| `id` | UUIDv7 |
| `slug` | optional, used for `/g/:slug` deep links |
| `name` | 1–80 chars |
| `emoji` | optional |
| `color` | optional HSL accent |
| `collection_id` | parent |
| `position_hint` | float |
| `is_collapsed_default` | bool |
| `created_at`, `updated_at`, `deleted_at?` | timestamps |

## 4. View

- Renders as a collapsible block with header (`▼ Quick Tools 🐤  · 12 items`).
- Body shows items in current view mode.
- Empty Groups show ghost slot "Drop items here".
- Collapsed by default if `is_collapsed_default=true`.
- Per-account collapsed state remembered in `account_group_state`.

## 5. Operations

- Drag item into Group: adds to Group at drop position.
- Drag item out of Group (onto Collection background): removes from Group.
- Drag Group reorder within Collection.
- Right-click Group → Rename, Recolor, Set emoji, Merge with…, Move to…, Delete.

## 6. Behavior with views

- Grid: full cards, group header full-width.
- List: thinner header, inline rows.
- Compact: header inline; counts visible.
- Column: each Group becomes a Kanban column; ungrouped items become "(no group)" column.

## 7. Sharing

- Groups inherit Collection's share scope.
- Single Group can be share-targeted directly (`/share-group/:id`) → produces a `/t/{slug}` viewer with only that Group's items.

## 8. Limits

| Plan | Groups per Collection | Items per Group |
|---|---|---|
| Free | 5 | inherits Collection cap |
| Pro | unlimited | inherits |
| Team | unlimited | inherits |

## 9. Entitlements

| Feature | Free | Pro | Team |
|---|---|---|---|
| Create Group | ✅ (≤ 5) | ✅ unlimited | ✅ unlimited |
| Group emoji + color | ✅ | ✅ | ✅ |
| Merge / split | ❌ | ✅ | ✅ |
| Direct Group share | ❌ | ✅ | ✅ |

## 10. Telemetry

- `group.created` `{ via }`
- `group.renamed`
- `group.merged`
- `group.split`
- `group.collapsed_default_changed`
- `group.deleted` / `_restored`

## 11. Edge cases

| Case | Behavior |
|---|---|
| Name conflict in Collection | Allowed; sortable still works |
| Item dragged across Collections via Group | Item carries to new Collection (parent change), keeps its own tags |
| Cascade delete of Group | Items go to Collection root, not deleted (unless `cascade=true`) |
| Group restored to deleted Collection | Prompt for destination Collection |
| Group moved to Collection user can't write | Blocked; explanation tooltip |
