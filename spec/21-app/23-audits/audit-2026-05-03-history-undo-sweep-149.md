---
audit-date: 2026-05-03
next-audit-by: 2027-05-03
audit-type: ad-hoc
status: closed
---

# Audit-149 — History & Undo Sweep

**Date:** 2026-05-03 (Session 149)
**Scope:** `spec/21-app/12-history-undo/` — 5 files (`00-overview.md`, `01-event-log.md`, `02-undo-redo.md`, `03-conflict-resolution.md`, `readme.md`) + `flow-diagram.mmd`. 615 lines total.
**Trigger:** User `next`; folder never broadly audited.

## Method

- `rg` for `workspace`, hex colors, non-`/v1/` paths.
- `npx tsx scripts/lint/ulid-placeholder.ts` (post-SI-030 verifier).
- Cross-checked entitlement-key SoT, realtime-channel form, and `HISTORY_*` error-code registration.

## Findings

**Zero defects.** All checks clean:

| Check | Result |
|---|---|
| `workspace` literal | 0 occurrences |
| Hard-coded hex | 0 |
| Non-`/v1/` API paths | 0 |
| ULID placeholders | 0 (post-SI-030) |
| Retention SoT (`features.history.retention_days`) | ✅ resolved through entitlement engine + plans matrix §8 (no inline values) |
| Time-travel entitlement key (`features.history.time_travel`) | ✅ cited consistently in `02-undo-redo.md §2` and `01-event-log.md §7` |
| Realtime channel | ✅ `/rt` per Org (matches `08-sharing-collab/14-realtime-transport.md`) |
| Endpoint canonicality | ✅ `01-event-log.md §13` defers to `03-api-endpoints/14-history.md` SoT |
| Error codes | ✅ All 3 `HISTORY_*` codes (`HISTORY_ALREADY_UNDONE`, `HISTORY_ENTITY_MODIFIED_AFTER_EVENT`, `HISTORY_NOT_UNDOABLE`) registered at `03-api-endpoints/18-error-codes.md:181-183` |
| Identifier rule | ✅ All ID fields typed `UUIDv7` |

## Result

Folder clean. No patches required.

## Files changed

- `spec/21-app/00-conversation-log.md` (append entry)
- `spec/21-app/23-audits/audit-2026-05-03-history-undo-sweep-149.md` (new)
