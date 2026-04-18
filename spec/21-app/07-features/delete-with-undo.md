# Delete with Undo

> 📌 **Pointer file.** Soft-delete grammar lives in `01-information-architecture/hierarchy.md §3.5`. Undo/redo mechanics live in `12-history-undo/undo-redo.md`. Trash UI lives in `05-web-app/trash.md`.

This file ties the three together so a contributor lands here from the feature index and is routed correctly.

---

## 1. The contract

Every destructive action on a content entity (Space, Collection, Group, Item, Tag, Share):

1. Sets `deleted_at = now()` (soft).
2. Emits a History Event with `is_undoable = true`, `before` snapshot.
3. Surfaces a **toast** with "Undo" CTA (5 s timeout) — see `06-ui-ux/feedback.md`.
4. After 30 d in trash → background job hard-deletes (see `12-history-undo/event-log.md` for retention).
5. **GDPR DSR** bypasses the 30 d grace.

## 2. UI surfaces

- **Toast undo (5 s):** the primary affordance; one click reverses immediately.
- **Trash page** (`/org/:id/trash`): list of soft-deleted entities, restore individually or bulk, "Empty Trash" button.
- **Command palette:** "Undo last delete" (`Ctrl+Z`).
- **History panel:** scroll back through events and restore any.

## 3. Bulk delete

- Bulk select N items → delete → single batch History Event with shared `batch_id` → single Undo restores all.

## 4. Cascade

Soft-deleting a parent soft-deletes all descendants in one batch (same `batch_id`). Restoring the parent restores everything in that batch — but children deleted **independently** earlier are NOT restored.

## 5. Cross-references

- `01-information-architecture/hierarchy.md §3.5` — soft-delete rules.
- `12-history-undo/undo-redo.md` — Undo/Redo stack mechanics.
- `12-history-undo/event-log.md` — retention.
- `05-web-app/trash.md` — Trash UI.
- `06-ui-ux/feedback.md` — toast pattern.
- `19-security-privacy/gdpr-ccpa.md` — DSR override.
