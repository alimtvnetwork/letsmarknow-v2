# 18 — Firefox Port (Phase 4)

> **Status.** Stub authored Session 39 to close SI-026 forward-ref. v1 is **Chrome-only** per `00-overview/05-browser-scope.md`. This file documents the future Firefox build so we don't paint ourselves into a Chrome-only corner during v1 design.
> **Phase.** Tracked in `20-roadmap/05-phase-4-cross-browser.md`. Do **not** start work before Phase 4.

---

## 1. Purpose

Capture the deltas between the Chrome MV3 build and a future Firefox WebExtensions build, so v1 design choices remain port-friendly without spending v1 effort on Firefox itself.

---

## 2. Build delta

| Aspect | Chrome (v1) | Firefox (Phase 4) |
|---|---|---|
| Manifest version | MV3 | MV3 (Firefox 109+ supports MV3); fall back to MV2 only if a required API is missing. |
| Background context | Service worker | Background script (event page) — Firefox MV3 does **not** require a service worker. Code must work in either. |
| API namespace | `chrome.*` | `browser.*` (Promise-based). Use `webextension-polyfill` so source compiles to both. |
| Build output | `dist/chrome/` (zip → CWS) | `dist/firefox/` (XPI → AMO). |
| Signing | CWS automatic | AMO requires upload-then-sign (`web-ext sign`). |
| Update channel | CWS auto-update | AMO auto-update **or** self-hosted `updates.json`. |
| Native messaging | Same protocol | Same protocol; manifest path differs per OS. |

---

## 3. Source-level rules to keep v1 port-ready

These rules apply to the **v1 Chrome build** so the Phase 4 port is mechanical:

1. Never call `chrome.*` directly. All calls go through a `browser` import that resolves to `chrome` (with polyfill) under Chrome and `browser` natively under Firefox.
2. Never assume service-worker-only globals (e.g. `clients`, `registration`) — guard with feature detection.
3. Avoid CSS that depends on Chrome-only `-webkit-` prefixes for layout (decorative is fine).
4. Storage: `chrome.storage.local` and `chrome.storage.sync` both exist on Firefox; avoid `chrome.storage.session` (Firefox MV3 missing this in some channels — re-check at Phase 4).

Violations of rules 1–4 are tracked as `extension-portability` linter findings (planned linter, not yet shipped).

---

## 4. AMO listing

Mirror `04-extension/17-store-listing.md` content, with these additions:
- AMO requires source-code submission for any obfuscated/minified code.
- AMO review SLAs are slower than CWS — plan release cadence accordingly.

---

## 5. Cross-references

- Cited from: `04-extension/13-update-and-rollout.md` §"Firefox" line 113.
- Phase milestone: `20-roadmap/05-phase-4-cross-browser.md`.
- Browser scope lock: `00-overview/05-browser-scope.md`.
- Manifest contract: `04-extension/01-manifest.md`.
