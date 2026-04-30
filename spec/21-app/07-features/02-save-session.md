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
6. Submit to `POST /v1/sessions/save` with array of items + destination + `client_request_id` (see `03-api-endpoints/12-sessions-save.md`).
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

---

## 14. Save Session v1 — reconciled subspec (2026-04-29)

> Sourced from "Save Session — AI-Readable Feature Specification v1.0" (full paste in `00-conversation-log.md`). Reconciled against locked rules. **Conflicts resolved:** brand pink stays `343 79% 60%` (locked SI-021); `colorLabel` enum stays the locked 9-value set (no `gray`); `Collection.kind` adopted as additive — see SI-023.

### 14.1 Sessions are first-class Collections

A Session = `Collection` with two extra fields:
```ts
{ kind: "session", capturedAt: ISO8601, sourceWindowId?: string }
```
Default `kind: "manual"` for all existing collections. Every Collection feature (rename, share, star, tag, export, delete, drag tabs in/out) applies to Sessions automatically. New SI-023 tracks the schema migration.

### 14.2 Three trigger surfaces (canonical)

| # | Surface | Visual | Tooltip |
|---|---|---|---|
| 1 | Open Tabs Panel — per-window header | 20×20 download-tray icon (`lucide:Download`), `--primary` tint | `"Save Session"` |
| 2 | Extension popup — space-switcher row | Same icon next to `+` | `"Save Session as new collection"` |
| 3 | Keyboard (optional) | — | `⌘/Ctrl+Shift+S` saves focused window |

Tooltip = pink filled pill (bg `--primary`, text `--primary-foreground`, radius `6px`, padding `6px 10px`, top arrow notch). Disabled state tooltip: `"No tabs to save"`.

### 14.3 Default name

`defaultName(window) = "Window {n} — {Mon D, h:mm A}"` in user locale + timezone. Collision suffix ` (2)`, ` (3)`, …

### 14.4 Save flow (non-destructive by default)

1. Snapshot `tabs` preserving order; preserve `pinned: true` per tab.
2. Create local `Collection { kind:"session", capturedAt:now, sourceWindowId }` at `order:0`.
3. Optimistic insert at top of grid with 200ms slide-down + fade (skip when `prefers-reduced-motion`).
4. Queue sync to server via `POST /v1/sessions/save` (existing API, `03-api-endpoints/12-sessions-save.md`).
5. Toast (canonical placement per `06-ui-ux/11-feedback.md §2.1`: bottom-right desktop, top-center mobile): `"Session saved · {N} tabs"` with `Undo` (5s) + `View`.
6. Browser tabs are **not** closed unless user setting `Close tabs after saving session` is on.

### 14.5 Restore

- `Restore session` → opens every tab in current window in original order; originally-active tab focused last. Pinned flag re-applied.
- `Restore in new window` → fresh window.
- `chrome://` and `about:` URLs saved but skipped on restore with notice toast `"Skipped {n} unsupported tabs"`.
- Restore never deletes the session.

### 14.6 Re-capture

3-dot menu → `Re-capture from current window` (visible only when `sourceWindowId` is still alive). Replaces `tabs` and updates `capturedAt` after destructive-style confirm. No diff history in v1.

### 14.7 Settings (`Settings → Sessions`)

| Setting | Default |
|---|---|
| Close tabs after saving session | off |
| Default session name template (tokens: `{n}`, `{date}`, `{time}`, `{count}`, `{domain}`) | `Window {n} — {date} {time}` |
| Confirm before restore in current window | on |
| Auto-save session on browser quit (`runtime.onSuspend`) | off |

### 14.8 Edge cases (additive to §9)

- Incognito windows: Save Session icon hidden entirely.
- 0 tabs: button disabled; never create empty sessions.
- Pinned tabs: round-trip via `pinned: true`.
- Duplicate URLs: kept (no dedupe within a single session).
- > 500 tabs: virtualized tab list on the card; toast reads `"Saved {N} tabs (large session)"`.
- Favicon-less: hashed pastel monogram from first letter of title.
- Concurrent edit: last-write-wins on `updatedAt`; loser sees toast `"This session changed elsewhere — refreshed"`.

### 14.9 Acceptance checklist (30 items — see conversation log §15 of source paste for canonical list)

The 30-item checklist in the source paste is authoritative for QA. Key invariants:
- All colors via semantic tokens; no hardcoded hex in components.
- Brand `--primary` = `343 79% 60%` (locked, NOT `347 81%`).
- Save button has `aria-label="Save session for Window {n}"`; tooltip via `aria-describedby` on focus.
- Local-first: closing network mid-save still produces a usable session, marked `cloud-off` until sync.
- Sessions appear/behave as first-class Collections everywhere (search, tag, export, share, star).
