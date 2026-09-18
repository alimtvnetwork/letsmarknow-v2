# App Shell

The persistent layout that wraps all authenticated pages.

---

## 1. Anatomy

```
┌──────────────────────────────────────────────────────────────────┐
│ ◐ LMN     Personal ▾                       🔍   ⚙   👤          │ ← top bar (48px)
├────┬────────────────────────────────────────────────────────────┤
│    │ Spaces                              + New Space            │
│ PE │ ▸ My Collections                                            │
│ ── │ ▸ Evatix                                                   │
│ AP │   • Scrum                                                  │
│ +  │   • React                                                  │
│    │   • Tools                                                  │
│    │ ─────────────────                                          │
│    │ Starred                                                    │
│    │   ★ Quick Tools                                            │
│    │   ★ Marketing Improvements                                 │
│    │ ─────────────────                                          │
│    │ Tags                                                       │
│    │   #react #ui #ai                                           │
│    │                                                            │
│    │ ─────────────────                                          │
│    │ Trash · Activity · Members · Settings                      │
└────┴────────────────────────────────────────────────────────────┘
```

- **Left rail (64px):** Org switcher avatars + `+` to create. Hovering shows Org name tooltip. Drag to reorder. Active Org has white ring.
- **Sidebar (280px, collapsible to 64px):** tree of Spaces & Collections, Starred, Tags, footer links.
- **Top bar (48px):** Logo (→ `/dashboard`), Org dropdown (name + badge + switch), Search (`Cmd/Ctrl+K`), Settings ⚙, Account 👤.
- **Main area:** route outlet. On mobile, sidebar collapses behind hamburger.

## 2. Org switcher (top-bar)

- Click → dropdown listing all Orgs (by `last_active_at`).
- Each row: avatar, name, plan badge, my role.
- Footer: "+ Create new organization".
- Switching: triggers `/v1/auth/token` with `active_organization_id`; whole app re-mounts (TanStack Query cache cleared per scope).

## 3. Account dropdown (👤)

- Avatar + name + email
- "Settings" → `/me`
- "Help" → docs
- "What's new" → changelog (badge if unread)
- "Theme" submenu (system/light/dark)
- Divider
- "Sign out" / "Sign out everywhere"

## 4. Command palette

- Triggered by `Cmd/Ctrl+K` from anywhere.
- Same component as extension new-tab palette.
- Tabs: Find / Go / Do / Help.
- "Go" navigates routes (Spaces, Collections, Settings).
- "Do" runs actions (new collection, new space, save current tab via extension if installed, etc.).

## 5. Sidebar interactions

- Click Space chevron → expand/collapse (persisted per Account in `account_space_state`).
- Click Collection name → navigate.
- Right-click → context menu: Rename, Move, Duplicate, Share, Delete, Star.
- Drag → reorder (sibling) or move (drop on Space header).
- Multi-select via `Shift+click` for bulk move/delete.

## 6. Notifications popover

- Bell icon next to ⚙ when there are unread notifications (invitations, share comments, system messages).
- Popover shows last 20; "Mark all read"; link to `/me/notifications`.

## 7. Global banners

Stacked at top of `<main>` area, below top bar:

| Type | Trigger | Persistence |
|---|---|---|
| `subscription.past_due` | billing webhook event | until resolved |
| `subscription.trial_ending` | < 3 days | dismissable until 24 h before |
| `entitlement.changed` | hash changed | toast (auto-dismiss 5 s) |
| `extension.recommend_install` | not detected after 24 h of web use | dismissable forever |
| `version.update_required` | server flag | non-dismissable; shows reload button |
| `org.member_invited_you` | new pending invite for this account | clickable → `/invite/:token` |

## 8. Theme

- Tokens loaded from `index.css`; `<html data-theme="dark|light">`.
- System default: `prefers-color-scheme`.
- User override stored in `prefs.theme`.
- Org owner can set Org-wide brand color (Pro+) which tints accents in shared views.

## 9. Responsive

- ≥ 1280 px: full layout
- 1024–1279: sidebar 240 px
- 768–1023: sidebar overlays (hamburger to open)
- < 768: mobile shell (bottom-tab navigation: Dashboard / Search / Saves / Account)

Mobile is read + light-edit only; complex flows (billing, member admin, import) display "Open on desktop for the best experience" gentle hint but still work.

## 10. A11y

- Focus order: top-bar → sidebar → main → footer.
- All icon-only buttons have `aria-label`.
- Skip-link: "Skip to main content" appears on focus at top.
- Keyboard nav for sidebar tree follows W3C tree pattern.
