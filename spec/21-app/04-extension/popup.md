# Toolbar Popup

The 380×540 popup that appears when the user clicks the extension icon or hits `Alt+S`.

---

## 1. Anatomy (top → bottom)

```
┌──────────────────────────────────────────┐
│ [LMN logo] Personal ▾        ⚙  👤      │  ← header (40px)
├──────────────────────────────────────────┤
│ 🔍  Quick find…                          │  ← search (44px)
├──────────────────────────────────────────┤
│ Saving:                                   │
│ ┌──────────────────────────────────────┐ │
│ │ favicon  Tab title (editable)        │ │
│ │          example.com/page            │ │  ← current-tab card
│ │  [📎 Tags]  [📝 Notes]               │ │
│ └──────────────────────────────────────┘ │
│ Save to:  [Quick Tools  ▾]  [Save] ━━   │  ← destination + CTA
├──────────────────────────────────────────┤
│ Recent (3):                               │
│  • favicon   Title          · just now   │
│  • favicon   Title          · 2m         │
│  • favicon   Title          · 12m        │
├──────────────────────────────────────────┤
│ Save all 14 tabs as session  ↗           │  ← session CTA
└──────────────────────────────────────────┘
│ [Open dashboard]   [Side panel]  v1.4.0   │  ← footer (32px)
└──────────────────────────────────────────┘
```

---

## 2. State machine

```
idle ─┬─► saving ──► saved ──(2s)──► idle
      └─► duplicate-detected ──► [Replace] [Add anyway] [Cancel]
saved ──(undo clicked)──► undoing ──► idle
any ──► error ──► [Retry] [Dismiss] ──► idle
offline ──► queued ──► (synced when online) ──► saved
```

## 3. On-mount checklist

1. `chrome.tabs.query({ active: true, currentWindow: true })` → `tab`.
2. Read `last_used_collection_id` from storage.
3. Send `GET_AUTH_STATE` to SW.
   - If unauth → render sign-in CTA filling popup; everything else hidden.
4. Send `GET_TREE` (cache-first) for current Org → populate destination dropdown.
5. Pre-check duplicates: `GET /v1/items?domain=<host>&q=<title>&limit=3` (debounced 200ms after open).
6. Focus ring on title field (allows immediate edit).

## 4. Destination dropdown

- Defaults to **last-used Collection** (or last-used Group if user previously saved into one).
- Sections (in order):
  1. **Last used** (1 row)
  2. **Starred** (collections + groups, max 5)
  3. **Recent** (max 5)
  4. **All collections** (searchable filter input appears at top when more than 8 entries)
  5. **+ New collection…** (opens inline create sheet)
  6. **+ New group in <last collection>…** (when applicable)
- Keyboard: `↑/↓` navigate, `Enter` select, `Cmd/Ctrl+Enter` save without picker close.

## 5. Tags & Notes pickers (inline)

- Tag chip → opens dropdown with tag autocomplete (calls `/v1/tags/suggest`).
- Notes → expands a 3-row textarea (Markdown-lite preview off in popup; full preview in web app).

## 6. Save button states

| State | Label | Disabled? |
|---|---|---|
| ready | "Save"  | no |
| saving | spinner + "Saving…" | yes |
| saved | "Saved ✓" + auto-close countdown bar | yes |
| duplicate | "Add anyway" / split button "Replace" | no |
| offline | "Save (offline)" | no |
| over-limit | "Upgrade to save more" → opens `/billing` | no but click → upsell |

`Cmd/Ctrl+Enter` from anywhere in popup triggers save.

## 7. After-save behavior

- Toast inside popup: "Saved to **Quick Tools**. [Undo]"
- Popup closes after 1.5s unless user moves cursor (cancel auto-close on hover).
- If `chrome.notifications` allowed AND popup closed by save: show OS notification with same Undo button.

## 8. Save Session strip

- Always-visible bottom strip: "Save all N tabs as session ↗".
- Click → opens **Save Session** mini-flow (in popup, full-height takeover):
  - Choose destination (new Collection / existing Collection as Group / etc.)
  - Show preview from `POST /v1/sessions/save/preview`
  - Toggles: Close tabs after, Exclude pinned, Exclude internal URLs, Dedupe.
  - Big "Save" button.
- Spec: `save-session.md`.

## 9. Quick-find (in-popup)

- Type in the top search field → after 80ms idle, calls `QUICK_FIND` → SW → `/v1/search/quick`.
- Shows up to 8 results below the search field (replaces "current-tab card" panel).
- Result row: favicon, title, "in <Collection name>", action icons (open new tab, jump-to-tab if open).
- `Esc` clears; `↑/↓/Enter` standard.

## 10. Header

- Org switcher (chevron): lists all Orgs the Account belongs to; selecting one calls `/v1/auth/token` with `active_organization_id`. Persistent badge shows current Org's avatar+color.
- ⚙ → opens Options in new tab.
- 👤 → quick menu: Account name/email, "Sign out", "Switch account".

## 11. Empty / error states

| Scenario | UI |
|---|---|
| No Collections in Org | "Create your first collection" CTA → inline create. |
| Tab URL is `chrome://*` | Disable Save button; tooltip "Chrome internal pages can't be saved." |
| Network down | Top banner "Offline — save queued." Save still works (queues). |
| Token lost mid-session | Banner + sign-in CTA replaces save area; recent stays visible (cached). |
| Free plan over item cap | Save card shows lock icon + "Upgrade to Pro to save more." |

## 12. Accessibility

- All interactive elements `tabindex` ordered: search → tab card → tags → notes → destination → Save → recent list → footer.
- ARIA live region announces save status.
- High-contrast mode honored via CSS `prefers-contrast`.
- Min hit target 32×32.

## 13. Performance

- Bundle size: < 80 KB gzipped for popup chunk (excluding shared vendor).
- TTFCP < 100 ms (popup is local file, no network blocking initial paint).
- All network calls fired in parallel; popup renders progressively.
