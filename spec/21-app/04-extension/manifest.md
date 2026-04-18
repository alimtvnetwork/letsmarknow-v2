# Manifest (Chrome MV3)

The exact `manifest.json` shape, permission model, and rationale for each entry. Locked for v1.

---

## Full manifest

```json
{
  "manifest_version": 3,
  "name": "Lets Mark Now",
  "short_name": "LMN",
  "version": "1.4.0",
  "version_name": "1.4.0",
  "description": "Save tabs, organize visually, share with one link. The bookmark manager that doesn't suck.",
  "default_locale": "en",
  "minimum_chrome_version": "116",

  "icons": {
    "16":  "icons/icon-16.png",
    "32":  "icons/icon-32.png",
    "48":  "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },

  "action": {
    "default_title": "Lets Mark Now — Save this tab",
    "default_popup": "popup/index.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png"
    }
  },

  "background": {
    "service_worker": "background/sw.js",
    "type": "module"
  },

  "chrome_url_overrides": {
    "newtab": "newtab/index.html"
  },

  "side_panel": {
    "default_path": "sidepanel/index.html"
  },

  "options_ui": {
    "page": "options/index.html",
    "open_in_tab": true
  },

  "omnibox": {
    "keyword": "lmn"
  },

  "commands": {
    "_execute_action": {
      "suggested_key": { "default": "Alt+S", "mac": "Alt+S" },
      "description": "Open Lets Mark Now popup"
    },
    "save_current_tab": {
      "suggested_key": { "default": "Alt+Shift+S", "mac": "Alt+Shift+S" },
      "description": "Save current tab to last-used Collection"
    },
    "save_session": {
      "suggested_key": { "default": "Alt+Shift+W", "mac": "Alt+Shift+W" },
      "description": "Save all tabs in this window as a session"
    },
    "open_new_tab_dashboard": {
      "description": "Open Lets Mark Now dashboard in a new tab"
    },
    "quick_find": {
      "suggested_key": { "default": "Alt+K", "mac": "Alt+K" },
      "description": "Quick-find across saved tabs"
    }
  },

  "content_scripts": [
    {
      "matches": ["https://letsmarknow.com/*", "https://*.letsmarknow.com/*"],
      "js": ["content/web-bridge.js"],
      "run_at": "document_idle",
      "all_frames": false
    }
  ],

  "web_accessible_resources": [
    {
      "resources": ["icons/*", "fonts/*"],
      "matches": ["<all_urls>"]
    }
  ],

  "permissions": [
    "storage",
    "tabs",
    "alarms",
    "contextMenus",
    "sidePanel",
    "identity",
    "scripting",
    "notifications",
    "favicon"
  ],

  "optional_permissions": [
    "bookmarks",
    "history",
    "downloads"
  ],

  "host_permissions": [
    "https://api.letsmarknow.com/*",
    "https://cdn.letsmarknow.com/*"
  ],

  "optional_host_permissions": [
    "<all_urls>"
  ],

  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; connect-src https://api.letsmarknow.com https://cdn.letsmarknow.com; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'; font-src 'self' data:;"
  },

  "externally_connectable": {
    "matches": ["https://letsmarknow.com/*", "https://*.letsmarknow.com/*"]
  }
}
```

---

## Permission rationale (must justify each in store listing)

| Permission | Why | User-visible at install? |
|---|---|---|
| `storage` | Local cache + settings | no |
| `tabs` | Read tab title/URL/favicon for save action | yes ("Read your browsing history" — Chrome's wording) |
| `alarms` | Scheduled sync, token refresh | no |
| `contextMenus` | Right-click → Save … menu | no |
| `sidePanel` | Side panel surface | no |
| `identity` | OAuth flow via `chrome.identity.launchWebAuthFlow` | yes |
| `scripting` | Inject save-confirmation toast on page when shortcut fires | yes (modest) |
| `notifications` | Save-success toast when popup closed | yes |
| `favicon` | `chrome://favicon/` access for fallback favicons | no |
| `bookmarks` *(optional)* | One-time import from Chrome bookmarks | requested at import time only |
| `history` *(optional)* | "Find tabs visited but not saved" feature (Pro) | requested at feature first-use |
| `downloads` *(optional)* | Export download UX | requested at export |

`<all_urls>` is **optional** so install dialog says only "letsmarknow.com domains". Promoted to required only when user opts into "Show LMN button on every page" (a future feature).

---

## CSP rationale

- `script-src 'self'` — no remote JS, no eval. Required by store anyway.
- `connect-src` whitelist — every fetch to anything other than the two LMN hosts will be blocked. Defense against compromised dependency.
- `style-src 'unsafe-inline'` — needed for Tailwind injected styles in extension pages. Acceptable since `script-src` is locked.

---

## Versioning

- `version`: SemVer-ish 4-part `MAJOR.MINOR.PATCH.BUILD` (Chrome accepts up to 4 dot-separated integers).
- Build number = CI run id; bump on every store upload.
- Web Store rejects re-uploads at the same `version`; CI fails fast on duplicates.

---

## Store listing extras (not in manifest)

- Category: **Productivity**
- Single purpose statement: "Save and organize browser tabs and bookmarks visually."
- Long description, screenshots, promo tile: see `20-release-ops/store-listing.md`.
- Privacy practices: see `19-security-privacy/extension-privacy.md`.
