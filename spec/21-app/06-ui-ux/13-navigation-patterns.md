# Navigation Patterns

Breadcrumbs, tabs, command palette, back-stack, deep links.

---

## 1. Primary nav

- **Org rail** (vertical, 64 px) — switch organization.
- **Sidebar** — Spaces & Collections tree + secondary links (Trash, Activity, Members, Settings).
- **Top bar** — logo, Org dropdown, search, notifications, account.

Together these form the App Shell (see `05-web-app/02-shell.md`).

## 2. Breadcrumbs

Used inside content area when entity hierarchy is non-trivial.

```
Spaces  ›  Evatix  ›  React  ›  Hooks
```

- Each segment a link except the last.
- Truncation: middle segments collapse to `…` if > 4 levels; clicking expands inline.
- Renders below page title for deep entity views; above for settings sub-pages.
- Uses shadcn `<Breadcrumb>` primitive.

## 3. Tabs

Two flavors:

### 3.1 Page tabs
For sub-sections of a single resource (e.g. `/org/:id/billing` has Plan / Invoices / Lifetime tabs).
- Underline-style.
- URL-driven (each tab a route).
- Keyboard cycle with arrow keys.

### 3.2 Filter tabs
For switching between data views (e.g. Active / Pending / All members).
- Pill-style.
- Reflect in `?filter=` query param.

## 4. Command palette (Cmd+K)

The fastest way to navigate or act.

Sections: **Find · Go · Do · Help**.

- **Find**: live results across Items, Collections, Tags as you type.
- **Go**: route navigation (Dashboard, Trash, Settings, specific Spaces/Collections).
- **Do**: actions (New collection, Import, Toggle theme, Sign out).
- **Help**: cheat sheet, docs links.

Implementation: shadcn `<Command>` + custom registry. Each entry has `{ id, label, section, keywords[], shortcut?, perform }`.

Keyboard:
- Up/Down to navigate
- Enter to perform
- Cmd+Enter to open in new tab where applicable
- Esc to close

Entries can be entitlement-gated (locked entries show ⚡ badge and route to upsell instead).

## 5. Back-stack & deep links

- TanStack Router preserves history; user can back-arrow through routes.
- Modal routes (`/i/:item_id`) treat the underlying page as the back destination.
- Deep links from email/extension/messages always resolve to a canonical route (no `?ref=` polluting history).

## 6. Active state

- Sidebar item is `bg-sidebar-accent text-sidebar-accent-foreground` when active.
- Top-bar Org dropdown shows current Org name + plan badge.
- Tab indicator visible on active tab.

## 7. Mobile nav

Bottom-tab bar (≤ md):
- Dashboard
- Search
- Saves (quick-save sheet trigger)
- Account

Sidebar collapses behind hamburger; org switcher inside sidebar drawer.

## 8. Skip links

- "Skip to main content" — first focusable element on every page.
- "Skip to sidebar" / "Skip to top bar" optional, behind preference.

## 9. Notifications popover

- Bell icon next to settings.
- Popover lists last 20; "Mark all read"; link to `/me/notifications`.
- Real-time updated via WebSocket; bell badge animates on arrival (respects reduced-motion).

## 10. Search

- Single global search input in top-bar.
- Submit → `/search?q=...`.
- Inline suggestions while typing (top 5 items).
- Field-prefix syntax surfaced in placeholder ("Try `tag:react in:Quick Tools`").

## 11. Cross-surface deep links

- Extension → web: opens `app.letsmarknow.com/<route>?from=ext`.
- Email → web: includes `?from=email&campaign=<id>`.
- Marketing → app: `letsmarknow.com/login?next=/<route>` preserves intent.

## 12. URL state conventions

URL is the source of truth for: active Space/Collection/Group/Item, search query, filters, view mode.

Reserved params (see `05-web-app/01-routes.md` § 5): `q`, `tag`, `view`, `org`, `next`, `from`.

## 13. Org switching

- From rail or top-bar dropdown.
- Triggers token refresh + cache clear.
- Current route preserved if entity-agnostic (Dashboard, Trash, Activity); else routes to `/dashboard`.

## 14. Sidebar interactions

- Tree pattern: arrow keys navigate; right expands; left collapses; Enter activates.
- Right-click context menu: Rename, Move, Duplicate, Share, Delete, Star.
- Drag to reorder (sibling) or move (drop on Space header).
- Multi-select with Shift+click for bulk move/delete.

## 15. Accessibility

- All nav landmarks: `<nav aria-label="...">`.
- Active link: `aria-current="page"`.
- Bottom-tab nav role `tablist` with `tab` items linking to routes.
- Sidebar tree: WAI-ARIA tree pattern.
- Command palette: `combobox` role with `aria-expanded`.

## 16. Telemetry

- `nav.org_switched`
- `nav.command_palette_opened`
- `nav.command_palette_action` `{ section, id }`
- `nav.sidebar_collapsed` / `_expanded`
- `nav.deep_link_followed` `{ from }`
