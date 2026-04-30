<!--
audit-date: 2026-04-30
next-audit-by: 2026-10-27
audit-type: ad-hoc
status: closed
closed-because: 4 findings opened and closed same session — EX1 (popup §14 broken §-anchor → added §1.1 tab bar), EX2 (02-surfaces missing Open Tabs + Next surfaces → added §11 + §12), EX3 (12-messaging missing NEXT_* messages → added 4 surface→SW + 4 broadcasts), EX4 (SW missing realtime subscription → added §5.1). All 17 lint sub-checks green.
audit-id: 108
scope: spec/21-app/04-extension/
score-before: 100/100
score-after: 100/100
findings: 4 (all closed same session)
-->

# Audit 108 — `04-extension/` gap-sweep

## Scope

All 21 files in `spec/21-app/04-extension/`. Focus areas:
1. Popup §14 ↔ next-queue cross-checks (per memory hint).
2. MV3 surface inventory completeness.
3. Side panel + open-tabs panel cross-references.
4. Realtime channel subscription wiring (post Session 104 next-queue work).

## Method

1. Read `00-overview.md`, `02-surfaces.md`, `03-service-worker.md`,
   `04-popup.md`, `12-messaging.md`, `16-open-tabs-panel.md` end-to-end.
2. `grep -rn "next\|Next\|popup_default_tab"` across the folder.
3. Cross-checked against `02-data-model/12-next-item.md`,
   `02-data-model/11-account.md` (`account_setting.popup_default_tab`),
   `08-sharing-collab/14-realtime-transport.md` (`account:{account_id}:next`
   channel + 4 events), and `07-features/17-next-queue.md`.

## Findings

### EX1 (S2) — Popup §14 references nonexistent §2 tab bar

**Closed.** `04-popup.md §14` opening note said *"the user taps the **Next**
entry in §2's tab bar"* — but §2 is the state machine, NOT a tab bar.
No §1 anatomy element declared a tab bar. Fix: added **§1.1 Tab bar
(segmented control, 3 tabs)** with explicit body-tab table and default-tab
condition matrix; updated §14 cross-reference to §1.1; added Saved tab to
§1 anatomy ASCII.

### EX2 (S2) — `02-surfaces.md` missing Next + Open Tabs surfaces

**Closed.** Surface inventory listed Popup, New Tab, Side Panel, Options,
Omnibox, Context Menu, Shortcuts, Notifications, Content Script, SW —
but did NOT mention the **Open Tabs Panel** (own file `16-open-tabs-panel.md`,
SI-021 Toby parity) nor the **Next Queue Panel** (own file in
`07-features/17-next-queue.md`). Fix: added §11 Open Tabs Panel and §12
Next Queue Panel; updated §1 Toolbar Popup description to declare the
3-tab body region.

### EX3 (S2) — `12-messaging.md` missing NEXT_* messages

**Closed.** Message catalog had zero `NEXT_*` types. With Session 104
declaring next-queue settings on Account and Session 104 registering the
`account:{account_id}:next` realtime channel + 4 events, the SW must
expose surface↔SW operations AND broadcast realtime events. Fix:
- Added `NEXT_LIST`, `NEXT_ADD`, `NEXT_UPDATE`, `NEXT_REMOVE` to surface→SW table.
- Added `NEXT_ITEM_ADDED` / `_UPDATED` / `_REMOVED` / `_TOMBSTONED` broadcasts to SW→surfaces table.

### EX4 (S3) — SW lifecycle didn't subscribe to next channel

**Closed.** `03-service-worker.md §5` listed alarms but had no realtime
section. Fix: added **§5.1 Realtime subscriptions** declaring the
`account:{account_id}:next` Supabase Realtime subscription, the relay
mapping to `NEXT_ITEM_*` broadcasts, and tear-down on last-port-disconnect.
Also added `NEXT_LIST`/`ADD`/`UPDATE`/`REMOVE` to the §4 `Msg` union.

## Linter results (post-fix, all green)

| Sub-check | Result |
|---|---|
| `endpoint-counts` | ✅ 171 rows |
| `pagination-param` | ✅ 43 files |
| `realtime-channel-syntax` | ✅ 18 files |
| `allowlist-discipline` | ✅ 12 allowlists |
| `next-singleton-invariants` | ✅ 328 files |
| `role-enum` | ✅ |
| `link-check` | ✅ |
| `folder-overview` | ✅ |
| `audit-cadence` | ✅ |
| `error-code-casing` | ✅ catalog 84 |
| `naming-convention` | ✅ |
| `sku-naming` | ✅ |
| `env-var-naming` | ✅ |
| `money-units` | ✅ |
| `pricing-source` | ✅ |
| `storage-path` | ✅ |
| `backticked-path-resolution` | ✅ |

## Score

100/100/100. No score change (4 findings opened + closed same session).

## Notes for next sweep

- `15-visualization/` and `16-notifications-updates/` still untouched
  this cycle.
- `07-features/` has 16 files beyond `17-next-queue.md` — broad target.
