# Extension Surfaces

Inventory of every user-visible UI surface the extension exposes. Each links to its own deep-dive file.

---

## 1. Toolbar Popup (`action.default_popup`)
- **File:** `popup/index.html`
- **Purpose:** Quick-save current tab; show last-used Collection; quick-find.
- **Size:** 380 × 540 px (CSS clamps).
- **Triggers:** click extension icon, `Alt+S`, `chrome.action.openPopup()` from SW.
- **Spec:** `04-popup.md`

## 2. New Tab Dashboard (`chrome_url_overrides.newtab`)
- **File:** `newtab/index.html`
- **Purpose:** The visual board — Collections, Groups, Items in column / grid / list / compact views. Replaces Chrome's default new tab.
- **User can disable** override via Options page (writes to `chrome.storage.local.disable_newtab=true`; HTML then redirects to `chrome://newtab-default` no-op).
- **Spec:** `05-new-tab.md`

## 3. Side Panel (`side_panel.default_path`)
- **File:** `sidepanel/index.html`
- **Purpose:** Persistent companion while browsing — drag URLs from address bar, drop into Collections; quick-find.
- **Triggers:** Chrome side-panel button; `chrome.sidePanel.open()` from context menu.
- **Spec:** sub-section of `04-popup.md` (shares 80% UI with popup).

## 4. Options Page (`options_ui.page`)
- **File:** `options/index.html`, `open_in_tab: true`
- **Purpose:** Account, sync settings, keyboard shortcuts, theme, Privacy/data, sign-out, about.
- **Spec:** see `06-ui-ux/21-options-page.md`.

## 5. Omnibox (`omnibox.keyword = "lmn"`)
- **Trigger:** type `lmn ` in URL bar.
- **Behavior:** suggestions from `/v1/search/quick`; Enter opens the tab (or jumps to existing tab if open).
- **Spec:** `06-omnibox.md`

## 6. Context Menu (`contextMenus`)
- **Items registered at SW startup** (idempotent):
  - "Save link to Lets Mark Now" — appears on `link` context.
  - "Save page to Lets Mark Now" — `page`.
  - "Save image to Lets Mark Now" — `image` (Pro: stored in linked Item notes).
  - "Save selection as note" — `selection`.
  - Submenu: "→ to Last-Used Collection", "→ Choose Collection…", "→ Quick Tools group".
- **Spec:** `07-context-menu.md`

## 7. Keyboard Shortcuts (`commands`)
- See `08-keyboard-shortcuts.md` and the `commands` block in `01-manifest.md`.

## 8. Notifications (`chrome.notifications`)
- Used only when popup is closed AND a save succeeds via shortcut/context menu.
- Toast: "Saved to <Collection name>" + "Undo" button (sends message to SW → calls `/v1/history/:id/undo`).
- Auto-dismiss: 6s.
- User can disable via Options ("Show save toasts").

## 9. Content Script Bridge (`content_scripts`)
- **File:** `content/web-bridge.js`
- **Matches:** only `letsmarknow.com` and subdomains.
- **Purpose:** lets the web app detect the extension is installed (via `window.postMessage` + `externally_connectable`) and pass a one-time auth handoff token.
- **Spec:** `11-auth-bridge.md`

## 10. Service Worker (background)
- Not a "surface" but the runtime that wires all of the above. See `03-service-worker.md`.

---

## Surface ↔ Capability matrix

| Capability | Popup | New Tab | Side Panel | Omnibox | Context Menu | Shortcut | Options |
|---|---|---|---|---|---|---|---|
| Quick-save current tab | ✅ | ✅ | ✅ | — | ✅ | ✅ | — |
| Save session (all tabs) | ✅ | ✅ | ✅ | — | — | ✅ | — |
| Browse Collections | summary | full | tree | — | submenu | — | — |
| Quick-find | ✅ | ✅ | ✅ | ✅ | — | ✅ | — |
| Open Item | new tab / jump | new tab / jump | new tab / jump | new tab / jump | — | — | — |
| Manage account | link → web | — | — | — | — | — | ✅ |
| Toggle settings | link → Options | link → Options | link → Options | — | — | — | ✅ |

---

## Lifecycle of a save (cross-surface)

1. User triggers save on any surface (e.g. popup "Save" button, `Alt+Shift+S`, context menu).
2. Surface posts `{ type: "SAVE_TAB", payload }` to SW.
3. SW: validates auth → calls `POST /v1/items` (or `/v1/sessions/save` for window).
4. SW broadcasts `{ type: "ITEM_CREATED", item, history_event_id }` to all open surfaces.
5. Each surface re-renders its list optimistically; new-tab dashboard slides the new card in.
6. Notification (if popup closed) shows success + Undo.
