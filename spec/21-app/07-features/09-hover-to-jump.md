# Hover-to-Jump

If a saved Item is currently open in another tab in the user's browser, hovering its card shows "Already open — jump there" and clicking switches focus.

---

## 1. Concept

- Reduces the "duplicate tab" problem.
- Surfaces unintentional state ("oh, this is already open").
- Fast: detection ≤ 100 ms after hover.

## 2. Detection

- Extension service worker maintains a `Map<urlNormalized, { tabId, windowId, lastSeen }>` updated via `chrome.tabs.onUpdated`, `onCreated`, `onRemoved`.
- Web app calls extension via the auth-bridge: `LMN_QUERY_OPEN_TABS` returns the same map (cached 2 s).
- URL normalization: lowercase host, strip default port, drop fragment, drop tracking params (`utm_*`, `ref`, `fbclid`, `gclid`).

## 3. UI

- Card `onMouseEnter` checks the open-tabs map.
- If hit, card shows pill badge top-right "Open · jump" (or icon `ArrowUpRightFromCircle` in compact mode).
- Cursor doesn't change; click still opens.
- Holding `Shift` while clicking forces normal new-tab open.

## 4. Click behavior

| Modifier | Behavior |
|---|---|
| (default click) | If open: jumps. If not: opens new tab. |
| `Cmd/Ctrl+Click` | Opens new tab (no jump) |
| `Shift+Click` | Opens new window |
| `Alt+Click` | Opens current tab (replaces) |

## 5. Jump implementation

Extension calls:
- `chrome.windows.update(windowId, { focused: true })`
- `chrome.tabs.update(tabId, { active: true })`

If tab no longer exists (race), falls back to opening fresh.

## 6. Web app without extension

- Detection unavailable; pill never shows.
- Click always opens fresh.

## 7. Performance

- Open-tabs map indexed by normalized URL.
- Lookup p99 < 1 ms.
- Hover handler debounced 50 ms to avoid spam during fast moves.

## 8. Privacy

- Open-tabs map never sent to server.
- Stored only in extension memory; cleared on browser close.
- Web app only receives a single bool ("is open?") per query, not the full URL list.

## 9. Entitlements

Available on every plan; off-by-default toggle in `/me/profile` ("Hover to jump on cards") for users who find it distracting.

## 10. Edge cases

| Case | Behavior |
|---|---|
| Same URL open in multiple tabs | Jump to most recently focused match |
| Tab in another browser window | Bring window to front first |
| Tab is in a different Chrome profile | Not visible; treated as not open |
| Tab discarded | Treated as open; activating wakes it |
| URL fragment differs | Counts as match (ignored in normalize) |

## 11. Telemetry

- `hover_jump.shown` (sampled 1%)
- `hover_jump.clicked` `{ found: bool }`
- `hover_jump.disabled_in_prefs`

## 12. Tests

- Unit: URL normalizer.
- Integration (extension): mock `chrome.tabs.*` events; assert map updates.
- E2E: open a saved tab in test browser; hover card; assert badge; click; assert focus changed.
