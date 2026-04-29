# 17 — Chrome Web Store Listing

> **Status.** Stub authored Session 39 to close SI-026 forward-ref. Content to be expanded before v1 Phase 1 store submission.
> **Owns.** All copy, imagery, and metadata that appear on the public Chrome Web Store listing for the Mark Now extension.

---

## 1. Purpose

Single source of truth for the Chrome Web Store (CWS) listing fields. Cited from `04-extension/01-manifest.md` §"Store metadata" for the long description, screenshots, and promo tile that the manifest's short fields point at.

---

## 2. Listing fields (CWS schema)

| Field | Source / rule | Notes |
|---|---|---|
| Extension name | `01-manifest.md` `name` field | Locked: "Mark Now — Visual Bookmarks". |
| Short description | `01-manifest.md` `description` (≤132 chars) | "Save and organize browser tabs and bookmarks visually." |
| Detailed description | This file §3 | Markdown→plain text, ≤16 000 chars. |
| Category | This file §4 | Primary: Productivity. |
| Language | This file §5 | v1: `en` only. Additional locales tracked in `17-i18n-a11y/` (planned, SI-026). |
| Screenshots | This file §6 | 5 × 1280×800 PNG, no alpha. Asset paths under `assets/store/screenshots/` in extension package. |
| Promo tile (small) | This file §6 | 440×280. |
| Marquee promo tile | This file §6 | 1400×560 (optional, used for featured slots). |
| Icon | `01-manifest.md` `icons.128` | Same asset as installed-extension icon. |
| Privacy policy URL | `19-security-privacy/07-privacy-policy.md` | Required by CWS for any extension requesting `<all_urls>` host permission. |
| Permissions justification | This file §7 | One paragraph per declared permission. |
| Single purpose | `01-manifest.md` §"Single purpose statement" | Verbatim copy. |

---

## 3. Detailed description

To be authored. Must reuse the single-purpose statement verbatim as the opening sentence (CWS reviewer signal).

---

## 4. Category

- Primary: **Productivity**.
- Secondary (if CWS allows): none in v1.

---

## 5. Localization

v1 ships English only. Locale-specific listings tracked in `17-i18n-a11y/extension-strings.md` (planned, SI-026).

---

## 6. Image asset inventory

| Slot | Dimensions | Filename (in extension package `assets/store/`) | Status |
|---|---|---|---|
| Icon 128 | 128×128 PNG | `icon-128.png` | Reuse `01-manifest.md` icon. |
| Screenshot 1 | 1280×800 PNG | `screenshots/01-popup-save.png` | TBD before submission. |
| Screenshot 2 | 1280×800 PNG | `screenshots/02-new-tab-dashboard.png` | TBD. |
| Screenshot 3 | 1280×800 PNG | `screenshots/03-collection-grid.png` | TBD. |
| Screenshot 4 | 1280×800 PNG | `screenshots/04-share-link.png` | TBD. |
| Screenshot 5 | 1280×800 PNG | `screenshots/05-search.png` | TBD. |
| Promo tile | 440×280 PNG | `promo/small-tile.png` | TBD. |
| Marquee | 1400×560 PNG | `promo/marquee.png` | Optional. |

---

## 7. Permissions justification

One paragraph per permission declared in `01-manifest.md`. To be drafted; CWS rejects vague justifications.

---

## 8. Cross-references

- Cited from: `04-extension/01-manifest.md` §"Store metadata" line 176.
- Privacy policy: `19-security-privacy/privacy-policy.md` (planned, SI-026).
- Rollout pipeline: `04-extension/13-update-and-rollout.md`.
- Brand assets: `06-ui-ux/01-design-tokens.md` §1.1 (primary pink anchor for promo imagery).
