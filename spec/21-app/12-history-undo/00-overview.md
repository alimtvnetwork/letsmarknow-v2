# 00 — History & Undo Folder Overview

> **Purpose.** Define the **append-only event log**, the **undo/redo stack** the user sees, and the **conflict resolution** rules when concurrent edits arrive (extension-offline-write meets web-app-online-write meets collaborator-write). This folder is the truth source for "what happened" and "how do we put it back".

---

## 1. Responsibilities

1. **Event log.** Every write produces a `history_event` row: actor, action verb, target, before/after diff, timestamp, source surface (web/extension/api).
2. **Undo/redo stack.** Per-user, per-session ordered list of recently performed actions; bounded length; expiry.
3. **Conflict resolution.** Rules for merging concurrent writes: last-writer-wins for text fields, set-union for tags, structured merge for ordered lists.
4. **Surfaces of "history".** Activity feed (`05-web-app/10-activity-feed.md`), audit log (`08-sharing-collab/09-audit-log.md`), per-Item history drawer, undo toast.

---

## 2. File-by-file behaviour

| File | Owns |
|---|---|
| `01-event-log.md` | Event row schema, action verbs catalogue, before/after diff shape, retention. |
| `02-undo-redo.md` | Per-user undo stack: depth, expiry, scope (which actions are undoable), keyboard chord. |
| `03-conflict-resolution.md` | Per-field merge strategy; vector-clock or `updated_at`-based detection; UI for unresolvable conflicts. |

---

## 3. Tasks performed by this folder

- **Write an event** for every state-changing API call.
- **Expose an undo affordance** in the UI (toast, palette, shortcut).
- **Detect concurrent writes** and apply the documented merge strategy.
- **Feed downstream consumers**: activity feed, audit log, per-Item history drawer.

---

## 4. What this folder is NOT

- **Not the audit log surface.** That is `08-sharing-collab/09-audit-log.md` (which reads the same `history_events` rows but filters and renders for compliance).
- **Not the activity feed UI.** That is `05-web-app/10-activity-feed.md`.
- **Not the trash.** Soft-delete is a separate concept owned by `07-features/16-delete-with-undo.md` and `05-web-app/09-trash.md`.

---

## 5. Cross-references

- Event row table: `02-data-model/09-history-event.md`.
- Activity feed page: `05-web-app/10-activity-feed.md`.
- Audit log surface: `08-sharing-collab/09-audit-log.md`.
- Undo toast contract: `06-ui-ux/11-feedback.md`.
- Delete-with-undo feature: `07-features/16-delete-with-undo.md`.
