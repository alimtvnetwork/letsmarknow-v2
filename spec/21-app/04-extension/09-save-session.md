# Save Session

Take all tabs in the current window and persist them as a Collection (or Group inside one). The flagship power-user feature inherited and improved from Toby & Tab Extend.

---

## 1. Trigger surfaces

- Popup bottom strip "Save all N tabs as session"
- Keyboard `Alt+Shift+W`
- Right-click on Chrome window's tab strip (custom context menu in MV3 limited; we use the popup CTA as the primary surface)
- Web app "Save current window" button (calls into extension via `externally_connectable`)

## 2. Two-step flow

**Step 1 — Preview (mandatory):**
- SW collects tabs: `chrome.tabs.query({ currentWindow: true })`.
- Filters per options (defaults shown):
  - Exclude pinned (default OFF)
  - Exclude Chrome internal URLs (`chrome://`, `chrome-extension://`, `edge://`, etc.) (default ON)
  - Exclude empty/`about:blank` (default ON)
  - Dedupe within session by normalized URL (default ON)
  - Dedupe against destination Collection (default OFF)
- POSTs `/v1/sessions/save/preview` to compute server-side what would happen (entitlement check, dupe detection against backend).
- Renders preview list in popup full-height takeover.

**Step 2 — Confirm:**
- User picks destination (4 modes; see API):
  - **New collection** in chosen Space
  - **Existing collection** (append; optionally as a new Group inside it)
  - **New group** in chosen collection
  - **Existing group** (append)
- User picks name + emoji + color.
- "Save" → POSTs `/v1/sessions/save` with the same payload + `client.window_id` + `client.saved_at`.
- On success:
  - Show toast "Saved 12 tabs to **2026-04-18 Research**"
  - "Undo" button (calls `/v1/history/:id/undo` with `undo_token`) — visible 30 s
  - If "Close tabs after save" was checked: `chrome.tabs.remove(tabIds)` AFTER server confirms. If save fails, tabs stay open.

## 3. Default destination heuristic

- If any tab in the window is from a domain matching items in a recent (< 7 days) Collection, suggest **append to that Collection as a new Group dated today**.
- Otherwise, suggest **new Collection** named `YYYY-MM-DD <focused-tab-domain>` (e.g. `2026-04-18 figma.com`).
- User can accept with one click or change.

## 4. Dedupe logic

- Within session: normalize URL (lowercase host, strip tracking params per `08-sharing-collab/url-normalization.md`), compare; keep first occurrence.
- Against destination (when toggle ON): server-side `POST /v1/sessions/save` checks `normalized_url` against existing items in the target Collection/Group; skipped items returned in `skipped` array.

## 5. Tab filtering rules

```ts
function shouldIncludeTab(tab, opts) {
  if (!tab.url) return false;
  if (opts.exclude_pinned && tab.pinned) return false;
  if (opts.exclude_chrome_internal && /^(chrome|edge|about|chrome-extension|brave|opera|view-source):/.test(tab.url)) return false;
  if (opts.exclude_blank && (tab.url === "about:blank" || tab.url === "chrome://newtab/")) return false;
  return true;
}
```

## 6. Favicon delivery

- For each tab include `favicon_data_url` if `tab.favIconUrl` is reachable (data: URL after fetch + base64; cap 16 KB; if larger, send URL only).
- Backend re-hosts on `cdn.letsmarknow.com` for stability.

## 7. Progress reporting

For sessions > 50 tabs, popup shows progress bar driven by:
- Local progress: tabs serialized → 30%
- Network progress: upload bytes → 60%
- Server processing: returned in chunked response (we use SSE on `/v1/sessions/save?progress=sse`) → 100%

## 8. Edge cases

| Scenario | Behavior |
|---|---|
| Window has 1 tab | Same flow but title is "Save 1 tab" |
| Window has 0 valid tabs after filter | Disable Save button; explain why |
| User cancels mid-flight | Abort fetch; pending mutation removed; tabs untouched |
| Free plan would be exceeded | Preview shows red banner: "12 tabs to save, 5 fit in your Free plan. Upgrade or save 5 now." with "Save 5" + "Upgrade" |
| Idempotency-Key replay (same window, same minute) | Server returns cached response; client treats as success |
| Browser crash mid-save | On next SW startup, `pending_mutations` queue contains the save; we retry once; if duplicate detected via Idempotency-Key, it succeeds idempotently |

## 9. Restore-as-session (reverse op)

- From any Collection or Group: `⋯ → Restore as window`
- POSTs `/v1/sessions/restore` → returns ordered URL list
- SW: `chrome.windows.create({ url: urls[0], focused: true })` then for each remaining: `chrome.tabs.create({ windowId, url, active: false })`
- Throttle: 5 tabs per 100 ms to avoid Chrome rate-limiting tab creation.

## 10. Privacy

- Tab URLs only leave the browser when the user actually clicks Save.
- Preview filtering happens locally; only filtered list goes to server.
- No background scanning of tabs.
