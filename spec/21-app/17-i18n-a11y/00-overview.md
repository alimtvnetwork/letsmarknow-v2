# 17 — Internationalization & Accessibility

> **Audience.** Engineers and translators working on Mark Now's localization, accessibility, and inclusive-design surfaces.
>
> **Scope.** This folder owns the **strings catalogs**, **locale negotiation**, **RTL/LTR rules**, **a11y patterns shared across surfaces**, and the **translation pipeline**. Surface-specific accessibility decisions live with their surface (e.g. `06-ui-ux/20-accessibility-wcag.md` for the design-system AA baseline; this folder owns the i18n contracts those surfaces consume).

---

## 1. Files in this folder

| # | File | Purpose |
|---|---|---|
| 00 | `00-overview.md` | This file. Folder map and shared principles. |
| 01 | `01-extension-strings.md` | Browser-extension string catalog (manifest + UI), `chrome.i18n` integration, store-listing localization. |

Future planned files (not yet authored, intentionally unlisted to avoid forward-ref churn): web-app strings, locale negotiation, RTL specifics, plural/gender rules, translator workflow, a11y testing matrix.

---

## 2. Shared principles

1. **Single source of truth per surface.** Extension strings live in extension `_locales/`; web app strings live in a server-served catalog. No string is duplicated across surfaces — shared phrases reference a `core` namespace.
2. **English (`en-US`) is the source language.** All other locales are translations. Source strings change → all locales auto-mark "needs review".
3. **No hard-coded user-visible strings in code.** Every string goes through a `t("key")` call. CI lints raw JSX text and rejects PRs (planned `i18n-no-raw-strings` linter).
4. **Pluralization** uses CLDR plural rules via `Intl.PluralRules`. Never `count === 1 ? "item" : "items"` in code.
5. **Locale negotiation order.** Per-account preference → browser `navigator.languages` → fallback `en-US`. Never IP-based.
6. **Accessibility is not a feature.** WCAG 2.2 AA is the baseline (per `06-ui-ux/20-accessibility-wcag.md`). This folder owns the *content-side* a11y rules: alt-text policies, screen-reader phrasing conventions, language tagging.

---

## 3. Locale support (v1)

| Locale | Status | Notes |
|---|---|---|
| `en-US` | Source | All strings authored here first. |
| `en-GB` | Variant | Spelling-only diffs, auto-generated then human-reviewed. |
| Others | Roadmap | Tracked in `20-roadmap/`. v1 ships English only. |

The catalog format and pipeline are designed for N-locale day-one expansion; absence of translated locales is a content decision, not an architectural one.

---

## 4. References

- `06-ui-ux/20-accessibility-wcag.md` — WCAG 2.2 AA baseline.
- `06-ui-ux/22-keyboard-cheatsheet.md` — i18n-aware key-binding labels.
- `10-licensing-billing/16-billing-emails.md §5` — currency/date localization.
- `04-extension/07-context-menu.md` — `chrome.i18n.getMessage` consumer.
- `04-extension/17-store-listing.md` — Chrome Web Store locale-specific listings.
