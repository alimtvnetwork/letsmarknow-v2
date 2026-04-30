# 17 — Internationalization & Accessibility

> **Audience.** Engineers and translators working on Mark Now's localization, accessibility, and inclusive-design surfaces.
>
> **Scope.** This folder owns the **strings catalogs**, **locale negotiation**, **RTL/LTR rules**, **a11y patterns shared across surfaces**, and the **translation pipeline**. Surface-specific accessibility decisions live with their surface (e.g. `06-ui-ux/20-accessibility-wcag.md` for the design-system AA baseline; this folder owns the i18n contracts those surfaces consume).

---

## 1. Responsibilities

This folder is the source of truth for:

1. **String catalogs** — extension `_locales/` and the web-app server-served catalog format. Every user-visible string is keyed and goes through `t("key")`.
2. **Locale negotiation** — per-account preference → browser `navigator.languages` → `en-US` fallback. Never IP-based.
3. **Pluralization & gender** — CLDR plural rules via `Intl.PluralRules`. Never `count === 1 ? "x" : "xs"` in code.
4. **RTL/LTR rules** — bidi handling, mirrored layouts, logical CSS properties.
5. **Content-side a11y** — alt-text policies, screen-reader phrasing, `lang` tagging on dynamic content. (Visual a11y — colour contrast, focus rings — lives in `06-ui-ux/20-accessibility-wcag.md`.)
6. **Translation pipeline** — source-string change → "needs review" propagation across all locales.

---

## 2. File-by-file behaviour

| # | File | Purpose |
|---|---|---|
| 00 | `00-overview.md` | This file. Folder map and shared principles. |
| 01 | `01-extension-strings.md` | Browser-extension string catalog (manifest + UI), `chrome.i18n` integration, store-listing localization. |

Future planned files (not yet authored, intentionally unlisted to avoid forward-ref churn): web-app strings catalog, locale negotiation contract, RTL specifics, plural/gender rules, translator workflow, a11y testing matrix.

---

## 3. Tasks performed by this folder

- Author and key new user-visible strings before they ship in any surface.
- Validate extension `_locales/<lang>/messages.json` shape on PRs that touch extension strings.
- Resolve a locale for a given Account on session bootstrap.
- Provide `t("key", { count, ...vars })` helpers consumed by extension + web app.
- Mark all locales `"needs review"` when an English source string changes.
- Lint raw JSX text and reject it (planned `i18n-no-raw-strings` linter; tracked under §6 References).

---

## 4. What this folder is NOT

- **Not** the design-system a11y baseline — that lives in `06-ui-ux/20-accessibility-wcag.md` (WCAG 2.2 AA contracts, focus-ring tokens, motion-reduction).
- **Not** the keyboard-shortcut SoT — that lives in `06-ui-ux/08-keyboard-input.md` and `06-ui-ux/22-keyboard-cheatsheet.md`.
- **Not** the surface copy library — marketing/onboarding/empty-state copy is curated in `06-ui-ux/17-copy-strings.md` (this folder defines how those strings are translated, not what they say).
- **Not** the legal/compliance copy SoT — ToS/Privacy/DPA text lives in `19-security-privacy/`.
- **Not** a runtime-translation service — translations are baked at build time per locale; no live MT in v1.

---

## 5. Shared principles

1. **Single source of truth per surface.** Extension strings live in extension `_locales/`; web app strings live in a server-served catalog. No string is duplicated across surfaces — shared phrases reference a `core` namespace.
2. **English (`en-US`) is the source language.** All other locales are translations. Source strings change → all locales auto-mark "needs review".
3. **No hard-coded user-visible strings in code.** Every string goes through a `t("key")` call. CI lints raw JSX text and rejects PRs (planned `i18n-no-raw-strings` linter).
4. **Pluralization** uses CLDR plural rules via `Intl.PluralRules`. Never `count === 1 ? "item" : "items"` in code.
5. **Locale negotiation order.** Per-account preference → browser `navigator.languages` → fallback `en-US`. Never IP-based.
6. **Accessibility is not a feature.** WCAG 2.2 AA is the baseline (per `06-ui-ux/20-accessibility-wcag.md`). This folder owns the *content-side* a11y rules: alt-text policies, screen-reader phrasing conventions, language tagging.

---

## 6. Locale support (v1)

| Locale | Status | Notes |
|---|---|---|
| `en-US` | Source | All strings authored here first. |
| `en-GB` | Variant | Spelling-only diffs, auto-generated then human-reviewed. |
| Others | Roadmap | Tracked in `20-roadmap/`. v1 ships English only. |

The catalog format and pipeline are designed for N-locale day-one expansion; absence of translated locales is a content decision, not an architectural one.

---

## 5. Cross-references

- `06-ui-ux/20-accessibility-wcag.md` — WCAG 2.2 AA baseline.
- `06-ui-ux/22-keyboard-cheatsheet.md` — i18n-aware key-binding labels.
- `06-ui-ux/17-copy-strings.md` — canonical English source for shared UI copy.
- `10-licensing-billing/16-billing-emails.md §5` — currency/date localization.
- `04-extension/07-context-menu.md` — `chrome.i18n.getMessage` consumer.
- `04-extension/17-store-listing.md` — Chrome Web Store locale-specific listings.
- `19-security-privacy/` — legal/compliance copy SoT (ToS, Privacy, DPA).
