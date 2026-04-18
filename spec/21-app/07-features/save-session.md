# Save Session

Save all (or filtered) tabs from a browser window as a Collection or Group.

---

## 1. Surfaces

| Surface | Trigger |
|---|---|
| Extension popup | "Save all tabs" button |
| Shortcut | `Alt+Shift+W` |
| Context menu | Right-click toolbar icon → "Save all tabs in window" |
| Omnibox | `lmn savesession <name>` |
| Web app | Only if extension installed (button greyed otherwise) |

## 2. Flow

1. Service worker queries `chrome.tabs.query({ currentWindow: true })`.
2. Apply local filter `shouldIncludeTab(tab)`:
   - Skip pinned tabs (configurable; default true).
   - Skip `chrome://`, `chrome-extension://`, `about:`, `file://`, `data:`.
   - Skip tabs with `discarded=true` and no URL.
3. Show preview drawer in popup: list of tabs with checkboxes, select-all.
4. User chooses destination:
   - **New Collection** (name autosuggested as "Window — Apr 18, 14:32")
   - **Existing Collection** (dropdown)
   - **As a Group inside an existing Collection**
5. User chooses post-save action:
   - Keep tabs open (default)
   - Close all tabs (after confirmation)
   - Suspend tabs (only on Chrome with Tab Discard API)
6. Submit to `/v1/sessions` with array of items + destination + `client_request_id`.
7. Server returns `undo_token` (60 s) for batch undo.
8. Toast: "Saved 17 tabs to 'Window — Apr 18' — Undo · Open Collection".

## 3. Server behavior

- One request creates Collection (if new) + Group (if requested) + N Items in a single transaction.
- Dedupe within destination: skip if URL already there (configurable per request: skip / dupe / replace).
- Returns `created_count`, `skipped_count`, `replaced_count`.
- Emits one `session.saved` History Event for the batch (not N item events) to keep Activity feed clean.

## 4. Undo

- `POST /v1/sessions/:id/undo?token=...` removes batch + Collection if newly created and now empty.
- Available 60 s after save; after that, individual items can be deleted normally.

## 5. Performance

- Local preview render p75 < 200 ms regardless of tab count.
- Server commit p95 < 1.2 s for ≤ 50 tabs; chunked for more.
- Tabs > 200 split into chunks of 100; user sees progress.

## 6. Limits

| Plan | Max tabs per session |
|---|---|
| Free | 30 |
| Pro | 200 |
| Team | 500 |

Exceeding cap: suggests filtering or upgrade; partial save still possible.

## 7. Auto-Group strategy (optional)

Pro+ feature: server clusters saved tabs into Groups by domain ("YouTube · 12 tabs", "GitHub · 4 tabs", "Other · 3 tabs"). Toggleable per-save.

## 8. Reopen-as-window

- From a Collection or Group → "Open all in new window" (Pro+).
- Extension creates a new window with all URLs.
- Confirmation if > 25 tabs.

## 9. Edge cases

| Case | Behavior |
|---|---|
| Multiple windows open | Only current window scanned; tip explains how to switch |
| Tab Groups (Chrome) | Preserved as LMN Groups when present |
| Pinned tabs | Excluded by default; toggle to include |
| Loading tabs | URL still readable; saved as-is with warning badge |
| Private/Incognito tabs | Excluded unless extension enabled in incognito + opt-in |
| Saved while another save in flight | Queued; no concurrent batches per Account |

## 10. Entitlements

| Feature | Free | Pro | Team |
|---|---|---|---|
| Save Session (≤ 30 tabs) | ✅ | ✅ | ✅ |
| Save Session (≤ 200 tabs) | ❌ | ✅ | ✅ |
| Save Session (≤ 500 tabs) | ❌ | ❌ | ✅ |
| Auto-group by domain | ❌ | ✅ | ✅ |
| Reopen all in window | ❌ | ✅ | ✅ |
| Suspend after save | ❌ | ✅ | ✅ |

## 11. Telemetry

- `session.save.invoked` `{ tab_count, surface }`
- `session.save.completed` `{ created, skipped, replaced, duration_ms }`
- `session.save.undo` `{ scope: "all" | "partial" }`
- `session.reopen` `{ tab_count }`

## 12. A11y

- Preview list keyboard-navigable.
- "Select all" / "Select none" buttons; per-row checkbox.
- Toast Undo focusable + announced.

## 13. Tests

- Cypress (extension test harness): mock `chrome.tabs.query`; assert preview, batch save, undo.
- Backend: idempotency test with same `client_request_id`.
- Load test: 500 tabs in one session — server holds < 1.5 s.
