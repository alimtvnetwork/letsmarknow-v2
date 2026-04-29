# Keyboard Cheatsheet

> **Audience.** Engineers implementing the `?` cheatsheet modal across all Mark Now surfaces (extension popup, new-tab, side-panel, web app).
>
> **Scope.** The discoverability surface for keyboard shortcuts. The full binding list and rebinding flow live in `06-ui-ux/08-keyboard-input.md` and `04-extension/08-keyboard-shortcuts.md`; this file covers **only the cheatsheet UI itself**.

---

## 1. Trigger

| Trigger | Surface | Behavior |
|---|---|---|
| `?` (Shift+/, no other modifier) | Any LMN surface (popup, new-tab, side-panel, web app) | Opens cheatsheet modal. |
| `Cmd/Ctrl+/` | Same | Same (alternative trigger for keyboards where `?` requires Shift+layer chord). |
| Click "Keyboard shortcuts" in account menu | Any | Same. |
| Deep link `?cheatsheet=1` query | Web app only | Opens modal on page load (used by support docs). |

**Suppression:** Trigger is ignored when focus is inside an editable element (`<input>`, `<textarea>`, `[contenteditable]`) **except** if the editable is empty AND the surface explicitly opted in (currently none).

---

## 2. Layout

A centered modal, max-width 720 px, max-height 80 vh, scrollable body. Closes on `Esc`, backdrop click, or close button.

```
┌─────────────────────────────────────────────┐
│  Keyboard shortcuts                    [✕]  │
│  ┌───────────────────────────────────────┐  │
│  │ 🔍 Filter shortcuts…                  │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Navigation                                 │
│  ────────────────────────────────────────   │
│   J / ↓        Next item                    │
│   K / ↑        Previous item                │
│   G then C     Go to Collections            │
│   …                                         │
│                                             │
│  Capture                                    │
│  ────────────────────────────────────────   │
│   S            Save current tab             │
│   Shift+S      Save all tabs (session)      │
│   …                                         │
│                                             │
│  [Customize shortcuts ↗]   [Print cheatsheet]│
└─────────────────────────────────────────────┘
```

---

## 3. Content sources

The modal is **data-driven**. It reads from a single JSON catalog at build time:

```ts
// lib/keyboard/catalog.ts (planned)
type Shortcut = {
  id: string;            // stable, e.g. "nav.next-item"
  group: ShortcutGroup;  // see §4
  keys: KeyCombo[];      // primary + alternates, OS-aware
  label: string;         // i18n key
  description?: string;  // i18n key, optional 1-line context
  surfaces: Surface[];   // where this binding is active
  rebindable: boolean;   // false for browser-managed (Chrome commands cap)
};
```

The same catalog powers:

- `06-ui-ux/22-keyboard-cheatsheet.md` (this modal)
- `06-ui-ux/21-options-page.md §3` Shortcuts section (rebind UI)
- `04-extension/08-keyboard-shortcuts.md` (extension manifest `commands`)

Single source of truth. A linter (planned) will fail CI if the manifest's `commands` keys diverge from the catalog.

---

## 4. Groups (display order)

1. **Navigation** — move focus, switch sections, jump to Org/Space.
2. **Capture** — save tab, save session, quick-add.
3. **Item actions** — open, share, label, archive, delete.
4. **Selection** — multi-select, range, select-all.
5. **Sharing** — copy share link, open lmk resolver.
6. **View** — toggle theme, density, sidebar.
7. **Help** — open this cheatsheet, open command palette.

Groups with zero shortcuts active on the current surface are hidden.

---

## 5. OS / surface awareness

- `Cmd` on macOS, `Ctrl` on Windows/Linux/ChromeOS. Detected via `navigator.platform` at modal mount; not at app startup (catches OS theme/keyboard changes during session).
- Surface-scoped: a binding active only in the side panel shows a small `Side panel` chip on its row.
- **Conflict surfacing:** if a user-rebound key collides with a built-in browser shortcut Chrome refused to override, the row shows a ⚠️ chip with tooltip "Browser kept this shortcut. Choose another in extension settings."

---

## 6. Filter / search

- Top input filters by binding label, description, or literal key (e.g. typing `cmd+s` matches Save).
- Match is fuzzy (lowercase, diacritic-insensitive, substring).
- Empty result state: "No shortcuts match. [Clear filter]"
- Filter state is **not** persisted across opens.

---

## 7. Customize / Print

- **Customize shortcuts** button → opens `06-ui-ux/21-options-page.md#/shortcuts` in a new tab.
- **Print cheatsheet** button → triggers a print-styled view (`06-ui-ux/16-print-stylesheet.md`): black-on-white, 2-column flow, no chrome. Used by power users for desk reference.

---

## 8. Accessibility

- Modal traps focus; first focusable is the close button, second is the filter input.
- `aria-labelledby="cheatsheet-title"`, `role="dialog"`, `aria-modal="true"`.
- Each shortcut row is `<dt>` (key) + `<dd>` (label) inside a `<dl>` per group, so screen readers announce key→action pairs naturally.
- Key chips use `<kbd>` with visible text (no icon-only keys); the `Cmd` glyph (`⌘`) is suffixed with text "Cmd" for screen readers via `<kbd aria-label="Command">⌘</kbd>`.
- Meets WCAG 2.2 AA per `06-ui-ux/20-accessibility-wcag.md`.

---

## 9. Telemetry

- `cheatsheet.opened { surface, trigger: "key" | "menu" | "deep_link" }`
- `cheatsheet.searched { query_length }` — query text never sent.
- `cheatsheet.shortcut_clicked { shortcut_id }` — when a row is activated (Enter or click) to invoke the action directly from the modal.

Catalog per `04-extension/14-analytics-telemetry.md`.

---

## 10. Empty / error / loading

The catalog is bundled, so the modal cannot fail to load. If catalog parsing throws (defensive), the modal shows a single-line error: "Couldn't load shortcuts. [Reload]" with a button that hard-reloads the surface.

---

## 11. References

- `06-ui-ux/08-keyboard-input.md` — full binding list, conflict rules.
- `06-ui-ux/21-options-page.md` — rebind UI (Shortcuts section).
- `04-extension/08-keyboard-shortcuts.md` — extension manifest `commands` block.
- `06-ui-ux/16-print-stylesheet.md` — print rendering.
- `17-i18n-a11y/extension-strings.md` — string catalog (planned per SI-026).
