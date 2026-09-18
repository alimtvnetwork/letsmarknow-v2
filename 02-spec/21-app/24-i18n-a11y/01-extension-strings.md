# Extension Strings

> **Audience.** Engineers and translators working on the Mark Now browser extension's localized strings (manifest, UI, context menu, store listing).
>
> **Scope.** The string-catalog format, lookup mechanism, and translation pipeline for **everything the extension renders to a user** — including the Chrome Web Store listing.
>
> **Not in scope.** Web-app strings (separate catalog, planned), keyboard binding labels (sourced from `06-ui-ux/22-keyboard-cheatsheet.md` shared catalog).

---

## 1. Catalog format

The extension uses Chrome's native i18n format: `_locales/<locale>/messages.json`, one folder per locale.

```json
{
  "extensionName": {
    "message": "Mark Now",
    "description": "Extension display name shown in Chrome Web Store and toolbar."
  },
  "extensionDescription": {
    "message": "Save tabs, organize collections, share memorable links.",
    "description": "Chrome Web Store short description (≤132 chars)."
  },
  "ctxSavePage": {
    "message": "Save this page to Mark Now",
    "description": "Right-click context menu item on any page."
  },
  "ctxSaveLink": {
    "message": "Save link to Mark Now",
    "description": "Right-click context menu item on a hyperlink."
  },
  "popupSignedOut": {
    "message": "Sign in to save tabs",
    "description": "Empty-state popup heading when user is signed out."
  },
  "popupSavedToast": {
    "message": "Saved to $COLLECTION$",
    "description": "Toast after a successful save.",
    "placeholders": {
      "COLLECTION": { "content": "$1", "example": "Inbox" }
    }
  }
}
```

**Rules.**

- Every key MUST have a `description` field (not a Chrome requirement, but enforced by our linter — translators need context).
- Placeholders use the `$NAME$` form, declared in `placeholders`. Never inline `${var}` (Chrome wouldn't substitute it).
- Keys are camelCase. Group prefix conventions: `ctx*` (context menu), `popup*` (popup surface), `newTab*` (new-tab surface), `options*` (options page), `cmd*` (chrome.commands), `notif*` (notifications), `store*` (Web Store listing).
- Reserved keys: `extensionName`, `extensionDescription` (consumed by Chrome from the manifest's `__MSG_extensionName__` references).

---

## 2. Manifest integration

The extension manifest references catalog keys via `__MSG_*__`:

```json
{
  "manifest_version": 3,
  "name": "__MSG_extensionName__",
  "description": "__MSG_extensionDescription__",
  "default_locale": "en",
  "commands": {
    "save_current_tab": {
      "description": "__MSG_cmdSaveCurrentTab__"
    }
  }
}
```

Per `04-extension/01-manifest.md` (manifest "Full manifest" + "Store listing extras" sections). The `default_locale` field is **required** when any `__MSG_*__` substitution is used; `en` is the source.

---

## 3. Lookup at runtime

```ts
import { t } from "@/lib/i18n";

const label = t("ctxSavePage");                    // "Save this page to Mark Now"
const toast = t("popupSavedToast", { COLLECTION: "Inbox" });
```

Internally `t()` wraps `chrome.i18n.getMessage(key, substitutions)` with:

- Dev-mode warning when a key is missing.
- Production fallback to the source-language string (never a raw key in UI).
- Test-mode flag that returns `[[key]]` for snapshot testing.

---

## 4. Store listing localization

The Chrome Web Store listing has its own localized fields, sourced from the same `_locales/` catalog where possible:

| Store field | Catalog key | Length cap |
|---|---|---|
| Title | `extensionName` | 75 chars (Chrome cap), we target ≤45. |
| Short description | `extensionDescription` | 132 chars hard. |
| Detailed description | `storeDetailedDescription` | 16 384 chars; markdown not allowed; uses literal newlines. |
| Promo tagline | `storePromoTagline` | 45 chars. |
| Screenshots captions | `storeScreenshot1Caption` … `storeScreenshot5Caption` | 124 chars each. |

Listings for non-source locales are uploaded via the Web Store API only when the corresponding locale is approved for release per `04-extension/17-store-listing.md §5` (Localization).

---

## 5. Translation pipeline

1. **Author** in `_locales/en/messages.json`. PR adds the keys with `description` filled in.
2. **CI extract** — a job scans for new/changed keys, opens issues in the translation tracker (Crowdin or POEditor; vendor TBD, tracked in `20-roadmap/`).
3. **Translate** — translators submit per-locale PRs that update only their `_locales/<locale>/messages.json`.
4. **Verify** — CI runs:
   - **Schema linter** — every key has `message` + `description`; placeholders match across locales.
   - **Length linter** — `extensionName` ≤ 45, `extensionDescription` ≤ 132, etc.
   - **Plural-form linter** — keys with plural forms (e.g. `popupItemCount`) declare `one` and `other` (and locale-specific extras like `few`, `many` for Slavic).
5. **Ship** — extension build bundles all `_locales/`. Web Store listing API updates run on the same release tag.

---

## 6. Pluralization

Chrome's native `messages.json` does **not** support CLDR plurals natively. We use ICU MessageFormat strings stored in `message`:

```json
{
  "popupItemCount": {
    "message": "{count, plural, one {# item} other {# items}}",
    "description": "Item count badge in popup header."
  }
}
```

Resolution happens client-side via a tiny ICU-MessageFormat runtime (~3 KB gzipped). The `t()` helper detects ICU syntax and routes accordingly. Pure-string keys skip the parser entirely.

---

## 7. RTL

When the active locale is RTL (Arabic, Hebrew, etc.):

- Extension surfaces set `dir="rtl"` on `<html>`.
- Layout uses logical CSS properties (`margin-inline-start`, not `margin-left`).
- Icons that have direction (back/forward arrows, "open in new" glyphs) flip via the `[dir="rtl"] &` selector.
- An RTL-specifics file in this folder is on the roadmap (tracked in `20-roadmap/`); until then, follow the logical-CSS-property rule above and the design-system layout primitives in `06-ui-ux/04-layout-grid.md`.

---

## 8. A11y notes specific to extension strings

- All `aria-label` text comes from the catalog (`a11y*` prefix).
- Screen-reader-only strings (`.sr-only`) live with the same rules — translated, never inlined.
- Avoid abbreviation-heavy strings; expand "Coll." to "Collection" — screen readers don't know our shorthand.
- Currency, date, and number rendering uses `Intl.*` formatters with the active locale; never string concat.

---

## 9. Versioning

Catalog format is **v1**. A breaking change (e.g. adopting Fluent FTL syntax) bumps the version and adds a migration script. Each entry's `description` may include `since: <ext version>` notes for translator context.

---

## 10. References

- `04-extension/01-manifest.md §3` — `__MSG_*__` substitution and `default_locale`.
- `04-extension/07-context-menu.md` — `chrome.i18n.getMessage` consumer.
- `04-extension/17-store-listing.md` — Chrome Web Store listing fields.
- `24-i18n-a11y/00-overview.md` — folder principles.
- `06-ui-ux/22-keyboard-cheatsheet.md` — shared key-binding label catalog.
