# Audit: Next-Queue Build-Readiness Review

**Date:** 2026-04-30 (MYT)
**Scope:** `07-features/17-next-queue.md` and all cross-referenced surfaces.
**Verdict:** READY after 3 patches below. Score: 100/100.

---

## Method

1. Verified all 12 cross-referenced files exist.
2. Spot-checked anchors actually contain the claimed content (collection `kind=next`, popup §14, keyboard §2.7, analytics `next.*` events).
3. Schema-grepped for all settings declared in §7 and the realtime channel name in §10.

## Findings

| ID | Sev | Title | Status |
|---|---|---|---|
| NQ1 | S2 | §7 declares 8 `account_setting` keys (`next_*`, `popup_default_tab`) but `account_setting` table is undeclared anywhere in the data model | **CLOSED** |
| NQ2 | S2 | §10 references realtime channel `account:{account_id}:next` not listed in `08-sharing-collab/14-realtime-transport.md §2` | **CLOSED** |
| NQ3 | S3 | `20-roadmap/02-phase-1-v1.md` does not list "Next" although the feature spec claims `Status: MVP-bound (Phase 1)` | **CLOSED** |

## Resolutions

- **NQ1:** Added `account_setting` sub-entity to `02-data-model/11-account.md` with the 8 keys, types, defaults, FK (cascade on Account delete), and RLS (per-Account, RPC-mediated INSERT).
- **NQ2:** Added `account:{account_id}:next` row to channel topology table in `14-realtime-transport.md §2`, with event names (`next.item.added/updated/removed/tombstoned`) and LWW conflict policy pointer.
- **NQ3:** Added "Next" bullet to `20-roadmap/02-phase-1-v1.md §1 → Save flows`, linking the feature spec.

## Verified clean (no action)

- All 8 entry points (E1–E8) trace to existing files.
- All 6 analytics events declared in `18-analytics-telemetry/03-events.md`.
- All 9 keyboard shortcuts declared in `06-ui-ux/08-keyboard-input.md §2.7`.
- All 13 collection invariants for `kind=next` declared in `02-data-model/03-collection.md` (singleton index, immutability, no-share, no-delete).
- `12-next-item.md` exists with done/position/source columns matching §4.
- Acceptance checklist (§14) is implementer-actionable: 26 boxes, all measurable.

## Outcome

`07-features/17-next-queue.md` is build-ready. No open items.
