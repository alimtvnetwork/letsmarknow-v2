# Theming

Light, dark, system, plus per-Org accent and per-Share custom branding.

---

## 1. Theme modes

Three options on Account level (`prefs.theme`):

| Value | Behavior |
|---|---|
| `system` (default) | Follows `prefers-color-scheme` live |
| `light` | Forces `<html>` without `.dark` |
| `dark` | Forces `<html data-theme="dark">` and `.dark` class |

Implementation:
- `<html>` boots from a small inline script reading `localStorage.theme` to avoid FOUC.
- `system` mode subscribes to `matchMedia("(prefers-color-scheme: dark)")` for runtime switches.

## 2. Storage

- Logged-in: server `prefs.theme` is canonical; mirrored to `localStorage.theme` on each fetch.
- Logged-out: `localStorage.theme` only.
- Extension: shares same source via auth-bridge cached prefs.

## 3. Org accent (Pro+)

Owners pick an HSL color for their Org. When user is in that Org, `<html data-org-accent="...">` is set with three CSS vars:

```css
:root[data-org-accent] {
  --primary: var(--org-accent-h) var(--org-accent-s) var(--org-accent-l);
  --ring:    var(--org-accent-h) var(--org-accent-s) var(--org-accent-l);
}
```

Switch Org → vars updated → all `bg-primary`, `text-primary`, `ring-ring` re-tint with no reload.

Accent never overrides `--background`/`--foreground` — only accent-tier tokens.

Validation:
- Contrast checked vs `--background` and `--foreground`. If AA fail, warn Owner in `/org/:id/settings`.
- Saturation clamped to 25%–95% (no muddy grays as accents).

## 4. Custom branding for Share viewer (Pro+ / Team)

Per-share JSON (`share.branding`):

```json
{
  "show_lmn_branding": false,
  "logo_url": "https://cdn.../org/atto-logo.svg",
  "accent": { "h": 28, "s": 90, "l": 55 },
  "background": { "h": 220, "s": 60, "l": 14 },
  "foreground": { "h": 0,   "s": 0,  "l": 100 }
}
```

Applied via inline `<style>` injected in SSR HTML for the `/t/{slug}` route. Limited safe-list: only the four tokens above + a single optional Google-Fonts `font-family`.

Custom CSS overrides (Team) accept a strict allow-list parsed server-side; rejected properties are silently dropped and reported to the Owner via Audit.

## 5. Theme detection in extension surfaces

- Popup, Side Panel, New Tab, Options page each read `prefs.theme` from `chrome.storage.local`.
- New Tab respects system live; popup re-evaluates on open.
- Options page mirrors web `/me/profile` in look & feel.

## 6. High-contrast mode

- Triggered by `prefers-contrast: more`.
- Adds `data-contrast="more"` to `<html>`; tokens shift:
  - `--border` → `222 47% 11%` (light) / `0 0% 100%` (dark)
  - All `--muted-foreground` → `--foreground`
  - Removes hover-only color shifts; underlines all links.

## 7. Color blindness

- Status icons paired with text + shape (✔ check, ⚠ triangle, ✕ cross), never color alone.
- Selection state combines accent border AND check icon AND background tint.
- Charts (analytics) use shape patterns + colorblind-safe palette (Wong).

## 8. Theme switch animation

- 200 ms `var(--ease-inout)` cross-fade on `body::before` overlay; avoids flashing entire DOM.
- Disabled when `prefers-reduced-motion: reduce`.

## 9. Print theme

- Forced light tokens on `@media print` regardless of user theme; see `16-print-stylesheet.md`.

## 10. Telemetry

- `theme.changed` `{ from, to, reason: "user" | "system" | "org_switch" }`
- `theme.org_accent_applied` `{ org_id }`
- `theme.contrast_more_detected`
