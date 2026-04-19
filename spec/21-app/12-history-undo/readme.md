# 12 — History & Undo

Every mutation is an event. Undo and redo always work. Concurrent users converge.

This folder defines the event log, undo/redo semantics, and conflict resolution. It is the spine that makes the app feel forgiving and trustworthy.

## Reading order

1. `01-event-log.md` — the append-only history of mutations.
2. `02-undo-redo.md` — local + server-aware undo/redo semantics.
3. `03-conflict-resolution.md` — what happens when two people edit at once.

## Files

| File | Purpose | Phase |
|---|---|---|
| `01-event-log.md` | Append-only mutation history | P0 (table + read-only viewer; emitter catalog forward-spec per phase) |
| `02-undo-redo.md` | Ctrl+Z / Ctrl+Y semantics | P1 (Undo toast UI) / P2 (server-aware redo across sessions) |
| `03-conflict-resolution.md` | Multi-user merge rules | P2 (collab) |

> **Phase legend:** P0 = MVP, P1 = v1, P2 = Collab, P3 = Mindmap/AI, P4 = Cross-browser. Source of truth: `20-roadmap/`.

## Locked rules

- **Every mutation produces a HistoryEvent.** Reads do not.
- **Ctrl+Z always works** within the user's last 200 actions in the current session, AND last 30 days server-side.
- **Undo is per-user, per-Org.** Person A's undo never affects Person B's pending changes directly; conflict rules govern overlap.
- **Soft delete first, hard delete after grace.** Default grace 30 days; lifetime undo possible within grace.
- **Optimistic UI is mandatory.** Mutations apply locally instantly; server confirms; rollback on reject.
- **Conflict resolution is deterministic.** Same inputs → same outcome on every client.
- **No mutation is silent.** Toast (with Undo) for visible actions; inbox event for background actions.
- **History is queryable.** Any item / collection / share has a "History" tab showing who did what and when.
- **Sensitive data redacted.** Password hashes, share secrets, tokens never appear in history payloads.
