# Wireframe — Dashboard

> **Route:** `/` (authenticated), `/dashboard`
> **Spec ref:** `05-web-app/dashboard.md`, `05-web-app/shell.md`
> **Viewport baseline:** 1280×800, "Cozy" density.

---

## 1. Desktop layout (≥ 1024px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [TopBar]                                                                     │
│  ┌─Logo─┐  {label.search} ⌘K               [NotifBell] [HelpMenu] [AvatarMenu] │
│  └──────┘  ┌──────────────────────────────┐                                  │
│            │ search input (full-width)    │                                  │
│            └──────────────────────────────┘                                  │
├────────────┬─────────────────────────────────────────────────────────────────┤
│            │                                                                 │
│ [Sidebar]  │  {dashboard.greeting.morning}                          [DensityToggle] │
│  240px     │  ─────────────────────────────────────────────────              │
│            │                                                                 │
│ ◉ Home     │   ┌─ {dashboard.section.recent} ────────────────── [SeeAll →] ┐│
│ ★ Pinned   │   │  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                     ││
│ ⏱ Recent   │   │  │Itm│ │Itm│ │Itm│ │Itm│ │Itm│ │Itm│   [ItemCard × N]    ││
│ 🔗 Shared  │   │  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘                     ││
│ 🗑 Trash   │   └────────────────────────────────────────────────────────────┘│
│            │                                                                 │
│ ─SPACES─   │   ┌─ {dashboard.section.pinned} ─────────────────── [SeeAll →] ┐│
│ ▾ Personal │   │  ┌─────────┐ ┌─────────┐ ┌─────────┐                      ││
│   ▸ Work   │   │  │Collection│ │Collection│ │Collection│  [CollectionCard]  ││
│   ▸ Read   │   │  └─────────┘ └─────────┘ └─────────┘                      ││
│ ▸ Team     │   └────────────────────────────────────────────────────────────┘│
│            │                                                                 │
│ [+ Space]  │   ┌─ {dashboard.section.shared_with_me} ──────────────────────┐│
│            │   │  ┌─────────┐ ┌─────────┐                                  ││
│            │   │  │Shared by│ │Shared by│   [SharedCard]                   ││
│ ─────────  │   │  │ Alice   │ │ Bob     │                                  ││
│ [Settings] │   │  └─────────┘ └─────────┘                                  ││
│ [Upgrade]  │   └────────────────────────────────────────────────────────────┘│
│            │                                                                 │
└────────────┴─────────────────────────────────────────────────────────────────┘
```

### Component map
- **TopBar** — fixed, 56px tall, `--background` with `--border` bottom 1px
- **Sidebar** — 240px wide, collapsible to 56px, scrollable independent of content
- **Content area** — max-width 1200px, padding 32px, scrollable
- **ItemCard** — 200×140, see `15-visualization/grid-view.md`
- **CollectionCard** — 240×120
- **SharedCard** — 240×140 with sharer avatar overlay

### States
- **Empty (new user):** All three sections collapse into a single hero with `{dashboard.empty.cta}` button.
- **Loading:** Skeleton cards (6 per section).
- **Error:** Banner at top using `state.error.generic.*` keys; sections still render with cached data when available.

---

## 2. Tablet (768–1023px)

- Sidebar collapses to icon-only (56px).
- Sections stay; cards reflow to 4 per row → 3 per row.

---

## 3. Mobile (< 768px)

```
┌─────────────────────────────────┐
│ [☰] Logo            [Search] [+]│
├─────────────────────────────────┤
│ {dashboard.greeting.*}          │
│                                 │
│ {dashboard.section.recent}      │
│ ┌──────┐ ┌──────┐               │
│ │ Itm  │ │ Itm  │  ← horiz scroll│
│ └──────┘ └──────┘               │
│                                 │
│ {dashboard.section.pinned}      │
│ ┌──────────────────────────────┐│
│ │ Collection card (full-width) ││
│ └──────────────────────────────┘│
│                                 │
│ {dashboard.section.shared_with_me}│
│ ...                             │
├─────────────────────────────────┤
│ [Home] [Search] [Add] [Inbox] [Me]│ ← Bottom nav
└─────────────────────────────────┘
```

- Sidebar becomes a sheet (`[☰]` opens drawer).
- Bottom nav replaces sidebar shortcuts.
- Sections become horizontally-scrollable rows for items, full-width cards for collections.

---

## 4. Interaction notes

- **⌘K / Ctrl+K** opens command palette (see `07-features/command-palette.md`).
- **Drag-and-drop** items between sections obeys `06-ui-ux/drag-and-drop.md`.
- **Right-click** any card opens context menu (see `06-ui-ux/navigation-patterns.md`).
- **Hover** on item card reveals quick actions (open, share, move, delete) — must also be reachable via keyboard.

---

## 5. Telemetry events fired

- `dashboard_viewed`
- `dashboard_section_clicked` (`{section: "recent"|"pinned"|"shared_with_me"}`)
- `dashboard_item_opened` (`{item_id, source: "dashboard"}`)
