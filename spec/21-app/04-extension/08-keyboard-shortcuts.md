# Keyboard Shortcuts

Defined in manifest `commands` block. Users can rebind via `chrome://extensions/shortcuts`.

---

## 1. Default bindings

| Command id | Default | Mac | Action |
|---|---|---|---|
| `_execute_action` | `Alt+S` | `Alt+S` | Open popup |
| `save_current_tab` | `Alt+Shift+S` | `Alt+Shift+S` | Save active tab to last-used Collection (no popup) |
| `save_session` | `Alt+Shift+W` | `Alt+Shift+W` | Save all tabs in window as a session (opens preview popup) |
| `quick_find` | `Alt+K` | `Alt+K` | Open popup with focus on quick-find |
| `open_new_tab_dashboard` | unbound | unbound | Open dashboard in new tab |

Chrome enforces:
- Modifier required (`Ctrl`/`Alt`/`Cmd`/`MacCtrl`).
- Max 4 commands with default keys (we use 4; `open_new_tab_dashboard` is unbound by design).

## 2. Handler (SW)

```ts
chrome.commands.onCommand.addListener(async (command, tab) => {
  switch (command) {
    case "save_current_tab":  return quickSave(tab);
    case "save_session":      return startSaveSessionFlow(tab);
    case "quick_find":        return chrome.action.openPopup({ /* focus=quickfind */ });
    case "open_new_tab_dashboard": return chrome.tabs.create({ url: "chrome://newtab" });
  }
});
```

`quickSave(tab)`:
1. Read `last_used_collection_id`. If null → open popup instead with picker focused.
2. POST `/v1/items` (idempotency-keyed by `tab.id + tab.url + minute`).
3. Show `chrome.notifications` toast with Undo (6s).
4. On success: bump `last_opened_at` is NOT done here (only on actual open).

## 3. Conflicts

- Chrome silently ignores duplicates if another extension already grabs the same combo. We detect by inspecting `chrome.commands.getAll()` after install:
  - For each command with `shortcut === ""`, show a one-time in-product banner: "Your shortcut for **Save tab** is unset. Set it in chrome://extensions/shortcuts."
- Banner dismissable; stored as `prefs.kb_warning_dismissed`.

## 4. In-product cheat sheet

`?` (no modifier) inside any LMN surface (popup, new-tab, side panel) opens a modal showing all bindings, both extension shortcuts AND in-app shortcuts (e.g. `J` to jump-to-tab). See `06-ui-ux/22-keyboard-cheatsheet.md`.

## 5. Mac specifics

- `Cmd` requires explicit `mac` override; otherwise Chrome maps `Ctrl` → `Cmd` automatically. We chose `Alt` (= Option on Mac) to avoid clobbering common system bindings.
- `Alt+S` does NOT collide with macOS default text-input shortcuts in our test matrix.

## 6. Telemetry

Each command fire emits a single event `extension.shortcut_used` with `{ command, latency_ms_to_action_completed }`. No URL.
