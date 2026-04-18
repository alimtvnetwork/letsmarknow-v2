# Share Management (`/org/:id/shares`)

Single dashboard listing every active Share in the Org. Per-entity share controls live inline on each entity (e.g. Collection page → "Share" button), but power users want a global view.

---

## 1. Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Shares · 12 active · 3 expired · 8 revoked                  │
│  [ Filter: Active ▾ ] [ Type: Any ▾ ] [ 🔍 ]                │
│  ──────────────────────────────────────────────────────────  │
│  Slug         Target            Mode      Views  Created   ⋯│
│  ──────────────────────────────────────────────────────────  │
│  my-gear      Coll. Marketing   Public    142    by Alim    │
│  team-x       Group Quick Tools Password  38     by Sara    │
│  expires-1d   Item ChatGPT      Invite    7      by Alim    │
│  ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

## 2. Row anatomy

- Slug (clickable → opens public URL in new tab).
- Target (entity type icon + name, link to entity).
- Mode badge (Public · Password · Invite-only) with lock icon if password.
- Expires-at (relative; red if < 24 h).
- Stats: views / unique viewers / clicks (Pro+).
- Created by + when.
- ⋯ menu: Copy link, Edit, Rotate slug, Revoke, View analytics.

## 3. Filters

- Status: Active / Expired / Revoked
- Mode: Public / Password / Invite-only
- Type: Space / Collection / Group / Item
- Created by (multi-select Members)
- Date range
- Search (slug or target name)

## 4. Edit modal

Same form as the inline "Create share" sheet on entity pages:
- Mode (radio with explanatory subtitles)
- Slug (auto + edit; lock icon shows it's a Pro feature for custom)
- Title / description override (defaults to entity's)
- Expiry (datetime picker; "Never" toggle)
- Password (only when mode=password)
- Allowed emails (chips; only when mode=invite_only)
- Allow visitors to clone to their LMN account (toggle)
- Show LMN branding (toggle; Pro+ can hide)
- Analytics enabled (toggle; Pro+)
- Default view mode (grid/list/compact/column)

Saves via PATCH `/v1/shares/:id`. Password rotates if changed; warning banner explains old viewers will be locked out.

## 5. Bulk actions

- Multi-select rows.
- Bulk revoke; bulk extend expiry by N days; bulk rotate slugs.

## 6. Revocation

- Confirmation modal: "Anyone with this link will see a 'Share unavailable' page. You can restore within 7 days."
- After revoke, row stays with "Revoked" badge for 7 days then auto-archives.

## 7. Analytics drawer

Click "View analytics" on any row → side drawer:
- Counters (views, uniques, clicks) with sparkline.
- Top items table (item title + clicks).
- Top referrers (host + count).
- Date range selector (24 h / 7 d / 30 d / All).
- Export CSV (Team).

## 8. Permissions

- Editors+ can edit/revoke their own shares.
- Owners/Admins can edit/revoke any.
- Viewers see read-only list (no analytics, no edit).
- Anyone can copy link.

## 9. Inline create on entity pages

Reused component (also lives in extension). On Collection/Group/Item header, "Share" button opens the same modal pre-populated for that entity. Saving creates and redirects to the row in this dashboard (or stays inline depending on context).

## 10. Telemetry

- `share.created` `{ target_type, mode }`
- `share.revoked`
- `share.edited` `{ field }`
- `share.slug_rotated`
- `share.analytics_viewed`
- `share.bulk_revoke` `{ count }`

## 11. Empty / error states

- 0 shares ever: prominent "Share your first collection" with sample illustration.
- All revoked/expired: "Nothing active. [Show all]"
- API error per row: inline retry.
