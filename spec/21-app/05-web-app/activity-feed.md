# Activity Feed (`/org/:id/activity`)

Org-wide chronological History Events feed.

---

## 1. Data source

`GET /v1/history?limit=50` cursor-paginated; live updates via WebSocket `broadcast` messages.

## 2. Layout

Two-column on wide screens:
- Left: scrollable feed.
- Right: filter panel (sticky).

```
┌─────────────────────────────────────────┬──────────────────┐
│ Today                                    │ Filters          │
│ ─────────────                            │ ──────────────── │
│ 14:22  Alim deleted item "ChatGPT"       │ Actor            │
│        in Quick Tools         [Undo]     │  ☑ Alim          │
│                                          │  ☐ Sara          │
│ 14:18  Sara created collection           │                  │
│        "React Patterns" in Evatix         │ Type             │
│                                          │  ☑ Item          │
│ Yesterday                                │  ☑ Collection    │
│ ─────────────                            │  ☑ Share         │
│ 09:01  System purged 4 items from Trash  │  ☐ Member        │
│ 08:42  Stripe activated subscription     │                  │
│                                          │ Date             │
│ April 16                                 │  Last 30 days ▾  │
│ ─────────────                            │                  │
│ 11:00  Alim invited sara@…               │ [ Reset ]        │
│ ...                                      │                  │
└─────────────────────────────────────────┴──────────────────┘
```

## 3. Event row anatomy

```
[time]  [actor avatar] [verb phrase] [entity link]   [meta]   [actions]
```

- Verb phrase from event type ("created", "deleted", "moved", "renamed", "shared", "unshared", "added tag", "removed tag", "invited member", "changed role", "subscribed", "canceled", "imported N items", "exported", "session saved", etc.).
- Entity link goes to the entity (or its trash row if deleted).
- Meta: e.g. "to Quick Tools", "as Editor", "from Free → Pro".
- Actions: "Undo" if undoable + within window; "Show details" expands diff inline.

## 4. Filters

- Actor (multi-select Members + "System")
- Event type (grouped: Items, Collections, Groups, Spaces, Shares, Members, Billing, Imports, Sessions)
- Date range (last 24 h / 7 d / 30 d / 90 d / custom)
- Entity (autocomplete by name)
- Hide "noisy" events (renames, position changes) — toggle ON by default

Filters reflected in URL: `?actor=alim&type=item.deleted&since=2026-04-01`.

## 5. Detail expand

Each row has chevron → expands inline:
- Diff view (old vs new for edits)
- Snapshot of entity at time of event (for deletes)
- Client info (browser/extension version)
- IP country (Owner only)

## 6. Live updates

- WebSocket `broadcast` events insert at top with subtle slide-in animation (250 ms).
- "N new events" pill at top if user scrolled away; click to scroll to top.

## 7. Undo

- Per-row "Undo" calls `/v1/history/:id/undo`.
- "Undo entire batch" available if event has `batch_id` shared with siblings (e.g. multi-delete).
- Toast on success ("Restored 7 items"); failure shows reason ("Already undone", "Window expired").

## 8. Permissions

- All Members see all events (transparent collaboration).
- IP and client details: Owners/Admins only.
- "System" actor events show without IP.

## 9. Performance

- Virtualized list at > 100 rows.
- Day/Week section headers stickied.
- Avatar images lazy-loaded.

## 10. Telemetry

- `activity.viewed`
- `activity.filtered` with `{ filter_count }`
- `activity.undo_clicked` with `{ event_type }`
- `activity.detail_expanded` with `{ event_type }`

## 11. Empty / error states

- 0 events: "No activity yet. Things you and your team do will show up here."
- API error: red banner with retry.

## 12. Export (Team)

- "Export feed" button → CSV of current filter view (max 10 k rows).
- Triggers `POST /v1/exports` with `format=activity_csv` and current filter state.
