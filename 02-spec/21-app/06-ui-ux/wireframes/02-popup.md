# Wireframe — Extension Popup

> **Surface:** Browser extension popup (Chrome MV3, 360×500 default)
> **Spec ref:** `04-extension/04-popup.md`, `07-features/01-save-tab.md`

---

## 1. Default state — current tab

```
┌──────────────────────────────────────────┐
│ ┌─Logo─┐ {product_name}        [⚙] [👤] │ ← 48px header
├──────────────────────────────────────────┤
│ ┌──────────────────────────────────────┐ │
│ │ [Favicon] Page title (truncates)     │ │ ← Current tab card
│ │           example.com/path           │ │   80px
│ └──────────────────────────────────────┘ │
│                                          │
│ {label.title}                            │
│ ┌──────────────────────────────────────┐ │
│ │ Editable title                       │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ {item.add_note}  (optional)              │
│ ┌──────────────────────────────────────┐ │
│ │ Add a note…                          │ │
│ │                                      │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ {label.tags}                             │
│ ┌──────────────────────────────────────┐ │
│ │ [#work ×] [#read ×] + Add tag        │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Save to                                  │
│ ┌──────────────────────────────────────┐ │
│ │ ▾ Personal › Reading list            │ │ ← Collection picker
│ └──────────────────────────────────────┘ │
│                                          │
├──────────────────────────────────────────┤
│ [Save session ↗]            [Cancel] [Save] │ ← 48px footer
└──────────────────────────────────────────┘
```

### Component map
- **Header** — 48px, brand + settings + account
- **Current tab card** — favicon (16×16), title, hostname
- **Title input** — pre-filled from `<title>`, editable
- **Note textarea** — 60px min, expands to 120px max
- **Tag chips** — multi-select with autocomplete from existing tags
- **Collection picker** — combobox with create-new option
- **Save session link** — switches to "save all tabs" mode (see §3)
- **Footer** — sticky, primary CTA right-aligned

---

## 2. Saved confirmation (post-save)

```
┌──────────────────────────────────────────┐
│ ┌─Logo─┐ {product_name}        [⚙] [👤] │
├──────────────────────────────────────────┤
│                                          │
│            ┌───────────┐                 │
│            │     ✓     │                 │
│            └───────────┘                 │
│                                          │
│         {status.saved}                   │
│         to Personal › Reading            │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │  [Open in app]                       │ │
│ └──────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐ │
│ │  [Edit]              [Delete]        │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Auto-closes in 3s                        │
└──────────────────────────────────────────┘
```

---

## 3. Session-save mode

```
┌──────────────────────────────────────────┐
│ ┌─Logo─┐ Save session         [⚙] [👤]  │
├──────────────────────────────────────────┤
│ {label.title}                            │
│ ┌──────────────────────────────────────┐ │
│ │ "Tuesday research"                   │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Tabs in this window  (12)  [☐ Select all]│
│ ┌──────────────────────────────────────┐ │
│ │ ☑ [F] github.com/...                 │ │
│ │ ☑ [F] stackoverflow.com/...          │ │
│ │ ☐ [F] mail.google.com (skipped)      │ │
│ │ ☑ [F] news.ycombinator.com           │ │
│ │ ... (scrollable)                     │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Save to: ▾ Personal › Sessions           │
│                                          │
├──────────────────────────────────────────┤
│ [← Single tab]      [Cancel] [Save N tabs]│
└──────────────────────────────────────────┘
```

---

## 4. States

- **Not signed in:** Full-popup CTA `{btn.signin}` with brief value prop.
- **Offline:** Banner using `{status.offline}`; save still works (queued, syncs later).
- **Quota exceeded:** Inline error using `{toast.billing.quota_exceeded}` + upgrade link.
- **Duplicate detected:** Inline notice "Already saved on {date}" with link to existing item.

---

## 5. Keyboard shortcuts (popup-scoped)

- `Cmd/Ctrl + S` — save (form submit)
- `Esc` — close popup
- `Tab` — cycle focus per `08-keyboard-input.md`
- `Cmd/Ctrl + Shift + S` — toggle session-save mode

---

## 6. Telemetry events

- `popup_opened` (`{trigger: "icon"|"shortcut"|"context_menu"}`)
- `tab_saved` (`{collection_id, has_note, tag_count}`)
- `session_saved` (`{tab_count, collection_id}`)
- `popup_dismissed` (`{state: "saved"|"canceled"}`)
