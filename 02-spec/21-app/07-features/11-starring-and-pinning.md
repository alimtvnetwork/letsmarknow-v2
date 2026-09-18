# Starring & Pinning

Two distinct lightweight signals for "I care about this" and "Keep this on top".

---

## 1. Star

- Per-Account boolean on any entity (Item / Collection / Group).
- Stars are private to the Account (not shared with Members).
- Starred entities aggregate under sidebar "Starred" section.
- Toggle: card overlay icon, right-click menu, `s` shortcut, command palette.
- Starring an Item that's been deleted later: star removed automatically when Item is purged.

### 1.1 Storage
- `account_stars { account_id, entity_type, entity_id, created_at }` join table.
- Server enforces unique constraint; idempotent toggle.

### 1.2 Sidebar Starred section
- Up to 20 visible; "See all" link to `/me/starred`.
- Sorted by recency starred (configurable to alphabetical).
- Group by Type toggle.

## 2. Pin

- Per-Org pin on Collection / Group / Item that boosts position to the top.
- Pins are visible to all Members (collaborative signal).
- Multiple pins ordered by `pin_position_hint`.
- Toggle from card menu or `Cmd/Ctrl+P`.

### 2.1 Storage
- `entity.pinned_at` (timestamp; null = unpinned).
- `entity.pin_position_hint` (float, only used among pinned siblings).

### 2.2 Render
- Pinned items grouped at the top with subtle "Pinned" divider.
- Pin icon visible in card corner.
- Cannot drag a non-pinned item above a pinned one without pinning it.

## 3. Permissions

| Action | Free | Pro | Team | Roles |
|---|---|---|---|---|
| Star (private) | ✅ | ✅ | ✅ | any |
| Pin (collaborative) | ✅ | ✅ | ✅ | Editor+ |
| Pin in shared view | ❌ | ✅ | ✅ | Owner of share |

## 4. Shared views

- Star is private; never appears in shared views.
- Pinned items appear at top in shared views (Pro+ owners can disable in share settings).

## 5. UX details

- Star icon: filled gold when starred, outline when not.
- Pin icon: small pushpin glyph (Lucide `Pin`).
- Tooltip: "Star (private)" / "Pin to top (visible to everyone)" — clarifies privacy.

## 6. Entitlements

| Feature | Free | Pro | Team |
|---|---|---|---|
| Star | ✅ | ✅ | ✅ |
| Pin Items | ✅ | ✅ | ✅ |
| Pin Collections in sidebar | ❌ | ✅ | ✅ |
| Pin Groups in column view | ❌ | ✅ | ✅ |

## 7. Telemetry

- `star.toggled` `{ entity_type, on: bool }`
- `pin.toggled` `{ entity_type, on: bool }`
- `starred.section_clicked`

## 8. Edge cases

| Case | Behavior |
|---|---|
| Star a deleted item from Trash | Disallowed; stars require active entities |
| Pin then move Item to another Collection | Pin preserved (per-item flag) |
| Pin then archive Collection | Pin retained but invisible until unarchived |
| Two members pin/unpin concurrently | Last write wins; History event records both |

## 9. A11y

- Star/Pin buttons have `aria-pressed`.
- Starred section uses `aria-label="Starred (private to you)"`.
- Pinned divider uses heading semantics in lists.

## 10. Tests

- Unit: toggle reducer; idempotent.
- E2E: star → assert sidebar update; unstar → assert removal.
- Concurrency: two users pin/unpin same item; final state consistent.
