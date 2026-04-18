# Jump-to-Result

What happens when the user picks a search result. The single most-used path in the app.

---

## 1. Primary action by result type

| Result type | Enter | Cmd+Enter | Shift+Enter |
|---|---|---|---|
| Item | Jump-to-tab if open in any window; else open in new tab in background | Open in new tab in foreground | Open & keep search modal open |
| Collection | Navigate to Collection view | Open in new tab (web) | Navigate & keep modal open |
| Group | Navigate to parent Collection scrolled to Group | Open in new tab | Keep modal open |
| Space | Switch to Space dashboard | New tab | Keep modal open |
| Tag | Open tag page | New tab | Keep modal open |
| Member | Open Member profile | New tab | Keep modal open |
| Command | Execute command | (n/a) | Execute & keep modal open |
| Saved search | Run search; replace current query | New tab | Keep modal open |

## 2. Jump-to-tab semantics

When opening an Item:
1. Check open tabs (extension uses `chrome.tabs.query`; web app uses BroadcastChannel + Service Worker registry).
2. If item URL matches an open tab in current window → focus that tab.
3. Else if open in another window → focus that window + tab.
4. Else open new tab; `Cmd+Enter` → foreground; default → background per user setting.
5. Increment `last_opened_at`; emit `item.opened` event (correlated with search query).

URL match rule: normalized URL (per `11-import-export/mapping-and-dedup.md` § 4) compared. Tracking-param-only differences match.

## 3. Multi-select on results

- `Cmd+Click` (mac) / `Ctrl+Click` (others) toggles selection in result list.
- Bottom toolbar appears: "Open all (3) · Move (3) · Tag (3) · Star (3)".
- "Open all" opens each item per jump-to-tab logic; staggered 50 ms apart to avoid browser throttling.

## 4. Inline preview

- Hover (or arrow-key focus + 300 ms dwell) on a result reveals a preview panel:
  - Title, host, favicon, description.
  - Tags, last opened.
  - Note (truncated 240 chars).
  - Image preview if available (Pro+).
- Preview pane is right-side on desktop; bottom on mobile.
- Esc closes preview; Tab moves to preview actions.

## 5. Result actions menu

- Right-click on result OR press `→` to open per-result action menu:
  - Open in new tab
  - Copy URL
  - Copy as Markdown link
  - Copy as plain text
  - Edit title / tags / note (inline modal)
  - Move to…
  - Star / Unstar
  - Pin / Unpin
  - Share…
  - Trash

## 6. Modal closing rules

- Close on Enter (open action) UNLESS Shift held.
- Close on Esc.
- Close on click outside.
- Stay open during multi-select.
- Stay open during command execution that produces feedback (e.g., "Saved 3 items").

## 7. Result analytics

- Track CTR per position to inform future ranking tweaks.
- Anonymized; aggregated weekly.
- Used to detect ranking regressions in CI (synthetic queries on fixture corpus).

## 8. Keyboard ergonomics

- After opening (Enter), focus returns to the page (item) or stays in app (collection nav).
- "Open & keep modal" (Shift+Enter) preserves query for power use.
- Down-arrow at last result wraps to first; up-arrow reverses.
- `1` … `9` number keys jump-select corresponding result.

## 9. Mobile behavior

- Tap result = primary action.
- Long-press = action menu.
- Swipe right on result = quick-star; swipe left = quick-trash (with undo).

## 10. Empty / error fallbacks

- If item URL is invalid (deleted page, mailto, javascript): toast "Couldn't open — link looks broken. Edit?".
- If item is in trash: confirm "This is in Trash. Restore and open?".
- If permission lost mid-flight: toast + remove from results.

## 11. Telemetry

- `search.result_opened` `{ category, position, action: "primary" \| "new_tab" \| "background", jump_to_tab: bool }`
- `search.preview_shown` `{ category, position, dwell_ms }`
- `search.action_menu_opened`
- `search.multi_open` `{ count }`
- `search.opened_broken_url` `{ scheme }`

## 12. Edge cases

| Case | Behavior |
|---|---|
| Item opens in same tab user is reading | Background-open avoids navigation surprise; respects user pref |
| Multi-open of 50 items | Cap at 25 simultaneously; rest queued with progress toast |
| Browser blocks pop-ups for Cmd+Enter foreground | Detect failure; switch to background open + toast |
| Network offline at open time | Open from cached preview if available; toast "Page loaded from cache" |
| Item is a saved session (multi-tab) | Restore session in new window with all tabs |

## 13. Tests

- Jump-to-tab accuracy across windows / profiles.
- Modal closing rules per shortcut.
- Multi-open rate-limit behavior.
- Preview panel keyboard navigation.
- Mobile swipe gestures + undo.
- CTR-by-position telemetry sampling correctness.
