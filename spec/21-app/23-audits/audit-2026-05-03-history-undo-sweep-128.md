# Audit 128 — `12-history-undo/` Sweep

**Date:** 2026-05-03 MYT
**Session:** 128
**Scope:** First broad sweep of all 4 spec files in `spec/21-app/12-history-undo/` (touched in S112 for HISTORY_* family but never broadly swept).

---

## 1. Findings

| Check | Result |
|-------|--------|
| ULID references | 0 ✅ |
| Bare "Workspace" | 0 ✅ |
| Hard-coded hex | 0 ✅ |
| Non-`/v1/` paths | 0 ✅ |
| Endpoint inventory cross-check | All 3 paths declared (`/v1/history`, `/v1/history/:id`, `/v1/items/:id/history`) ✅ |
| HISTORY_* error codes | All 3 referenced codes registered in `03-api-endpoints/18-error-codes.md` (lines 181–183) ✅ |

---

## 2. Patches

**None.**

---

## 3. Notes

- `02-undo-redo.md` correctly switches on `code` (locked rule), never on `details.reason`.
- `01-event-log.md` is the SoT for the event log; correctly referenced from `07-features/16-delete-with-undo.md`.

---

## 4. Outcome

`12-history-undo/` passes broad sweep clean. Score impact: 0.
