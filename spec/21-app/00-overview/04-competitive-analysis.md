# Competitive Analysis

A side-by-side breakdown of **Toby** vs **Tab Extend** vs **Lets Mark Now**, plus the explicit list of competitor flaws we are fixing.

---

## Side-by-side feature matrix

| Capability | Toby | Tab Extend | **Lets Mark Now** |
|---|---|---|---|
| Hierarchy depth | 3 (Workspace→Space→Collection) | 3 (Workspace→Category→Group) | **5** (Account→Organization→Space→Collection→Group→Item) |
| Group-inside-group | ❌ | ✅ (1 level) | ✅ (1 level, sharable) |
| Free tier item cap | 60 saved tabs | 8 categories | TBD — see `10-licensing-billing/01-plans-matrix.md` |
| Paid tier caps | Removed | Some remain | **None** |
| Public share link | ✅ ugly URLs | ❌ | ✅ `letsmarknow.com/t/{slug}` |
| Custom slug | ❌ | ❌ | ✅ Pro+ |
| Password-protected share | ❌ | ❌ | ✅ |
| Expiring share | ❌ | ❌ | ✅ |
| Invite-only share with roles | partial | ❌ | ✅ |
| Share at every level | Space, Collection | Workspace only | **Space, Collection, Group, Item** |
| Real-time collaboration | partial | ❌ | ✅ (presence + live updates) |
| SSO | ❌ | ❌ | ✅ Team plan |
| Roles (Owner/Admin/Editor/Viewer) | partial | ❌ | ✅ |
| Audit log | ❌ | ❌ | ✅ Team plan |
| Undo / Redo | partial | ❌ | ✅ Always, 30-day window |
| History event log | ❌ | ❌ | ✅ |
| Save Session to Collection | ✅ | ✅ | ✅ + close-on-save toggle + per-window or all-windows |
| Jump-to-tab (focus existing) | ✅ | ❌ broken | ✅ Cross-window |
| Open Tabs sidebar grouped by Window | ✅ | ❌ | ✅ |
| Drag tab from sidebar to Collection | ✅ | ✅ | ✅ + closes original tab |
| Ctrl+K command palette | ❌ | ❌ | ✅ |
| Full keyboard control | partial | partial | ✅ |
| Workspace switch shortcut | ❌ | ❌ | ✅ Ctrl+↑ / Ctrl+↓ |
| Search speed | mediocre | broken / very slow | ✅ < 100 ms p95 |
| Search jump-to-result | ❌ | ❌ | ✅ |
| List view | ✅ | ❌ | ✅ |
| Grid view | ✅ | ❌ | ✅ |
| Compact (favicon) view | ✅ | ✅ | ✅ |
| Mind-map view | ❌ | ❌ | ✅ |
| Tab Extend column view | ❌ | ✅ native | ✅ as a mode |
| Resizable / split sections | ❌ | ❌ | ✅ |
| Inline tag editor on item | ❌ | ❌ | ✅ |
| Color coding | ✅ | partial | ✅ |
| Notes on Collection/Group/Item | ✅ Collection only | ❌ | ✅ All three levels |
| Description field | partial | ❌ | ✅ |
| Star / favorite | ✅ | ❌ | ✅ |
| Bulk select | ❌ | ❌ | ✅ |
| Duplicate (Collection / Group / Item) | partial | ✅ Group only | ✅ Everywhere |
| Export | partial | text only | ✅ JSON / HTML / CSV |
| Import (Toby / Tab Extend / Chrome) | ❌ | ❌ | ✅ All three + JSON |
| Hover "+" add button | ❌ | ❌ | ✅ Colorful, contextual |
| Open all in group | partial | ✅ | ✅ + open in new window option |
| Share analytics (views / clicks) | ❌ | ❌ | ✅ Pro+ |
| Calendar / reminders | ❌ | ✅ broken | ❌ deferred |
| License manager | ✅ basic | ✅ basic | ✅ proper, with device limits |
| App updater (release channels) | implicit | implicit | ✅ stable / beta |
| In-app updates feed | ❌ | ❌ | ✅ |
| Support system (tickets) | email only | email only | ✅ proper portal |
| Lifetime plan | ❌ | ❌ | ✅ |
| Team plan | ✅ | ❌ | ✅ |
| Discounts / coupons | ❌ | ❌ | ✅ |
| GDPR data export / delete | partial | ❌ | ✅ |
| Dark theme | ✅ | ✅ | ✅ default |
| Light theme | ✅ | ✅ | ✅ |
| Custom accent themes | ✅ | partial | ✅ Pink default à la Toby |
| Typography quality | average | excellent (Apple+Ubuntu) | ✅ matches Tab Extend stack |
| Mobile responsive viewer | partial | ❌ | ✅ for `/t/{slug}` |
| Native mobile app | ❌ | ❌ | ❌ deferred |
| Firefox support | ✅ | ❌ | ⏭ later phase |
| AI features | ❌ | ❌ | ⏭ v2 (see roadmap) |

---

## Explicit "must-fix" list (Toby & Tab Extend flaws)

These are the flaws the user identified verbatim during requirements gathering. Each is owned by a specific spec folder.

| # | Competitor flaw | Owner folder |
|---|---|---|
| 1 | Tab Extend cannot share groups as links | `08-sharing-collab/` |
| 2 | Tab Extend search is "absolutely terrible" and slow | `14-search/` |
| 3 | Tab Extend has no undo / redo | `12-history-undo/` |
| 4 | Tab Extend caps at 8 categories, ~12 groups each | `10-licensing-billing/01-plans-matrix.md` |
| 5 | Toby's free tier caps at 60 saved tabs | `10-licensing-billing/01-plans-matrix.md` |
| 6 | Tab Extend cannot export properly (text only) | `11-import-export/` |
| 7 | Tab Extend's calendar / reminders are broken | dropped from v1 |
| 8 | Tab Extend's workspace search shows everything always | `15-visualization/` + `14-search/` |
| 9 | Tab Extend has no jump-to-result from search | `14-search/05-jump-to-result.md` |
| 10 | Toby has no hover-add "+" button on Collections | `07-features/add-item-hover-button.md` |
| 11 | Toby's share URLs are not customizable | `08-sharing-collab/01-share-model.md` |
| 12 | Toby has no password / expiry on shares | `08-sharing-collab/` |
| 13 | Neither tool has a real Ctrl+K palette | `11-shortcuts/command-palette.md` |
| 14 | Neither tool has mind-map / bubble visualization | `15-visualization/04-mindmap-view.md` |
| 15 | Neither tool has resizable / split panels | `15-visualization/06-resizable-sections.md` |
| 16 | Neither tool has a real audit log | `17-admin-org/04-audit-log.md` |
| 17 | Neither tool has a proper support portal | `10-licensing-billing/13-cancellations-and-refunds.md` |
| 18 | Neither tool offers a Lifetime plan | `10-licensing-billing/01-plans-matrix.md` |
| 19 | Neither tool ships SSO for individuals/teams cheaply | `09-auth-accounts/05-sso-saml.md` |
| 20 | Neither tool has a release channel / updater UX | `16-notifications-updates/` |

---

## What we deliberately do NOT copy

- ❌ Toby's "Drag & Drop" / "Tag Filter" / "View" toolbar visual style — we will design our own minimal toolbar.
- ❌ Tab Extend's hard category cap — antithesis of our "no limits" principle.
- ❌ Tab Extend's broken calendar feature — out of scope.
- ❌ Both tools' opaque pricing pages — ours is honest and comparison-friendly.

---

## Strategic positioning

> **"Toby's depth + Tab Extend's beauty + everything they both forgot — at honest prices."**

Marketing site (`05-web-app/13-marketing-site.md`) leads with this exact positioning. Comparison page (`/vs/toby`, `/vs/tabextend`) reproduces a public version of this matrix.
