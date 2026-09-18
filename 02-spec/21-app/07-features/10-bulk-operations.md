# Bulk Operations

Multi-select + apply action to many entities at once.

---

## 1. Selection

- Click an item's checkbox (visible on hover or always in Compact) to select.
- `Space` toggles current focused card's selection.
- `Shift+Click` selects range.
- `Cmd/Ctrl+A` selects all in current view.
- `Esc` clears selection.

Selection persists across:
- View-mode changes.
- Filter changes (selection filtered to visible).
- Pagination (server returns selection set; UI maintains).

Cleared on:
- Route change (with confirmation if > 5 selected).
- Sign-out.

## 2. Bulk action bar

- Slides up from bottom when selection ≥ 1.
- Shows count "3 items selected".
- Action buttons: Move, Tag, Star, Share, Delete, Open All, Export selected, ⋯ More.
- "Clear" (Esc) on the right.

## 3. Actions

| Action | Behavior |
|---|---|
| Move | Picker → choose Collection/Group → server batch PATCH |
| Tag (add/remove) | Chip input modal; preview affected count |
| Star (toggle) | All to same state |
| Share | Creates a one-off Collection (or temp Share) of selected items |
| Delete | Soft-delete; one batch History event for undo |
| Open All | Up to 25 in new tabs; > 25 confirmation |
| Export selected | Native JSON / HTML / CSV |
| Duplicate | Up to 100; over → split |
| Recolor (tags only) | when only tags selected via Tag manager |

## 4. Server-side

- Batch endpoints used (`POST /v1/bulk/items`, etc.).
- Operations in single transaction; on partial failure, returns per-item result; UI surfaces failures inline.
- Concurrency safe: each item carries its own ETag if known; conflicts skipped per item with reason.

## 5. Performance

- Client batches up to 500 items per request.
- Long-running batch (> 1000) queued as background job; UI shows progress in a sticky toast.

## 6. Permissions

- Action only allowed if user has rights on ALL selected; otherwise pre-flight error: "You don't have access to N of these items."

## 7. Entitlements

- Bulk operations available on every plan.
- Bulk count caps:
  - Free: 50 per action
  - Pro: 500
  - Team: 5,000

## 8. Telemetry

- `bulk.selected` `{ count }`
- `bulk.action_invoked` `{ action, count }`
- `bulk.action_completed` `{ action, success_count, fail_count, duration_ms }`
- `bulk.cleared` `{ via }`

## 9. A11y

- Bar `role="region" aria-label="Bulk actions"`.
- Selection count announced via live region on every change (debounced 200 ms).
- All actions keyboard-reachable; bar focusable on `F6` cycle.

## 10. Edge cases

| Case | Behavior |
|---|---|
| Selection includes archived items | Allowed; actions apply consistently |
| Selection spans Collections | Move requires single destination; Tag/Delete fine |
| Selection includes shared item | Share Action creates new share; doesn't modify existing |
| User loses connection mid-batch | Operations queued; resumed on reconnect; partial state shown clearly |
| User changes filter so some selected items hidden | Bar still shows full count; "show selected" toggle in bar reveals |

## 11. Tests

- Selection state reducer: unit tests for all interactions.
- E2E: 3-item move; partial failure simulation.
- Load: 5,000-item bulk delete; assert chunked job and progress.
