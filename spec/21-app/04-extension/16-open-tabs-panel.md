# 16 — Open Tabs Panel

> **Source:** SI-021 Toby parity. Toby's "Open Tabs" sidebar shows every tab currently open in every browser window and lets the user save them (individually, by window, or all) into a Collection. This file specifies our equivalent surface inside the extension.
>
> **Lives in:** extension popup (`04-popup.md`) **and** new-tab page (`05-new-tab.md`) as a togglable left rail. Not present on the web app.
>
> **Phase:** P1 (Phase 1 — V1, see `20-roadmap/02-phase-1-v1.md`).

---

## 1. Purpose

Give the user a live, always-current view of their open browser tabs alongside their saved Collections, so they can:

- See at a glance which tabs are open vs. saved.
- Save a single tab, a window's worth of tabs, or all open tabs into a Collection (existing or new) with one action.
- Jump-to-tab (focus an already-open tab) instead of opening a duplicate.
- Close tabs individually or in bulk after saving.

This panel is the **only** spec surface that observes live `chrome.tabs` state in real time. Everything else operates on the saved Item store.

## 2. Surface placement

| Surface | Behaviour |
|---|---|
| Popup (`04-popup.md`) | Renders as the right tab of a two-tab segmented control: `Saved` ↔ `Open Tabs (N)`. Defaults to `Open Tabs` when ≥1 tab matches no saved Item. Otherwise defaults to `Saved`. |
| New-tab page (`05-new-tab.md`) | Renders as a collapsible left rail (default expanded, `220px` wide). Toggle persisted in `chrome.storage.local` key `ui.openTabsRail.collapsed`. |
| Web app | Not rendered. Web app cannot observe browser tabs. |

## 3. Data model (live, not persisted)

Constructed in-memory from `chrome.tabs.query({})` plus a join against the local IndexedDB cache of Items (`lmn-cache`, store `items_by_url_normalized`).

```ts
type OpenTabRow = {
  tab_id: number;                    // chrome.tabs.Tab.id
  window_id: number;                 // chrome.tabs.Tab.windowId
  url: string;
  url_normalized: string;            // normalized per 11-import-export/11-dedup-algorithm.md §2
  title: string;
  favicon_url: string | null;
  pinned: boolean;
  audible: boolean;
  muted: boolean;
  active: boolean;                   // is the active tab in its window
  group_id: number | -1;             // chrome.tabs.Tab.groupId (Chrome's native group)
  match: {
    saved: boolean;                  // exact url_normalized match in cache
    item_id?: string;                // UUIDv7 if saved
    collection_id?: string;
    collection_name?: string;
  };
};

type OpenTabsState = {
  windows: Array<{
    window_id: number;
    focused: boolean;
    tabs: OpenTabRow[];
  }>;
  total: number;
  saved_count: number;
  unsaved_count: number;
};
```

State is recomputed on `chrome.tabs.onCreated`, `onRemoved`, `onUpdated` (status=complete), `onActivated`, `onMoved`, `onAttached`, `onDetached`. Debounced 100ms.

## 4. Layout & components

```
┌─ Open Tabs (12) ──────────────── [⟳] [⚙] ┐
│ ◉ Save all   |   Save unsaved (4)         │  ← bulk action bar
├───────────────────────────────────────────┤
│ ▾ Window 1 — 8 tabs              [Save 8] │
│   ✓ ChatGPT                  · saved      │
│   ☐ HN: Show HN              · new   [+] │  ← [+] = save just this tab
│   ☐ GitHub: lovable/repo     · new   [+] │
│   ✓ Linear                   · saved      │
│ ▾ Window 2 — 4 tabs              [Save 4] │
│   ☐ Figma file               · new   [+] │
│   …                                       │
└───────────────────────────────────────────┘
```

Components (cross-ref `06-ui-ux/03-component-library.md`):
- `SegmentedTabs` (popup only) — `Saved` / `Open Tabs (N)`
- `BulkActionBar` — sticky top, contains `Save all`, `Save unsaved (N)`, optional `Close saved tabs`
- `WindowGroup` — collapsible per Chrome window with header showing tab count + focused badge + per-window `Save N` button
- `OpenTabRow` — favicon, title (truncate 1 line), saved/new chip, hover-reveal `[+]` save button, secondary `⋯` menu (Jump to tab, Close tab, Save with options…)
- `EmptyState` — "No open tabs" (only possible if all browser windows closed; rare)

## 5. Interactions

### 5.1 Save single tab
- Click `[+]` on a row → opens inline destination picker (Collection autocomplete + "+ New collection" + optional Group).
- Pre-fills with most recently used Collection.
- `Enter` saves to highlighted destination, emits `item.created` with `source: "drag_from_tabs"`.
- After save: row's chip flips to `· saved`, `[+]` disappears, `match.saved=true`.

### 5.2 Save N (per window or all)
- Opens the same destination picker but with a count badge.
- "Save all" includes already-saved tabs only if user toggles "Re-save duplicates" (default OFF — duplicates skipped).
- Server call: `POST /v1/bulk/items` with `all_or_nothing: false` (per `03-api-endpoints/08-items.md`).
- Result toast: "Saved 8 tabs to {Collection}. Skipped 2 duplicates." with Undo (8s).

### 5.3 Save unsaved
- Convenience action equal to "Save all" with the duplicate filter forced ON.

### 5.4 Jump to tab
- Click row title (or `Enter` when focused) → `chrome.tabs.update(tab_id, {active: true})` + `chrome.windows.update(window_id, {focused: true})`.
- Closes the popup if invoked from popup.

### 5.5 Close tab
- `⋯` → Close tab → `chrome.tabs.remove(tab_id)`.
- Bulk: header overflow → "Close all saved tabs" closes every tab where `match.saved=true`. Confirmation dialog with count.

### 5.6 Drag-and-drop
- Drag an `OpenTabRow` onto a Collection in the sidebar → save to that Collection (matches Collections §13.3 row "External browser tab → Collection body").
- Drag onto "⭐ Starred" section → save + star + pin.
- Drag a saved row out of the panel: no-op (use the saved view to move Items).

## 6. Keyboard

Active when focus is inside the panel. Cross-ref `06-ui-ux/08-keyboard-input.md`.

| Shortcut | Action |
|---|---|
| `↑` `↓` | Move row selection |
| `←` `→` | Collapse / expand `WindowGroup` |
| `Enter` | Jump to focused tab |
| `Cmd/Ctrl+S` | Save focused tab (opens destination picker) |
| `Cmd/Ctrl+Shift+S` | Save all unsaved tabs |
| `Space` | Multi-select toggle |
| `Cmd/Ctrl+W` | Close focused tab (with safety prompt if unsaved) |
| `/` | Filter rows by title/url |

## 7. Messaging (extension internals)

Messages between popup/new-tab UI ↔ service worker (cross-ref `12-messaging.md`):

| `type` | Direction | Payload | Response |
|---|---|---|---|
| `openTabs.subscribe` | UI → SW | `{}` | initial `OpenTabsState` then push updates on every recompute |
| `openTabs.unsubscribe` | UI → SW | `{}` | `{ ok: true }` |
| `openTabs.saveOne` | UI → SW | `{ tab_id, collection_id, group_id?, star?: bool }` | `{ item_id }` or error |
| `openTabs.saveMany` | UI → SW | `{ tab_ids: number[], collection_id, group_id?, skip_duplicates: bool }` | `{ created: number, skipped: number, errors: [...] }` |
| `openTabs.jumpTo` | UI → SW | `{ tab_id, window_id }` | `{ ok: true }` |
| `openTabs.close` | UI → SW | `{ tab_ids: number[] }` | `{ closed: number }` |
| `openTabs.refresh` | UI → SW | `{}` | force recompute, returns fresh `OpenTabsState` |

Service worker owns the `chrome.tabs.*` listeners; UI never registers them directly (popup contexts are too short-lived).

## 8. Permissions

Already granted by `01-manifest.md`:
- `tabs` — required for `chrome.tabs.query` with URL/title visibility.
- `storage` — for `ui.openTabsRail.collapsed` preference.
- No new host permissions needed beyond those already declared.

If `tabs` permission is revoked at runtime (Edge enterprise policy edge case): panel renders empty state "Tab access disabled by your administrator" and segmented control hides the `Open Tabs` tab.

## 9. Privacy

- Tab URLs and titles are **never** sent to the server until the user explicitly saves a tab. The panel is fully local.
- Filter input (§6 `/`) runs locally; not telemetered.
- Telemetry events (§11) carry counts and outcomes only, never URLs or titles.

## 10. Empty / error / loading

Per `06-ui-ux/12-empty-error-loading.md`:
- **Loading:** skeleton rows for ~150ms then real data (initial query is fast).
- **Empty:** "No browser tabs open. Open a tab to save it here." — only realistic in detached extension test contexts.
- **All saved:** small banner above the list — "All open tabs are saved 🎉" with "Close saved tabs" action.
- **Error (`chrome.runtime.lastError`):** "Couldn't read tabs. Reload the extension." with Retry button. Logs to `../18-analytics-telemetry/02-error-reporting.md`.

## 11. Telemetry

Cross-ref `04-extension/14-analytics-telemetry.md` and `18-analytics-telemetry/03-events.md`.

- `ext.open_tabs.opened` `{ surface: popup|new_tab }`
- `ext.open_tabs.save_one` `{ destination: existing|new_collection, starred: bool }`
- `ext.open_tabs.save_many` `{ count, skipped, scope: window|all|unsaved }`
- `ext.open_tabs.jump_to` `{ was_active: bool }`
- `ext.open_tabs.close_tabs` `{ count, scope: one|saved|all }`
- `ext.open_tabs.filter_used` `{ result_count }`

## 12. Entitlements

| Action | Free | Pro | Team |
|---|---|---|---|
| View Open Tabs panel | ✅ | ✅ | ✅ |
| Save one | ✅ | ✅ | ✅ |
| Save many (≤ 20 in one call) | ✅ | ✅ | ✅ |
| Save many (> 20 in one call) | ❌ (entitlement `ext.open_tabs.bulk_large`) | ✅ | ✅ |
| Close all saved tabs | ✅ | ✅ | ✅ |

Entitlement key registered in `10-licensing-billing/02-entitlements-engine.md`.

## 13. Error codes

Returned from messaging layer or surfaced from `POST /v1/bulk/items`:

- `BILLING_QUOTA_EXCEEDED` — Free user attempts > 20 in one call. UI shows upsell.
- `VALIDATION_FAILED` — invalid `collection_id`. Should not happen via UI flow.
- `RATE_LIMITED` — too many bulk saves; UI throttles button for 5s.
- Per-row errors in `errors[]` from `POST /v1/bulk/items` are surfaced in toast as "{N} tabs failed — {reason}".

## 14. Cross-refs

- Container surface: `04-extension/04-popup.md`, `04-extension/05-new-tab.md`
- Save flow API: `03-api-endpoints/08-items.md` (`POST /v1/items`, `POST /v1/bulk/items`)
- Drag-drop matrix: `07-features/04-collections.md` §13.3
- URL normalization: `11-import-export/11-dedup-algorithm.md` §2
- Local cache: `04-extension/10-sync-and-offline.md` (IndexedDB store `lmn-cache`)
- Messaging conventions: `04-extension/12-messaging.md`
- Manifest permissions: `04-extension/01-manifest.md`

## 15. Open questions (SI-021, pending full source re-paste)

- Toby's exact "Save all" cap before warning (we set 20 free / unlimited paid).
- Whether Toby surfaces Chrome's native tab groups (`group_id`) as a visual nesting in the panel — assumed YES, rendered as colored chip on the row.
- Behaviour for incognito windows — assumed hidden from the panel; revisit if Toby includes them.
