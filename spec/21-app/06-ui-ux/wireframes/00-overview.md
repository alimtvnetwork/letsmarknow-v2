# 00 — Wireframes Folder Overview

> **Purpose.** Low-fidelity reference layouts for the **highest-traffic screens**. Wireframes are *intent diagrams*, not pixel mocks. They lock zone composition (where the sidebar lives, where the search input sits, where the primary action surfaces) so feature work can proceed in parallel without re-arguing layout each time.

---

## 1. Responsibilities

1. **Pin zone composition** for the screens listed below.
2. **Define the primary action** at every screen (the one button a new user must find within 5 seconds).
3. **Enumerate the responsive breakpoints** each wireframe supports (referencing `06-ui-ux/19-breakpoints.md`).
4. **Show the empty state, the populated state, and the dense state** for each screen.

---

## 2. File-by-file behaviour

| File | Owns |
|---|---|
| `01-dashboard.md` | Authenticated landing: top bar, sidebar, primary "Save" CTA, recent strip, pinned grid, suggestions panel. |
| `02-popup.md` | Chrome extension popup: current-tab card, destination picker, tag chips, save button, recent items list. |
| `03-share-viewer.md` | Public `/t/{slug}` page: password gate, viewer chrome (or chromeless embed), view-mode switcher. |
| `04-onboarding.md` | First-run wizard: stepper, plan selector, install-extension card, import-bookmarks card, "create your first Space" finish. |
| `05-billing.md` | Billing page: current plan card, seat usage, invoices table, payment method, dunning banner. |
| `readme.md` | Reading order + which page in `05-web-app/` consumes each wireframe. |

---

## 3. Tasks performed by this folder

- **Anchor layout debate to a single artefact** so contributors align on zones before pixel work.
- **Be the upstream reference** that `05-web-app/03-dashboard.md`, `04-extension/04-popup.md`, `05-web-app/14-share-viewer.md`, `05-web-app/04-onboarding.md`, and `05-web-app/08-billing-page.md` cite.
- **Define the empty/populated/dense triplet** so engineering knows which states must be implemented for each screen.

---

## 4. What this folder is NOT

- **Not pixel mocks.** No specific colours, typography, or shadows; those live in `06-ui-ux/01-design-tokens.md`.
- **Not interaction specs.** Click behaviour, focus order, and motion live in `06-ui-ux/07-motion.md`, `06-ui-ux/08-keyboard-input.md`.
- **Not exhaustive.** Only the highest-traffic screens are wireframed; secondary screens are spec'd in plain markdown under `05-web-app/`.

---

## 5. Cross-references

- Tokens applied to these layouts: `06-ui-ux/01-design-tokens.md`.
- Breakpoints: `06-ui-ux/19-breakpoints.md`.
- Page specs that consume each wireframe: `05-web-app/03-dashboard.md`, `04-extension/04-popup.md`, `05-web-app/14-share-viewer.md`, `04-onboarding.md`, `05-web-app/08-billing-page.md`.
