# New Tab Dashboard

The full-page experience that replaces `chrome://newtab`. This is where users live.

---

## 1. Layout

```
┌────────────────────────────────────────────────────────────────────┐
│ [PE] [AP] [+]                                          🔍  ⚙  👤  │  ← top bar
├────┬───────────────────────────────────────────────────────────────┤
│ S  │  Marketing Improvements      📈  ⋯                            │
│ p  │  ─────────────────────────────────────────                    │
│ a  │  4 items · 2 tags · last edited 2h ago                        │
│ c  │                                                                │
│ e  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ │
│ s  │  │  card     │  │  card     │  │  card     │  │  card     │ │
│    │  └───────────┘  └───────────┘  └───────────┘  └───────────┘ │
│ +  │                                                                │
│    │  Group: Quick Tools  🐤  ⌄                                    │
│    │  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ …                                  │
│    │  └──┘ └──┘ └──┘ └──┘ └──┘                                    │
└────┴───────────────────────────────────────────────────────────────┘
```

- **Left rail (64 px):** Org switcher (vertical list of avatars). Highlighted = active. `+` to create Org.
- **Sidebar (260 px, collapsible):** Spaces & their Collections (tree). Drag-and-drop reorder. Right-click context menu.
- **Top bar:** Search (`Cmd/Ctrl+K`), Settings, Account.
- **Main:** the active Collection (or Space overview, or Search results).

## 2. View modes (toggle in Collection header)

| Mode | Use case | Layout |
|---|---|---|
| **Grid** (default) | Visual browsing | Cards 240×160, 4-up at 1280px |
| **List** | High density text | One row per item; favicon+title+url+tags |
| **Compact** | Power users | Small chips; 8-up grid |
| **Column** (Tab Extend style) | Multi-collection view | Each Collection as a vertical column scrolling independently |

User preference per Collection persists in `account_collection_state.view_mode`.

Column mode is the default for the **Space overview** (when no specific Collection selected) — shows all Collections side-by-side.

## 3. Drag and drop

- **Within Collection:** reorder items (HTML5 DnD; uses `position` field).
- **Item → Group:** drop on group header; item moves into group.
- **Item → Collection (sidebar):** drop on Collection name; calls `/items/:id/move`.
- **Tab from Chrome → page:** dropping a URL onto the page creates an Item in the focused Collection (uses content-script intercept of `dragover`).
- **Multi-select drag:** `Cmd/Ctrl+click` to multi-select cards; drag the stack.
- **Visual feedback:** drop targets show 2px primary-color outline; drag image is a card thumbnail with count badge.

## 4. Item card anatomy

```
┌────────────────────────┐
│  [favicon]  domain.com │  ← 12px header
│  ──────────────────    │
│  Bold Title…           │  ← 2-line clamp
│                        │
│  description…          │  ← 2-line, optional
│  ─────────────────     │
│  #tag #tag    ★  ⋯     │
└────────────────────────┘
```

Hover: card lifts (shadow-md → shadow-lg), action icons appear (open in new tab, jump-to-tab if open in browser, edit, delete).

## 5. Hover-to-jump

If the URL of a card matches an open tab in the current window, the favicon pulses briefly and clicking the card switches to that tab instead of opening a new one. (Toggleable per-Account in Options; default ON.)

## 6. Bulk select

- `Cmd/Ctrl+click` cards to multi-select.
- Floating action bar appears at bottom: `Move…  Tag…  Star  Delete  Export`.
- `Esc` clears selection.

## 7. Right-click context menu

On Item card:
```
Open in new tab        ⏎
Open in new window     ⇧⏎
Jump to existing tab   J
─────────────────────
Copy URL               ⌘C
Edit                   E
Move to…               M
Add tag…               T
─────────────────────
Star                   S
Hide
─────────────────────
Delete                 ⌫
```

On Group / Collection header: similar but with `Open all`, `Duplicate`, `Hide group`, `Share…`.

## 8. Top-bar search

`Cmd/Ctrl+K` opens command palette overlay (centered, 600×480). Tabs:
- **Find** — search items/collections/groups (`/v1/search`)
- **Go** — navigate to Spaces/Collections
- **Do** — actions (new collection, save current tab, sign out, etc.)
- **Help** — keyboard shortcuts cheatsheet

## 9. Empty states

| Scenario | Render |
|---|---|
| Org with no Spaces (impossible — onboarding always seeds one) | n/a |
| Space with no Collections | Big illustration + "Create your first collection" + "Or import from Toby/Pocket/Bookmarks" |
| Collection with no items | "Save a tab from any window. Try `Alt+Shift+S` now." with mini animation |
| Search no results | "Nothing matches **chat**. Try [Save tab from URL](?)" |

## 10. Onboarding overlay (first-run)

3-step coachmark:
1. "This is your dashboard. Your tabs live here." → arrows to sidebar.
2. "Save any tab with `Alt+Shift+S` or the toolbar icon." → arrows to icon area.
3. "Need a tab back? Click the card to jump." → arrow to a sample card.

Dismissable; stored as `prefs.onboarded_newtab=true`.

## 11. Performance

- Initial paint < 250 ms p75 from cache.
- Lists virtualized (`react-virtuoso`) when > 100 cards.
- Favicons lazy-loaded; placeholder is colored letter-tile.
- Background sync after first paint (don't block render).

## 12. Disable override

Options page toggle "Use Lets Mark Now as new tab" (default ON). When OFF, `newtab/index.html` does:
```js
window.location.replace("chrome-search://local-ntp/local-ntp.html");
```
Falls back to a "Open dashboard" button if the redirect is blocked.
