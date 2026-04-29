# 00 — Extension Folder Overview

> **Purpose.** Define the **Chrome extension** that is the user's primary capture surface. v1 is Chrome-only (locked in `00-overview/05-browser-scope.md`). This folder owns the manifest, every UI surface inside the browser (popup, new-tab, omnibox, context-menu), the service worker, the auth bridge to the web app, sync/offline behaviour, message passing, keyboard shortcuts, telemetry, the dev loop, and the Chrome Web Store rollout pipeline.

---

## 1. Responsibilities

1. **Manifest contract.** Manifest v3, exact permissions list, host permissions, optional permissions, minimum Chrome version.
2. **Surface inventory.** Every place the extension renders pixels or intercepts input — popup, new-tab page, omnibox keyword, context menu, keyboard shortcut, badge.
3. **Service worker behaviour.** Lifecycle (install, activate, idle, terminate), event handlers, message router, alarm-driven background sync.
4. **Auth bridge.** How the extension obtains and refreshes a session token from `app.letsmarknow.com` without ever asking the user to log in twice.
5. **Sync & offline.** What is cached locally (IndexedDB), what is server-of-truth, conflict resolution, queued writes when offline, replay on reconnect.
6. **Save flows.** Save current tab, save entire window/session, save group of selected tabs, save with quick-tag, save with destination picker.
7. **Quick-find / omnibox.** Type a keyword in the address bar, query the user's bookmarks/items, jump.
8. **Distribution.** Update channels, staged rollout %, kill switch, store-listing assets.

---

## 2. File-by-file behaviour

| File | Owns |
|---|---|
| `01-manifest.md` | manifest.json contract: permissions, host_permissions, action, background, commands, omnibox keyword. |
| `02-surfaces.md` | Inventory of every UI surface and which file specs it. |
| `03-service-worker.md` | Lifecycle, event router, alarms, message handling, idle eviction. |
| `04-popup.md` | Default-action popup: layout, save flow, current-tab metadata read, destination picker, recent items. |
| `05-new-tab.md` | New-tab override: dashboard-lite, recently saved, jump-to-collection, search input. |
| `06-omnibox.md` | Address-bar keyword (e.g. `lmn `), result ranking, jump action. |
| `07-context-menu.md` | Right-click menu items: Save link, Save image, Save selection, Save tab. |
| `08-keyboard-shortcuts.md` | Default chord map, conflict avoidance with Chrome system chords, customisability. |
| `09-save-session.md` | Save entire window or selected-tab group as one Item set. |
| `10-sync-and-offline.md` | IndexedDB schema, write queue, server reconciliation via Supabase Realtime (W-2 lock). |
| `11-auth-bridge.md` | OAuth handshake with web app, refresh-token cookie reuse, sign-out propagation. |
| `12-messaging.md` | `runtime.sendMessage` envelope, typed channels, error handling, version negotiation. |
| `13-update-and-rollout.md` | Web Store publish workflow, staged rollout %, kill switch via remote config. |
| `14-analytics-telemetry.md` | What the extension reports, opt-in respect, redaction rules. |
| `15-dev-loop.md` | Local dev with `web-ext` / Vite, hot reload constraints in MV3, test profiles. |
| `16-open-tabs-panel.md` | Open-tabs panel surface inside the extension popup/new-tab. |
| `17-store-listing.md` | Chrome Web Store listing copy, screenshots, promo tiles, permissions justification. |
| `18-firefox-port.md` | Phase 4 Firefox/AMO port deltas and source-level portability rules to keep v1 port-ready. |
| `19-staging-seed.md` | Fixed roster of staging seed accounts and seed-data contract; staging DB nightly reset. |

---

## 3. Tasks performed by this folder

- **Capture.** One-click save of a tab, a window, a context-menu target.
- **Resurface.** New-tab and popup show recent / pinned / quick-find results.
- **Cache.** Local IndexedDB cache for offline read of recent items and queued saves.
- **Bridge identity.** Single sign-in across web app and extension via shared cookie + OAuth.
- **Distribute updates.** Staged Chrome Web Store rollouts with kill switch.
- **Report.** Telemetry that respects the user's opt-in state from `18-analytics-telemetry/01-opt-in-analytics.md`.

---

## 4. What this folder is NOT

- **Not the web app.** Anything on `app.letsmarknow.com` lives in `05-web-app/`.
- **Not the share viewer.** Public `/t/{slug}` is in `05-web-app/14-share-viewer.md`.
- **Not the API.** Endpoints called by the extension live in `03-api-endpoints/`.
- **Not multi-browser.** Edge / Brave / Arc / Opera / Firefox / Safari are deferred to Phase 4 per `00-overview/05-browser-scope.md`.

---

## 5. Cross-references

- Browser scope lock: `00-overview/05-browser-scope.md`.
- Session/refresh contract used by the auth bridge: `09-auth-accounts/06-sessions.md`.
- Realtime transport for sync: `08-sharing-collab/14-realtime-transport.md`.
- API surfaces used by the extension: `03-api-endpoints/12-sessions-save.md`, `03-api-endpoints/08-items.md`, `03-api-endpoints/13-search.md`.
- Phase-4 cross-browser plan: `20-roadmap/05-phase-4-cross-browser.md`.
