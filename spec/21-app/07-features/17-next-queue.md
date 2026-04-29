# Feature: Next (focused to-do queue of Tabs)

> **Status:** spec, MVP-bound (Phase 1).
> **One-liner:** "Toby Next helps you move forward by turning open tabs into a clear, focused to-do list."
> **Source inspiration:** Toby's "Next" tab in the toolbar popup (gettoby.com → How it works → Next).

---

## 1. Purpose

A **per-Account, global** to-do queue of saved Tabs. Items can come from any
Collection in any Space in any Organization the Account belongs to. The queue
is curated, ordered, and check-offable. It is **not** a Collection in the
library sense — it is the user's "do this next" list.

| Pain | Next solves it by |
|---|---|
| Too many open tabs | Move "later" tabs into Next, then close them. |
| Forgetting what was important | Next is a curated, ordered queue. |
| Losing context when reopening | Each Next item restores the exact URL with one click. |
| Mixing reference and to-do | Collections = library; Next = to-do queue. |

Value bullets (verbatim, marketing/onboarding):

- Minimize tab clutter.
- Free up memory and mental space.
- Return to work exactly where you left off.
- Stay focused and stay productive.

---

## 2. Scope decision (LOCKED)

| Question | Decision | Rationale |
|---|---|---|
| Whose Next? | **Per-Account, global** (one Next per human user, spans all Orgs and Spaces). | Matches Toby's "your to-do" feel. Simplifies sync — no Org-switch reconciliation. |
| Modeled as? | **A Collection of `kind = next`**, singleton, system-owned. | Reuses Item model, sharing infra, history, search, RLS. Adds 1 enum value, no new top-level entity. |
| Done state lives where? | **On the join row** (`next_item.done`, `next_item.completed_at`). | Same Item appearing in Next + a regular Collection has independent done state. |
| Source? | Recorded as `next_item.source_kind` + optional `source_collection_id`. | Analytics + "go back to source" affordance. Survives source deletion. |

These decisions resolve the ambiguities the inspiration doc explicitly invited
us to manipulate. See `02-data-model/03-collection.md` Invariants 7–10 and
`02-data-model/12-next-item.md` (the new join entity).

---

## 3. Glossary additions

See `00-overview/02-glossary.md` "Next" section. Locked terms:

- **Next** — the singleton per-Account to-do queue.
- **Next Item** — one row in Next; wraps an Item ref + done state + source ref.
- **Add to Next** — the canonical action verb. UI must use this string verbatim.
- **Source Collection** — the Collection an item was added from (nullable).

---

## 4. Information architecture

```
Account (human user)
└── Next  (singleton, system-created on signup)
    └── NextItem[]  (ordered, fractional position)
        ├── item_id   → Item (lives in some Collection in some Space)
        └── done, completed_at, source_kind, source_collection_id
```

- **Singleton:** exactly one Next per Account. Created lazily on first add (or
  eagerly on signup — implementation choice). Cannot be deleted, renamed, or
  shared.
- **Cross-Org:** an Account in 3 Orgs has **one** Next that can hold items
  from any of those Orgs. The UI groups rows by Org when the Account is a
  member of >1 Org.
- **Read-through:** rendering a Next row dereferences `item_id`. If the source
  Item was hard-deleted, the Next row goes to a `tombstone` state (see §11).

---

## 5. Entry points (how a Tab gets into Next)

| # | Surface | Trigger | `source_kind` |
|---|---|---|---|
| E1 | Item card in any Collection | Hover → click bookmark icon in hover toolbar (`09-hover-to-jump.md`) | `collection` |
| E2 | Open Tabs panel (live browser tabs) | Hover → bookmark icon | `browser_tab` |
| E3 | Extension popup → **Save Tab** button | Saves current active browser tab into Next | `browser_tab` |
| E4 | Extension popup → manual paste | User pastes a URL into the input | `manual` |
| E5 | Keyboard shortcut `Cmd/Ctrl+Shift+N` | On the active browser tab | `browser_tab` |
| E6 | Browser context menu → "Add to Next" | Right-click on a page or link | `browser_tab` |
| E7 | Drag-and-drop | Drag an Item card onto the Next sidebar entry | `collection` |
| E8 | Bulk operations | Select N items in a Collection → "Add to Next" | `collection` |

**Tooltip on the bookmark icon:** `Add to Next` (200 ms hover delay; see
`06-ui-ux/03-tooltips.md` for the canonical tooltip recipe).

**Idempotency:** adding an Item that is already in Next and **not done** is a
no-op with an info toast `Already in Next`. Adding an Item that is in Next and
**done** un-archives the existing row (sets `done = false`, clears
`completed_at`, re-orders per `insert_position` setting) — does NOT create a
duplicate row.

---

## 6. Surfaces

### 6.1 Extension popup — "Next" tab

Default tab on first open; remembered after that per Account
(`account_setting.popup_default_tab`, default `next`). Layout, tab bar, item
row anatomy, empty state, all-done state, loading state, and error state are
specced in `04-extension/04-popup.md §14` (new section — see that file for the
authoritative ASCII wireframes and pixel sizes).

Key behaviours that live here, not in the popup spec:

- **Open in same tab** (`→`): `chrome.tabs.update(activeTabId, {url})`. Does
  not mark done.
- **Open in new tab** (`↗`): `chrome.tabs.create({url, active: false})`. Does
  not mark done. Briefly flashes the row background `bg-primary/10` for 300 ms.
- **Done checkbox:** toggles `next_item.done`. If
  `next_setting.hide_completed = true`, the row animates out (height → 0,
  opacity → 0, 220 ms ease-in) and stays hidden until unchecked from the
  "Show completed" filter.

### 6.2 Web app — left-rail entry

In the web app shell (`05-web-app/02-shell.md`), Next appears in the left rail
**between** "Spaces" and "Sessions":

```
[bookmark icon]  Next   [ 3 ]   ← count badge: open (not-done) items
```

- Selected state: pink left-rail indicator (3 px, full-row), tinted background
  `bg-primary/10`.
- Click opens a 720 px column rendering the same item list as the popup, with
  the section header above it.
- The "Tip" copy `Tip: You can view Next from the extension menu!` is shown as
  a dismissible info bar; dismissed forever per Account
  (`account_setting.next_tip_dismissed = true`).

### 6.3 Multi-Org grouping

When the Account belongs to >1 Organization AND Next contains items from >1
Org, render rows grouped under collapsible Org headers. Header shows the Org
avatar + name + open-count badge. Single-Org Accounts see a flat list (no
header).

---

## 7. Settings (per Account)

Stored on `account_setting` (see `02-data-model/11-account.md`). Surfaced
behind the gear icon in the Next view.

| Setting | Type | Default |
|---|---|---|
| `next_insert_position` | enum(`top`\|`bottom`) | `bottom` |
| `next_close_tab_after_adding` | bool | `false` |
| `next_hide_completed` | bool | `false` |
| `next_auto_archive_days` | int? (1, 7, 30, null) | `null` |
| `next_show_in_extension_popup` | bool | `true` |
| `next_prompt_done_on_close` | bool | `false` |
| `next_tip_dismissed` | bool | `false` |
| `popup_default_tab` | enum(`save_tab`\|`create_link`\|`next`\|`group_tabs`) | `next` |

---

## 8. Keyboard shortcuts

Listed in `06-ui-ux/08-keyboard-input.md §2.7` (canonical source).
Summary:

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl+Shift+N` | Add active browser tab to Next (E5). |
| `N` (web app, no input focused) | Focus the Next sidebar entry. |
| `↑` / `↓` (Next focused) | Move focus between rows. |
| `Enter` | Open in same tab (`→`). |
| `Cmd/Ctrl+Enter` | Open in new tab (`↗`). |
| `Space` | Toggle done. |
| `Backspace` / `Delete` | Remove from Next (with 5 s undo). |
| `Cmd/Ctrl+Z` | Undo last destructive action. |
| `Alt+↑` / `Alt+↓` | Reorder focused row. |

---

## 9. Constraints & limits

| Constraint | Value | Surfaced as |
|---|---|---|
| Soft cap | 500 items | Non-blocking warning toast: "Next is getting long — consider archiving completed items." |
| Hard cap | 2 000 items | Block add with toast: "Next is full. Archive completed items first." |
| Virtualization threshold | 100 items | UI MUST switch to a virtualized list above this. |
| Per-Account, no per-Org | — | Sharing Next is **out of scope v1**. |

---

## 10. Realtime

When the Account is signed in on >1 device, Next mutations sync via the
realtime channel `account:{account_id}:next` (channel naming follows W-4
curly-brace convention; see `08-sharing-collab/14-realtime-transport.md`).

Conflict policy: Last-Write-Wins on `next_item.updated_at` per row. The
`done` flag is the only mutable boolean; reorder is via `position` float; both
LWW.

---

## 11. Edge cases

| Case | Behaviour |
|---|---|
| Adding the same item twice (open) | No-op + info toast `Already in Next`. |
| Adding a done item | Un-archive the existing row. Do NOT duplicate. |
| Source Item soft-deleted | Next row dims, shows ⚠ "Source removed", actions disabled except Remove. |
| Source Item hard-purged | Next row converts to **tombstone** (uses last-known title + favicon snapshot stored on the join row), open actions still work via stored URL. |
| URL is `chrome://*` / `about:*` | Allow add; open actions show toast "This page can't be reopened by extensions." |
| Offline | Optimistic add still works; queued for sync. |
| Soft cap (500) | Warning toast on the add that crosses the line. |
| Hard cap (2 000) | Block add. |
| Org-switch in extension | Next is per-Account, NOT per-Org — view does NOT change. Multi-Org grouping (§6.3) handles cross-Org clarity. |
| Two devices add same URL within sync delta | Server keeps earliest `created_at`; second add becomes a no-op on reconciliation. |
| Last item checked | Confetti once per session if `prefers-reduced-motion: no-preference`; sticky banner "You're all caught up!" with `Clear completed` text-link. |

---

## 12. Out of scope (v1)

- Cross-Account shared Next (Next is per-Account).
- Recurring / scheduled items.
- Sub-tasks per Next item.
- AI auto-prioritization.
- Sharing a Next list as a public link.
- Per-Org Next (would require resolving Account-vs-Org ownership, deferred).

---

## 13. Cross-references

- Data model: `02-data-model/03-collection.md` (extended `kind` enum) +
  `02-data-model/12-next-item.md` (new file).
- Glossary: `00-overview/02-glossary.md` "Next" section.
- Popup wireframe: `04-extension/04-popup.md §14`.
- Hover toolbar (bookmark icon source): `07-features/09-hover-to-jump.md`.
- Keyboard shortcuts: `06-ui-ux/08-keyboard-input.md §2.7` "Next" sub-section.
- Realtime channel: `08-sharing-collab/14-realtime-transport.md` (channel
  `account:{account_id}:next`).
- Roadmap: `20-roadmap/02-phase-1-v1.md` (Next ships in v1, NOT MVP-Phase-0).
- Analytics: `18-analytics-telemetry/03-events.md` "Next" event family
  (`next.item.added`, `next.item.opened`, `next.item.done`, `next.item.removed`,
  `next.item.reordered`, `next.popup.opened`).

---

## 14. Acceptance checklist

An implementation is "done" when every box is checkable.

- [ ] Singleton Next exists per Account; cannot be created or deleted by user.
- [ ] `Add to Next` action wired on all 8 entry points (E1–E8).
- [ ] Bookmark icon in the hover toolbar uses `bg-primary` (no raw hex).
- [ ] Tooltip `Add to Next` appears after 200 ms hover.
- [ ] Idempotency: duplicate-open URL → no-op + info toast.
- [ ] Idempotency: duplicate-done URL → un-archives, no new row.
- [ ] Extension popup `Next` tab is default on first open; remembered after.
- [ ] Item row has favicon, title (1-line ellipsis), `→`, `↗`, external checkbox.
- [ ] `→` opens in current tab; `↗` opens in new background tab; neither marks done.
- [ ] Checkbox toggles done; checked state = pink fill + check + 50% opacity + line-through.
- [ ] Drag handle reorders via fractional `position`.
- [ ] Empty state shows icon + copy + `Save current tab` CTA (uses E3).
- [ ] All-done state shows confetti once per session (skipped under `prefers-reduced-motion`).
- [ ] All 9 keyboard shortcuts (§8) work.
- [ ] All icon buttons have `aria-label`s; checkbox is a real `<input type="checkbox">`.
- [ ] Settings sheet exposes 8 options (§7); defaults match.
- [ ] Items persist locally; sync envelope dispatched on each mutation.
- [ ] Soft cap (500) warning toast; hard cap (2 000) blocks add.
- [ ] List virtualized above 100 items.
- [ ] Web-app sidebar entry shows badge with count of `done = false` items.
- [ ] Tip info bar is dismissible per Account.
- [ ] Multi-Org Accounts see Org-grouped sections when items span Orgs.
- [ ] Source-deleted items go to tombstone with stored URL still openable.
- [ ] Realtime sync via `account:{account_id}:next` channel works across devices.
- [ ] Analytics events fire with no URL/title PII.
- [ ] No raw color hex in components — only semantic Tailwind tokens.
