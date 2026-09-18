# PWA

`app.letsmarknow.com` is installable as a PWA. Useful when the extension isn't available (mobile, Safari desktop, ChromeOS without extensions).

---

## 1. Manifest (`/manifest.webmanifest`)

> 📌 **Hex-literal exception.** Web App Manifest is static JSON per W3C spec and does not accept CSS custom properties; `background_color` / `theme_color` MUST be literal hex. Values below mirror the dark `--background: 222 47% 6%` token in `06-ui-ux/01-design-tokens.md` (≈ `#0E1729`, rounded to `#0F172A` for manifest readability). Update both surfaces together if the dark surface token changes.

```json
{
  "name": "Lets Mark Now",
  "short_name": "LMN",
  "id": "/?source=pwa",
  "start_url": "/dashboard?source=pwa",
  "scope": "/",
  "display": "standalone",
  "display_override": ["window-controls-overlay","standalone"],
  "orientation": "any",
  "background_color": "#0F172A",
  "theme_color": "#0F172A",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "shortcuts": [
    { "name": "New collection", "url": "/dashboard?action=new_collection" },
    { "name": "Search", "url": "/search" },
    { "name": "Trash", "url": "/trash" }
  ],
  "share_target": {
    "action": "/save",
    "method": "GET",
    "params": { "title": "title", "text": "text", "url": "url" }
  },
  "protocol_handlers": [
    { "protocol": "web+lmn", "url": "/handle?u=%s" }
  ],
  "categories": ["productivity"],
  "lang": "en"
}
```

## 2. Service Worker

- Workbox-based, registered at `/sw.js`.
- Precaches: shell HTML, CSS, JS, fonts, icons, offline page.
- Runtime caches:
  - API GETs: `stale-while-revalidate`, max-age 5 min, max 100 entries.
  - Favicons (`cdn.letsmarknow.com/favicons/*`): `cache-first`, max-age 30 d, max 500 entries.
  - Images: `cache-first`, max-age 30 d.
- Excludes: `/auth/*`, `/v1/auth/*` (always network).

Update flow:
- New SW on every deploy; user gets toast "New version available — Reload" on next focus.
- `clients.claim()` after activate.

## 3. Offline experience

- Shell renders from cache.
- Last-fetched data shown with "Offline" badge.
- Mutations queued in IndexedDB; flushed on `online` event (mirrors extension offline queue logic).
- Offline page (when navigating to uncached URL): branded illustration + "You're offline. Try again." + cached recent collections.

## 4. Web Share Target

- Receives shares from native OS / browser share sheet.
- `/save?title=...&url=...` route opens prefilled new-item modal in dashboard.
- Allows Android to "Share to Lets Mark Now" from any app.

## 5. Protocol handler

- Registers `web+lmn://` so links like `web+lmn://collection/0190a4f1-6c5e-7c2a-9b3f-1234567890ab` open in installed PWA on the user's device.
- Used in cross-device deep links (e.g. share link emailed to self → opens PWA on phone if installed).

## 6. Push notifications (PWA)

- Subscribed via `PushManager.subscribe()` after permission grant.
- Subscription stored on server with VAPID keys.
- Used for: invite received, share comment, billing event, mentions in notes.
- Per-user opt-in in `/me/notifications`.

## 7. Install prompts

- Listen to `beforeinstallprompt`; defer; show after user has used app for ≥ 5 min OR completed onboarding.
- Custom install banner in app shell with rationale; respects "don't ask again" for 30 days.

## 8. iOS specifics

- iOS doesn't fire `beforeinstallprompt`. Show one-time tip with "Add to Home Screen" instructions when detected as Safari iOS.
- Safari doesn't support web push reliably pre-iOS 16.4; gracefully degrade.
- `apple-touch-icon` + `apple-mobile-web-app-capable` meta tags.

## 9. ChromeOS & desktop

- "Window Controls Overlay" display mode for slick title bar integration where supported.
- File handlers: `application/json` (for native LMN exports) — opens in PWA's import flow.

## 10. Privacy

- Push subscriptions never include item URLs/titles.
- Notification payloads come from server signed with our VAPID key only.

## 11. Telemetry

- `pwa.installed`
- `pwa.launch_source` `{ source: "pwa"|"shortcut"|"share_target"|"protocol_handler" }`
- `pwa.offline_used` (when an offline action queues)
- `pwa.push_subscribed` / `_unsubscribed`
- `pwa.update_prompted` / `_accepted`

## 12. Verification matrix

| Browser | PWA install | Offline | Push | Share Target | Protocol |
|---|---|---|---|---|---|
| Chrome desktop | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edge desktop | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chrome Android | ✅ | ✅ | ✅ | ✅ | ✅ |
| Safari iOS 16.4+ | ✅ (A2HS) | ✅ | ✅ | partial | ❌ |
| Safari macOS 17+ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Firefox | partial | ✅ | ✅ | ❌ | ❌ |
