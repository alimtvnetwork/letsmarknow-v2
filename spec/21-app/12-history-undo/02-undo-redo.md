# Undo / Redo

Ctrl+Z / Ctrl+Y semantics. Local-first, server-confirmed, conflict-aware.

---

## 1. Goals

1. **Always works.** Every visible mutation is undoable.
2. **Instant.** Local rollback in < 16 ms (next frame).
3. **Trustworthy.** No ghost actions; never undo something that was already undone.
4. **Cross-device.** A user can undo on web what they did on the extension.
5. **Multi-user safe.** Undoing your own action never silently overrides someone else's later edit.

## 2. Stacks

Per `(account_id, org_id, session_id)`:
- **Undo stack** — actions taken by this user in this session (LIFO).
- **Redo stack** — actions undone (cleared on any new mutation).

Capacity: 200 entries (configurable, low ceiling).

Cross-session ("server undo"): server-side history is queryable up to the per-plan retention window declared in `01-event-log.md §7` (Free 7 d / Pro 90 d / Team 1 y / Enterprise 7 y; SoT key `features.history.retention_days` per `10-licensing-billing/01-plans-matrix.md §8`). Within that window a "Time travel" UI lets the user pick any past event and inverse it; the UI itself is gated on entitlement key `features.history.time_travel` (resolved per `10-licensing-billing/02-entitlements-engine.md`; default Pro+ in current matrix).

## 3. What goes on the stack

A "user action" = the `correlation_id` group of events. Stack entries are correlation IDs, not individual events.

Each stack entry stores:
- `correlation_id`
- `events: HistoryEvent[]` (all events in the correlation)
- `client_intent` (the high-level label shown in toast: "Moved 5 items")
- `applied_at`
- `is_undone: bool`
- `redo_correlation_id?` (set when undone — points to the inverse correlation)

## 4. Triggers

- `Ctrl+Z` / `Cmd+Z` — undo last.
- `Ctrl+Shift+Z` / `Cmd+Shift+Z` / `Ctrl+Y` — redo last.
- Toast "Undo" button (visible 6 s).
- Command palette: `Undo`, `Redo`.
- Right-click menu in History tab: "Undo this action" (gated on entitlement `features.history.time_travel`; default Pro+ — SoT `10-licensing-billing/01-plans-matrix.md §8`).

## 5. Optimistic application

Every mutation:
1. Generate `correlation_id` + per-event optimistic IDs (UUIDv7 per Core rule; k-sortable by embedded timestamp, drop-in compatible with the `event_log.id` UUIDv7 column declared in `01-event-log.md §2`).
2. Apply to local cache immediately.
3. Push events to server in a single transaction request.
4. Server validates + commits + returns canonical events.
5. Client reconciles: replace optimistic IDs with server IDs; broadcast complete.
6. On reject: roll back local cache; show error toast with retry.

## 6. Undo execution

User triggers undo:
1. Pop top of undo stack.
2. Compute inverse correlation:
   - For each event (in reverse order): apply `inverse_recipe`.
   - Wrap in a new correlation marked `kind=undo`.
3. Apply locally; push to server.
4. On server-accept: move popped entry to redo stack with `is_undone=true`.
5. On server-reject (conflict — see § 8): re-push original entry; show "Couldn't undo: <reason>".

## 7. Redo execution

User triggers redo:
1. Pop top of redo stack.
2. Re-apply original events as a new correlation marked `kind=redo`.
3. On accept: push back to undo stack.
4. On reject: discard from redo; show toast.

## 8. Conflict semantics

Server checks before accepting an undo:
- Does the target still exist? (could have been hard-deleted)
- Has the target been modified by someone else since the original action?
- Would the undo violate current invariants? (e.g., re-add an item that exceeds plan cap)

Outcomes (canonical error codes per `03-api-endpoints/18-error-codes.md §3.10`):
| Situation | Behavior |
|---|---|
| Target missing (hard-deleted) | Reject with `GONE_HARD_DELETED`; offer "Recreate from snapshot" if the inverse_recipe carries a full payload |
| Target soft-deleted | Reject with `GONE_SOFT_DELETED`; offer "Restore then undo" two-step |
| Modified by others (no overlap) | Apply undo (some fields restore; others stay as-is) |
| Modified by others (overlap on same field) | Reject with `HISTORY_ENTITY_MODIFIED_AFTER_EVENT`; client surfaces diff toast: "Restored your title; their edit kept" — Pro+ shows side-by-side and may retry with `?force=true` |
| Already inverted | Reject with `HISTORY_ALREADY_UNDONE`; `details.undo_event_id` points to existing inverse |
| Event kind not user-undoable | Reject with `HISTORY_NOT_UNDOABLE` (e.g., `share.viewed`, `system.*` — see §13) |
| Plan cap exceeded on re-create | Reject with `BILLING_QUOTA_EXCEEDED`; explain |
| Permission lost | Reject with `PERM_DENIED`; suggest re-request access |

## 9. Multi-event correlations

For drag-and-drop / bulk:
- Undo reverses ALL events in the correlation atomically.
- If any single event undo fails: best-effort rollback of partially undone subset; report which succeeded.
- "Partially undone" stack entry kept; user can retry remaining.

## 10. Toast UX

After every visible mutation:
- Bottom-center toast: `<verb done> · Undo` (button).
- 6-second auto-dismiss.
- Stack-aware: if 5 toasts queue up, collapse to "5 changes · Undo all".
- Hover pauses dismissal.
- Keyboard: focus moves to Undo on `Ctrl+Z` press if toast still visible.

## 11. Persistence across sessions

- Undo stack lives in memory + IndexedDB (extension) / localStorage (web).
- Survives tab reload, extension SW restart, browser restart.
- Cleared on sign-out.
- Server-side history allows cross-device "Time travel" beyond local stack.

## 12. Trash & restore

Some "deletes" are heavy:
- Item / Collection / Group `.trashed` events move target to Trash; soft-delete with 30-day grace.
- Restore from Trash = analogous to undo (creates `*.restored` event referencing original).
- Hard delete after grace: `*.deleted` event; truly irrecoverable.
- Trash UI lists items with timer + Restore button.

## 13. System actions

- Imports, plan downgrades, share-revoke cascades all produce events with their own correlation.
- Most are NOT user-undoable from the stack (out of session; potentially destructive).
- "Time travel" (entitlement `features.history.time_travel`; default Pro+ — SoT `10-licensing-billing/01-plans-matrix.md §8`) can revert system actions case-by-case with explicit confirmation.

## 14. Edge cases

| Case | Behavior |
|---|---|
| User Ctrl+Z while toast still showing for same action | Single undo (same correlation; no double action) |
| Ctrl+Z spammed beyond stack | No-op + brief "Nothing to undo" toast |
| User in a Collection that no longer exists when undoing | Auto-navigate to nearest valid parent first |
| Undoing a `share.viewed` event | Not applicable; viewed events are not user-actions |
| Collaborative real-time: someone else's action appears between your action and your undo | Your undo only reverses YOUR events from the correlation |
| Undo of `import.committed` | Bulk-restore all imported items to their pre-import state (heavy; confirmation modal) |

## 15. Telemetry

- `undo.invoked` `{ via: "shortcut" \| "toast" \| "menu" }`
- `redo.invoked`
- `undo.applied` `{ correlation_kind, events_count, latency_ms }`
- `undo.rejected` `{ reason }`
- `time_travel.opened`
- `time_travel.event_reverted` `{ kind }`

## 16. Accessibility

- Undo / Redo also available via:
  - macOS Edit menu equivalent in command palette.
  - Browser Edit > Undo (web; we override `beforeinput` on document for our app shell only).
- Screen reader announces: "Undid: moved 5 items".
- Toast respects `prefers-reduced-motion` (no slide animation).

## 17. Tests

- Round-trip: apply → undo → state == before apply.
- Stack capacity overflow drops oldest, never newest.
- Conflict rejection paths.
- Multi-event correlation atomicity.
- Cross-session persistence.
- Performance: undo of 100-item bulk in < 100 ms locally.
- Keyboard event handling on web + extension surfaces.
