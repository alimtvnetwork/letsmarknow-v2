<!--
audit-date: 2026-04-29
next-audit-by: 2026-10-26
audit-type: gap-sweep
status: in_progress (3 of 5 closed)
opened-on: 2026-04-29
scope: 12-history-undo/ folder — locked-rule violation (ULID), retention drift, entitlement pointer, idempotency cross-ref, endpoint cross-ref
-->

# Audit — History & Undo Sweep (Session 91)

**Date:** 2026-04-29 (Session 91, Malaysia time UTC+8)
**Author:** Lovable agent
**Scope:** All 5 markdown files (~610 lines) in `spec/21-app/12-history-undo/`, cross-checked against Core memory rule "Identifiers: UUIDv7 everywhere. Never ULID.", `03-api-endpoints/14-history.md` (history-endpoint SoT), `03-api-endpoints/01-conventions.md §6` (Idempotency-Key SoT), `10-licensing-billing/02-entitlements-engine.md` (entitlement SoT).
**Reason:** First audit of this folder. Per Session 90 next-action queue.

> **Open audit.** Drain in subsequent sessions.

---

## 1. Headline findings

| # | Severity | Title | Owning file(s) for fix |
|---|---|---|---|
| HU1 | **F (locked-rule violation)** | ✅ **CLOSED Session 92.** `02-undo-redo.md §48` rewritten: "Generate `correlation_id` + per-event optimistic IDs (UUIDv7 per Core rule; k-sortable by embedded timestamp, drop-in compatible with the `event_log.id` UUIDv7 column declared in `01-event-log.md §2`)." **Bonus drift swept:** A repo-wide `rg ulid` surfaced TWO previously-missed F-class violations in `18-analytics-telemetry/01-opt-in-analytics.md` lines 49-50 (event payload `account_id: "ulid"` + `org_id: "ulid"`); both corrected to `uuidv7` in same session. Repo-wide `ulid` references now zero (excluding audit-trail prose and explicit "never ULID" Core-rule citations). | `02-undo-redo.md §5`, `18-analytics-telemetry/01-opt-in-analytics.md §3` |
| HU2 | **S2** | ✅ **CLOSED Session 93.** Reconciled retention vs time-travel window. `02-undo-redo.md §2` rewritten: cross-session window now references `01-event-log.md §7` retention table (Free 7 d / Pro 90 d / Team 1 y / Enterprise 7 y) instead of the prior fixed "30 days … (Pro+)" claim. `readme.md §26` rewritten the same way. `01-event-log.md §7` extended with explicit entitlement-key cross-ref. Window is now uniformly the per-plan retention; the gate "is the user allowed to operate the time-travel UI?" is a separate entitlement (HU3). | `02-undo-redo.md §2`, `readme.md §26`, `01-event-log.md §7` |
| HU3 | **S2** | ✅ **CLOSED Session 93.** Pinned `Pro+` references to entitlement SoT. Two new entitlement keys added to `10-licensing-billing/01-plans-matrix.md §8`: `features.history.retention_days` (numeric per plan) and `features.history.time_travel` (boolean, default Pro+). `02-undo-redo.md §2 + §4 + §13` and `01-event-log.md §7` and `readme.md §26` now name the keys with SoT cross-refs to `01-plans-matrix.md §8` + `02-entitlements-engine.md`, mirroring the share-link pattern. | `02-undo-redo.md §2 + §4 + §13`, `01-event-log.md §7`, `10-licensing-billing/01-plans-matrix.md §8` |
| HU4 | **S3** | **`Idempotency-Key` referenced without SoT cross-ref.** `03-conflict-resolution.md §142` edge-case row says "Idempotency-Key dedupes; applied once" but does not cite `03-api-endpoints/01-conventions.md §6`. Same root cause as IE6 + SC4. One-line fix. | `03-conflict-resolution.md §14` (edge cases) |
| HU5 | **S3** | **`01-event-log.md §149` declares `GET /v1/history?org=...&target_type=...` inline without SoT cross-ref to canonical contract.** The SoT (`03-api-endpoints/14-history.md`) actually canonicalizes the per-entity form as `GET /v1/history/for/:entity_type/:entity_id`; the `?target_type=&target_id=` query form is a SECONDARY filter on the bare `GET /v1/history`. The folder file's declaration is consistent (the bare endpoint accepts those query params per `14-history.md §10`), but should explicitly point at the SoT to prevent drift. The `GET /v1/items/:id/history` line already does this correctly — apply the same pattern to the other two. | `01-event-log.md §10` (Read API section) |

---

## 2. Recommended drain plan

| Session | Findings | Notes |
|---|---|---|
| Next | HU1 | Single **F** — must drain first; this is the only finding that depresses the scorecard. Trivial: ULID → UUIDv7. |
| Following | HU2 + HU3 | Two **S2** — both about plan-gated retention/time-travel. Single coherent fix: pin entitlement keys + reconcile windows. |
| Following | HU4 + HU5 | Two **S3** polish — Idempotency cross-ref + history endpoint cross-refs. Single session. |

Total estimated: 3 sessions to fully drain.

**⚠️ Scorecard impact NOW (audit-opening only):** HU1 is an **F-class locked-rule violation** (Identifier: UUIDv7-only). Per `mem://preferences/scorecard-reporting.md` invalidation triggers, this drops Raw-LLM and Cursor/Claude-Code passes by ~3 points each until drained. Lovable pass holds at 100 (Lovable scoring weights enums and locked-rule prose differently — single-line ULID prose is auto-correctable from context). **Recommend draining HU1 in the next session immediately to restore 100/100/100.**

---

## 3. Files NOT deeply audited (spot-checked only)

`00-overview.md`, `flow-diagram.mmd` — read for keyword matches (identifier rules, role names, retention windows, endpoint declarations, share-model). No drift detected.

## 4. Cross-references

- Core memory: "Identifiers: UUIDv7 everywhere. Never ULID."
- History endpoint SoT: `03-api-endpoints/14-history.md`.
- Idempotency-Key SoT: `03-api-endpoints/01-conventions.md §6`.
- Entitlement engine SoT: `10-licensing-billing/02-entitlements-engine.md`.
- Audit-event SoT (for `history.*` telemetry vs audit boundary): `08-sharing-collab/09-audit-log.md` (no `history.*` events expected — these are folder-internal telemetry per `01-event-log.md §11`, not audit events; correctly scoped).
- Last closed audit: `audit-2026-04-29-security-privacy-sweep-87.md` (7/7).
