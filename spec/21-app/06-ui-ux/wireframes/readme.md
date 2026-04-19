# Wireframes

> **Purpose:** ASCII-annotated layout specs for every primary surface. AIs and humans use these as the "shape" reference; `01-design-tokens.md` provides the visual style; `17-copy-strings.md` provides the text.
>
> **Closes:** Blocker B1 from `audit/gap-analysis.md`.

## Files

| File | Surface | Routes |
|---|---|---|
| `01-dashboard.md` | Web app — main landing after sign-in | `/` (authed), `/dashboard` |
| `02-popup.md` | Browser extension popup | n/a (extension) |
| `03-share-viewer.md` | Public share viewer | `/s/:token` |
| `04-onboarding.md` | First-run onboarding flow | `/welcome`, `/welcome/:step` |
| `05-billing.md` | Org billing & plan management | `/settings/billing` |

## How to read these wireframes

- **Boxes** (`┌─┐`) represent containers, panels, or components.
- **Annotations** in `[brackets]` are component names from `03-component-library.md`.
- **Copy keys** in `{curly.braces}` reference `17-copy-strings.md`.
- **Density** assumes "Cozy" mode (`15-data-density.md`) at 1280×800.
- **Breakpoint notes** are in each file.
- **Empty/error/loading** variants follow `12-empty-error-loading.md`.

## Locked rules

- Wireframes specify **structure**, not visual style. Style comes from tokens.
- Every interactive element has a **copy key**, not a hard-coded label.
- Mobile breakpoint behavior (`< 768px`) is documented per file.
- New surfaces require a wireframe before implementation begins.
