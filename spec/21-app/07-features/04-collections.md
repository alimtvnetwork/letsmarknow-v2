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
| `id` | UUIDv7 |
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

---

## 13. Toby parity (SI-021)

This section captures behavioral parity with Toby's Collections feature. Source: `00-conversation-log.md` 2026-04-29 entry. Container mapping per glossary "External-product mappings" (Toby Workspace = split: Space + Organization).

### 13.1 Header & dual toolbar

Each Collection view renders a two-row header:

**Row 1 — Identity** (left → right):
- Drag handle (6-dot icon, visible on hover, used to reorder among siblings in the sidebar)
- Color/emoji icon tile (32×32, click → icon picker)
- Editable name (inline, click-to-edit, `Enter` saves, `Esc` cancels, `F2` enters edit mode)
- Member presence avatars (max 3 + "+N" overflow chip, per §6)
- Share button (opens Share Sheet, §9)
- Overflow `⋯` menu (Rename, Duplicate, Move to Space, Archive, Delete, Export, Copy link)

**Row 2 — Action toolbar** (left → right):
- "Save current tab" (primary CTA, brand pink) — saves the active browser tab as a new Item at the current sort position; in web app this opens the URL-input dialog
- "Save all tabs" — opens the Open Tabs Panel (`04-extension/16-open-tabs-panel.md`) pre-checked
- "Open all" — opens every Item in the Collection in new tabs (warns when count > 20; entitlement-gated for > 50, see §10)
- View switcher (List / Grid / Compact / Column, per `15-visualization/`)
- Sort dropdown (Manual / Title A→Z / Newest / Most opened)
- Filter (tag chip multiselect)
- Search-within-collection (`/` focuses)

Toolbars collapse into the overflow menu below `768px`.

### 13.2 Star-pinning behaviour

Items and Groups can be **starred** (per `02-data-model/05-item.md` `is_starred`). Starred entities pin to the top of the Collection in a dedicated "⭐ Starred" sub-section that:

- Renders above the main list regardless of `default_sort`.
- Has its own manual ordering controlled by `starred_pin_position` (float, see `../02-data-model/03-collection.md` and `../02-data-model/05-item.md`).
- Collapses with a chevron (state persisted per Account in `view_state`).
- Is hidden entirely when no starred items exist.

Unstarring removes from the pinned section and re-inserts into the main list at its `position`.

### 13.3 Drag-and-drop rules

Drop targets and effects (see `06-ui-ux/03-component-library.md` `DragGhost`):

| Source | Drop on | Effect |
|---|---|---|
| Item | Empty area inside same Collection | Reorder (`position` recalc) |
| Item | Another Item | Insert before/after based on cursor Y (top half = before) |
| Item | Group header | Move into Group at end |
| Item | Group body (expanded) | Reorder within Group |
| Item | Sidebar Collection | Move across Collections (cross-Org blocked, §12) |
| Item | "⭐ Starred" section | Star + pin at drop position |
| Item | Trash icon (sidebar footer) | Soft-delete with undo toast |
| Group | Another Collection in sidebar | Move Group + all its Items |
| Group | Group header | Disallowed (no nested Groups in v1) — cursor shows ⊘ |
| External browser tab | Collection body | Save as new Item at drop position |
| External browser tab | Group | Save as new Item inside Group |
| Multi-selection | Any valid target | Apply to all selected, atomic (`all_or_nothing=true` per `03-api-endpoints/08-items.md`) |

Visual feedback:
- Drop target shows a 2px brand-pink insertion line.
- Invalid targets show a red ⊘ cursor + tooltip explaining why.
- Auto-scroll engages when cursor is within 40px of viewport edge during drag.

### 13.4 Undo-delete toast

Every soft-delete (Item, Group, Collection) shows a toast at bottom-center for **8 seconds** containing:

- Icon (matches deleted entity type)
- "{Name} deleted" message
- "Undo" button (calls restore endpoint, see `03-api-endpoints/08-items.md` `POST /v1/items/:id/restore`)
- Auto-dismiss countdown ring

Bulk-delete shows "{N} items deleted" with a single Undo that restores all. Toast is dismissable manually (`Esc` or X). After dismissal, restore is still possible via Trash for 30 days (per §1).

### 13.5 Keyboard shortcuts (Collection scope)

Cross-ref `06-ui-ux/08-keyboard-input.md`. Active when focus is inside a Collection view:

| Shortcut | Action |
|---|---|
| `↑` `↓` | Move selection between Items |
| `←` `→` | Collapse / expand Group |
| `Enter` | Open selected Item in new tab |
| `Cmd/Ctrl+Enter` | Open selected Item in current tab |
| `Space` | Toggle multi-select on focused Item |
| `Shift+↑/↓` | Extend multi-selection |
| `Cmd/Ctrl+A` | Select all Items in current Collection |
| `S` | Star / unstar focused Item |
| `T` | Open tag picker for focused Item |
| `M` | Open Move dialog for focused selection |
| `Delete` / `Backspace` | Soft-delete focused selection (with undo toast) |
| `F2` | Rename focused Item or Collection title |
| `/` | Focus search-within-collection |
| `Cmd/Ctrl+D` | Duplicate Collection |
| `Cmd/Ctrl+Shift+S` | Save current browser tab to this Collection |

### 13.6 Visual style (Toby alignment)

- Primary brand color: Toby pink (HSL `343 79% 60%` ≈ `#EC4868`) per `06-ui-ux/01-design-tokens.md` `--primary`.
- Item card: rounded `8px`, hover lifts shadow-sm → shadow-md, favicon 16×16 left, title truncates at 1 line, domain in muted text below.
- Starred section divider: 1px `--border`, "⭐ Starred ({count})" label in muted text.
- Empty Collection: centered illustration + "Save your first tab" primary button + keyboard hint chip (`Cmd/Ctrl+Shift+S`).
- Grid view tile: 192×128, favicon top-left, title overlay on bottom gradient, color label as 4px left border.

### 13.7 Open behaviour parity

- Click Item → opens in new tab (configurable in Account settings to "current tab").
- Cmd/Ctrl+click → opens in background tab.
- Shift+click → opens in new window.
- Middle-click → opens in background tab.
- "Open all" respects per-Item `last_opened_at`; emits `item.opened` events with `source: "open_all"` (per `03-api-endpoints/08-items.md`).

### 13.8 Telemetry additions

Append to §11:

- `collection.toolbar.action` `{ action: save_tab|save_all|open_all|view_switch|sort_change }`
- `collection.starred.toggled` `{ entity: item|group, starred: bool }`
- `collection.dragdrop` `{ source_type, target_type, cross_collection: bool }`
- `collection.undo_delete.clicked` `{ entity, elapsed_ms }`

### 13.9 Locked decisions (Session 52, formerly SI-021 parked)

The following defaults are now **locked** for v1. They are the defaults documented in `20-roadmap/07-build-readiness.md §4` and have been promoted to normative because the original Toby reference is unavailable for re-paste; if Toby's actual values differ, future change lands as a spec patch with rationale.

- **Open All cap:** 50 tabs (browser perf safe). Above 50, the UI shows a confirm dialog "Open N tabs in new window?" with explicit confirm.
- **Nested Groups:** depth = 1. A Group cannot contain another Group. Drag of a Group onto a Group is rejected with toast "Groups can't be nested".
- **Color label palette:** 9 values, locked to the `color_label` enum in `02-data-model/05-item.md` and `--color-label-*` tokens in `06-ui-ux/01-design-tokens.md §1.6`. Not extensible in v1.

