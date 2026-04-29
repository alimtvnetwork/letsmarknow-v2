# Options Page

> **Audience.** Engineers building the extension's Options page (chrome://extensions → Mark Now → Details → Extension options) and the equivalent in-app `Settings` surface.
>
> **Scope.** UI structure, sections, and bindings for the **extension Options page** (manifest `options_ui.page`). The web-app Settings page mirrors most of this surface (`07-features/16-settings.md`); divergences are noted per section.

---

## 1. Surface

| Property | Value |
|---|---|
| Manifest key | `options_ui.page = "options.html"` |
| `open_in_tab` | `true` (full tab; Chrome's embedded modal is too narrow for our two-pane layout) |
| Route inside extension | `options.html#/<section>` (hash router so deep links work without server) |
| Web-app mirror | `app.letsmarknow.com/settings/<section>` (same section keys) |
| Auth required | Signed-in only. Unauthenticated visitors are redirected to `popup.html#/signin` then bounced back. |
| Org context | Inherits the active Organization from `04-extension/05-state-sync.md`. A header dropdown switches Org without leaving the page. |

---

## 2. Layout

Two-pane: 240 px left rail (sticky section nav) + fluid right pane (max-width 720 px). Mobile / narrow window (< 720 px): left rail collapses to a top dropdown.

```
┌──────────────────────────────────────────────┐
│  [LMN logo]  Mark Now Settings   [Org ▼] [👤]│
├──────────────┬───────────────────────────────┤
│ General      │                               │
│ Account      │       <section content>       │
│ Capture      │                               │
│ Shortcuts    │                               │
│ Sharing      │                               │
│ Privacy      │                               │
│ Sync         │                               │
│ Notifications│                               │
│ Appearance   │                               │
│ Advanced     │                               │
│ About        │                               │
└──────────────┴───────────────────────────────┘
```

Components from `06-ui-ux/03-component-library.md`: `SettingsRail`, `SettingsSection`, `SettingsRow`, `Toggle`, `Select`, `RadioGroup`, `KeyBindingInput`.

---

## 3. Sections

| # | Key | Title | Web mirror? | Notes |
|---|---|---|---|---|
| 1 | `general` | General | ✅ | Default landing page (popup vs new-tab), language, timezone. |
| 2 | `account` | Account | ✅ (deeper) | Profile basics + link to full account at `app.letsmarknow.com/settings/account`. Sign-out lives here. |
| 3 | `capture` | Capture | ❌ extension-only | Save Session defaults: dedup mode, ignored hostnames, auto-tag rules. Ref `04-extension/09-save-session.md §6`. |
| 4 | `shortcuts` | Keyboard Shortcuts | partial | List + rebind. Bindings stored in extension storage (Chrome's `commands` API caps at 4 user-rebindable; rest are surface-level). Cheatsheet link → `06-ui-ux/22-keyboard-cheatsheet.md`. |
| 5 | `sharing` | Sharing | ✅ | Default Share access mode, default expiry, custom-slug entitlement status, `lmk/{org_handle}` claim. |
| 6 | `privacy` | Privacy | ✅ | Telemetry opt-in toggle, tracking-param strip toggle, "Forget this device" button. Ref `19-security-privacy/06-extension-privacy.md`. |
| 7 | `sync` | Sync | ❌ extension-only | Last sync timestamp, manual "Sync now" button, conflict log link. Ref `04-extension/10-sync-and-offline.md`. |
| 8 | `notifications` | Notifications | ✅ | Per-channel toggles (email, in-app, browser native). Ref `08-sharing-collab/08-notifications.md`. |
| 9 | `appearance` | Appearance | ✅ | Theme (system / light / dark), density (comfortable / compact), accent color (Pro+). Ref `06-ui-ux/02-theming.md` + `15-data-density.md`. |
| 10 | `advanced` | Advanced | ❌ | Developer toggles (verbose logs, beta channel opt-in, export local cache as JSON). Hidden behind 5-tap version-number easter egg on the About section. |
| 11 | `about` | About | ✅ | Version, build hash, browser, OS, "Check for updates", links to changelog, terms, privacy policy. |

Section keys are **stable** — they appear in deep links shared in support emails and must never be renamed without a redirect entry in the hash router.

---

## 4. Persistence

| Setting class | Stored in | Synced across devices? |
|---|---|---|
| Account / Sharing / Notifications / Privacy (server-truth) | Server, table `account_settings` (per-account) and `org_settings` (per-org) | Yes, via account/org. |
| Capture / Sync / Appearance density | Extension `chrome.storage.sync` | Yes, across the user's signed-in Chrome profiles (Chrome's built-in sync). |
| Shortcuts (Chrome `commands` API) | Browser-managed, per-install | No (Chrome limitation). |
| Advanced toggles | Extension `chrome.storage.local` | No (per-install). |
| Theme preference | Both (server for web, `storage.sync` mirror for extension) | Yes, server is source of truth on conflict. |

Conflict resolution: server-truth wins on next sync. Extension shows a non-blocking toast `Setting updated from another device` when a server push overrides a local value.

---

## 5. Save semantics

- **Auto-save** for toggles, selects, radio groups: change fires immediately, debounced 400 ms, with optimistic UI + rollback toast on failure.
- **Explicit Save** for free-text fields (e.g. "Display name", "lmk handle"): "Save" button activates on dirty state; `Esc` reverts.
- **Destructive actions** (Sign out everywhere, Reset shortcuts, Delete account) require a typed-confirmation dialog per `06-ui-ux/11-feedback.md §4`.

---

## 6. Empty / error / loading

Per `06-ui-ux/12-empty-error-loading.md`. Each section renders a 6-row skeleton on first paint. Network errors collapse the section and show a retry banner with the request ID.

---

## 7. Accessibility

- Left rail is a `<nav aria-label="Settings sections">` with a single-select listbox pattern.
- All toggles have visible labels (no label-by-aria-only).
- Tab order: rail → section header → first row → top-bar Org switcher → top-bar avatar.
- Meets WCAG 2.2 AA per `06-ui-ux/20-accessibility-wcag.md`.

---

## 8. Telemetry

Per `04-extension/14-analytics-telemetry.md`. Events:

- `settings.opened { surface: "extension" | "web", section }`
- `settings.changed { section, key, old_value_hash, new_value_hash }` — values hashed; raw values never sent.
- `settings.reset { scope: "shortcuts" | "all" }`

---

## 9. References

- `04-extension/02-surfaces.md` — Options is one of 5 extension surfaces.
- `04-extension/08-keyboard-shortcuts.md` — rebinding flow.
- `06-ui-ux/22-keyboard-cheatsheet.md` — `?` modal spec.
- `07-features/16-settings.md` — web-app Settings page.
- `19-security-privacy/06-extension-privacy.md` — privacy controls behavior.
