# Keyboard & Input

Global keymap, focus management, key conflicts, accessibility.

---

## 1. Source of truth

A single `shared/keymap.ts` exports the entire keymap. It powers:
- The in-app handler (`useHotkeys`).
- The cheat sheet (`?` shortcut).
- The extension `commands` declarations (where they overlap).
- Documentation pages.

If a key is added/removed, this file is the only place to change.

## 2. Global keymap

### 2.1 Cross-surface (web + extension dashboard)

| Keys | Action | Scope |
|---|---|---|
| `Cmd/Ctrl+K` | Open command palette | global |
| `/` | Focus search box | global, when no input focused |
| `?` | Open keyboard cheat sheet | global |
| `Escape` | Close topmost modal/popover, clear selection, blur input | global |
| `g d` | Go to dashboard | global |
| `g s` | Go to search | global |
| `g t` | Go to trash | global |
| `g a` | Go to activity | global |
| `g m` | Go to members | global (if has access) |
| `g b` | Go to billing | global (if has access) |
| `n c` | New collection | global |
| `n s` | New space | global |
| `n i` | New item (manual) | global |
| `n g` | New group (in current collection) | dashboard |
| `c` | Toggle sidebar collapse | global |
| `[` / `]` | Prev / next collection in sidebar | dashboard |
| `1` / `2` / `3` / `4` | Switch view: grid / list / compact / column | dashboard |
| `,` | Open settings (`/me/profile`) | global |

### 2.2 Card-focused

| Keys | Action |
|---|---|
| `j` / `k` | Next / previous card |
| `h` / `l` | Left / right (grid mode) |
| `Enter` | Open in new tab |
| `Shift+Enter` | Open in new window |
| `Cmd/Ctrl+Enter` | Open in current tab |
| `J` (capital) | Jump to tab if open in browser |
| `e` | Edit (open detail) |
| `m` | Move (opens picker) |
| `t` | Add tag (opens chip input) |
| `s` | Toggle star |
| `Backspace` / `Delete` | Soft-delete (with undo toast) |
| `Cmd/Ctrl+D` | Duplicate |
| `Cmd/Ctrl+C` | Copy URL |
| `Cmd/Ctrl+L` | Copy LMN deep link |
| `Space` | Toggle multi-select |
| `Shift+Click` | Range multi-select |

### 2.3 Bulk-selection mode

When ≥ 1 card selected, top-bar transforms into bulk action bar:

| Keys | Action |
|---|---|
| `Cmd/Ctrl+A` | Select all in current view |
| `m` | Bulk move |
| `t` | Bulk tag |
| `Backspace` | Bulk delete |
| `Escape` | Clear selection |

### 2.4 Modal-internal

- `Tab` / `Shift+Tab` cycles focus *within* modal (focus trap).
- `Enter` submits primary action.
- `Escape` cancels.
- `Cmd/Ctrl+Enter` submits when textarea is focused (since plain Enter inserts newline).

### 2.5 Editor (notes / description)

Markdown-lite editor follows standard:
- `Cmd/Ctrl+B` bold, `+I` italic, `+K` link, `+E` inline code.
- `Cmd/Ctrl+Z` / `+Shift+Z` undo / redo.
- `Tab` indents list item; `Shift+Tab` outdents.

### 2.6 Extension-only (declared in MV3 manifest)

| Keys | Action |
|---|---|
| `Alt+S` | Open popup |
| `Alt+Shift+S` | Save current tab |
| `Alt+Shift+W` | Save current window's tabs (session) |
| `Alt+K` | Quick-find across saves |

User-rebindable in `chrome://extensions/shortcuts`.

## 3. Focus management

- **Focus visible** always (`:focus-visible` ring; never use `outline: none` without a replacement).
- **Initial focus** on modal: first focusable element OR an explicitly marked `data-autofocus`.
- **Restore focus** after modal close: returns to the element that opened it.
- **Focus order** matches DOM order; never use `tabIndex > 0`.
- **Skip links**: "Skip to main content" appears at top on focus.
- **Sidebar tree** follows W3C tree pattern (arrow keys navigate, Enter activates, Right expands, Left collapses).
- **Tabs** follow tab pattern (arrow keys cycle, Tab moves out).

## 4. Conflict resolution

- Browser shortcuts (`Cmd+T`, `Cmd+W`, `Cmd+L`, `Cmd+R`, etc.) **never** intercepted.
- `/` shortcut suppressed when any text input has focus.
- `g <x>` sequence has 800 ms timeout; if next key not pressed in time, sequence cancels.
- `?` only opens cheat sheet when no input focused.

## 5. Touch input

- Long-press ≥ 500 ms = right-click context menu.
- Swipe-left on item row → quick actions (mobile).
- Pinch on dashboard zooms density (Comfortable ↔ Compact).

## 6. IME

- Korean / Japanese / Chinese composition: handlers ignore key events while `isComposing` is true.
- Enter during composition does not submit forms.

## 7. Cheat sheet (`?`)

A modal with searchable list of all shortcuts grouped by section. Generated from `shared/keymap.ts`. Includes a "Customize" link → `/me/profile` (future feature: rebinding).

## 8. Accessibility

- All shortcuts announced in cheat sheet with platform-aware modifier symbols (`⌘` on macOS, `Ctrl` elsewhere).
- ARIA `aria-keyshortcuts` on buttons that have shortcuts.
- Screen-reader-only text for icon-only triggers.

## 9. Telemetry

- `keymap.shortcut_used` `{ id, surface }` (sampled 10%).
- `keymap.cheatsheet_opened`
- `keymap.conflict_detected` (if user-rebound shortcut conflicts with built-in).

## 10. Forbidden

- Shortcuts requiring 3+ modifiers (hard to reach).
- Shortcuts that match common screen-reader keys (`NVDA+...`, `VO+...` on macOS).
- Single-letter shortcuts that fire while typing in inputs (we always check `target.isContentEditable` and input element types).
