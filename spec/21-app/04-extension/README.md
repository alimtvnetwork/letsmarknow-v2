# 04 — Extension (Chrome MV3)

> **v1 scope (LOCKED):** Chrome only. Edge / Brave / Arc / Opera / Firefox are **postponed to Phase 4**. See `00-overview/browser-scope.md`.

The Chrome extension is the primary surface for **Lets Mark Now**. **v1 ships for Google Chrome only.** Edge, Brave, Arc, Opera (Chromium siblings) and Firefox are explicitly postponed — do not implement, test, or ship for them in v1.

## Reading order

1. `manifest.md` — exact `manifest.json` schema, permissions, host permissions, MV3 service worker model.
2. `surfaces.md` — new tab override, toolbar popup, side panel, content scripts, options page.
3. `service-worker.md` — background lifecycle, alarms, message router, network layer.
4. `popup.md` — toolbar popup UX & API contract.
5. `new-tab.md` — `chrome://newtab` override (the dashboard).
6. `omnibox.md` — `lmn ` keyword search in the URL bar.
7. `context-menu.md` — right-click → Save link / Save page / Save selection to ….
8. `keyboard-shortcuts.md` — `commands` block, default bindings, conflict handling.
9. `save-session.md` — extension side of the Save Session flow (window scan, tab filter, dedupe, undo).
10. `sync-and-offline.md` — local cache, optimistic mutations, conflict resolution, offline queue.
11. `auth-bridge.md` — how the extension authenticates against `api.letsmarknow.com` (PKCE on `chrome.identity` flow + refresh-cookie trick).
12. `messaging.md` — typed message contracts between popup ↔ SW ↔ new-tab ↔ content script.
13. `update-and-rollout.md` — version bumps, force-update, kill-switch, staged rollout via Chrome Web Store percentage.
14. `analytics-telemetry.md` — what the extension reports, opt-out, no PII.
15. `dev-loop.md` — local build, hot reload, sourcemap stripping for store, manifest variants (dev/staging/prod).

## Files

| File | Purpose |
|---|---|
| `manifest.md` | manifest.json contract |
| `surfaces.md` | Inventory of UI surfaces |
| `service-worker.md` | Background runtime |
| `popup.md` | Toolbar popup |
| `new-tab.md` | New tab override |
| `omnibox.md` | URL-bar keyword |
| `context-menu.md` | Right-click integration |
| `keyboard-shortcuts.md` | `commands` API |
| `save-session.md` | Window → Collection flow |
| `sync-and-offline.md` | Caching & offline queue |
| `auth-bridge.md` | OAuth/PKCE for extension |
| `messaging.md` | Internal message protocol |
| `update-and-rollout.md` | Release management |
| `analytics-telemetry.md` | Event reporting |
| `dev-loop.md` | Developer experience |

## Locked rules

- **Manifest version: 3.** No MV2 fallback.
- **Service worker only** — no persistent background page. State lives in `chrome.storage.local` + IndexedDB.
- **No remote code execution.** All JS bundled at build. CSP forbids `'unsafe-eval'` and remote `<script>`.
- **Minimum Chrome version:** 116 (for `chrome.sidePanel`, `chrome.action.openPopup`).
- **No `<all_urls>` host permission** at install time. We use `activeTab` + `optional_host_permissions` requested per-action.
- **All API calls** go to `https://api.letsmarknow.com` only. No third-party domains except favicon CDN (`https://cdn.letsmarknow.com`).
- **Single source of truth:** the server. The extension is a cache + UI shell. Conflicts always resolve server-side.
