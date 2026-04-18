# Dashboard

The main browsing experience. Shares 80% of components with the extension new-tab page; adds a few web-only features (notes editor, large-screen optimizations, embeds).

> The base layout (cards, view modes, drag-and-drop, bulk select, hover-to-jump, right-click menus) is specified in `04-extension/new-tab.md`. This file documents the **web-app deltas**.

---

## 1. Differences vs extension new-tab

| Aspect | Extension new-tab | Web dashboard |
|---|---|---|
| Hover-to-jump | uses `chrome.tabs.query` | uses extension bridge if installed; otherwise just opens new tab |
| Save current tab | n/a (web app isn't a "tab" itself) | Bookmarklet button "Save this page" copies a small loader to clipboard, OR if extension installed, sends message |
| Save Session | n/a from web | "Save current window's tabs" button; only enabled if extension installed |
| Notes editor | basic textarea | full Markdown-lite editor with preview pane |
| Item detail | inline expand | dedicated `/i/:item_id` modal route |
| Embed previews | favicon only | rich previews for YouTube/Twitter/PDF/image (Pro+) |
| URL bar | n/a | shareable URL state (`?q=`, `?tag=`, `?view=`) |
| Browser shortcuts | extension `commands` | in-app keymap (see § 5) |

## 2. Item Detail modal (`/i/:item_id`)

Opens over the current dashboard. ESC or click-outside closes; URL reverts.

Layout:
```
┌──────────────────────────────────────────────┐
│  [favicon] domain.com                  ✕      │
│  ─────────────────────────────────────────    │
│  Title (editable inline)                       │
│  https://full.url.here                         │
│  ─────────────────────────────────────────    │
│  [#tag] [#tag] [+]                             │
│  ─────────────────────────────────────────    │
│  Description (markdown-lite, autosave)         │
│  ─────────────────────────────────────────    │
│  Notes (markdown-lite, autosave)               │
│  ─────────────────────────────────────────    │
│  [ Open ]  [ Jump to tab ]  [ ⋯ ]              │
│  ─────────────────────────────────────────    │
│  Activity (last 5 events)                      │
│  └ Alim moved to Quick Tools · 2h ago          │
│  └ Sara added tag "react" · 1d ago             │
└──────────────────────────────────────────────┘
```

- Autosave: debounce 800 ms; PATCH `/v1/items/:id` with `If-Match`.
- Conflict (409): show "Edited elsewhere" banner with diff option.
- "⋯" menu: Move…, Duplicate, Share single item…, Star, Delete.

## 3. Notes editor

- Markdown-lite: bold, italic, h1-h3, bullet/number lists, links (auto-detect), code inline + fenced, blockquote, horizontal rule.
- No images in v1 (Pro+ adds image upload; stored in object storage; rendered inline).
- Live preview toggle (split view at ≥ 1024 px; tabbed below).
- 8 KB cap (validated client-side; server enforces).

## 4. Embeds (Pro+)

When an Item URL matches a known embeddable pattern, the card flips to a richer preview:
- YouTube → 16:9 thumbnail + duration
- Twitter/X → first tweet text + author
- Image (jpg/png/gif/webp) → thumbnail
- PDF → first-page render (server-side)
- GitHub repo → name + description + stars

Free users see a "Preview not available" placeholder unless the URL is from a known no-cost source (favicon-only).

## 5. Keymap (in-app)

| Key | Action | Scope |
|---|---|---|
| `Cmd/Ctrl+K` | Command palette | global |
| `/` | Focus search | global |
| `?` | Show shortcut cheat sheet | global |
| `g d` | Go to dashboard | global |
| `g s` | Go to search | global |
| `g t` | Go to trash | global |
| `g a` | Go to activity | global |
| `n c` | New collection (in current Space) | global |
| `n s` | New space | global |
| `n i` | New item (manual URL entry) | dashboard |
| `e` | Edit selected item | card focused |
| `m` | Move selected | card focused |
| `t` | Tag selected | card focused |
| `s` | Star toggle | card focused |
| `j` / `k` | Next / prev card | dashboard |
| `Enter` | Open in new tab | card focused |
| `Shift+Enter` | Open in new window | card focused |
| `J` (capital) | Jump-to-tab | card focused |
| `Backspace` | Soft-delete (with undo toast) | card focused |
| `Esc` | Close modal / clear selection | global |

Cheat sheet is auto-generated from a single source (`shared/keymap.ts`).

## 6. View modes (recap from extension)

`grid | list | compact | column`. `column` is the default for Space-overview routes.

Per-Collection preferred mode persists.

## 7. Saving a tab from the web app

Web app cannot read other tabs in the browser by itself. Three save paths:
1. **Extension installed:** "Save current tab" button sends `LMN_SAVE_TAB` to extension → extension saves the active tab in the user's window.
2. **No extension, manual:** "+ New item" → modal with URL/title fields.
3. **Bookmarklet (legacy fallback):** drag-to-bookmarks bar; clicking it on any page opens `app.letsmarknow.com/save?url=...&title=...` which prefills the new-item modal.

## 8. Search results page (`/search`)

- Same dashboard chrome.
- Top: query, parsed filters (chips), result count, sort dropdown.
- Results grouped by type: Collections, Groups, Items, Tags.
- Click an Item result to open it (modal or new tab depending on `?action=open`).

## 9. Real-time updates

If WebSocket is connected, dashboard receives `invalidate` and `broadcast` events; cards animate in/out (250 ms). Otherwise, polling every 30 s while tab is focused.

## 10. Performance

- Initial paint p75 < 350 ms (warm cache).
- Code-split per route.
- Cards virtualized at > 100.
- Image previews lazy-loaded with `loading="lazy"` and `<picture>` srcsets.
- Service worker (PWA) caches static assets and offline shell.
