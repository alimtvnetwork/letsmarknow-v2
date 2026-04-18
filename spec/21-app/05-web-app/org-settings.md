# Org Settings (`/org/:id/settings`)

Per-Organization configuration. Owner or Admin can edit; Owner-only for danger zone.

---

## 1. Sections

### 1.1 Profile
- Org name (1–120 chars)
- Slug (auto from name; editable; uniqueness check)
- Avatar token (2–3 chars; e.g. "PE")
- Avatar color (HSL picker with palette presets)
- Avatar image (upload; overrides token+color)
- Description (4 KB)
- Theme accent color (Pro+) — colors shared views with this brand color
- Default Space (dropdown of Spaces; new members land here)

### 1.2 Defaults & policy
- Default view mode for new Collections: grid / list / compact / column
- Default share visibility: public / password / invite-only
- Allow public sharing? (Owner can disable org-wide; affects all members' new-share creation)
- Allow exports? (Pro+; default ON)
- Auto-tag by domain (Pro+): on save, auto-add tag = domain root
- Force MFA for all members (Team+): if ON, members without MFA cannot sign in until they enable it

### 1.3 Custom domain (Team)
- CNAME setup wizard (`bookmarks.example.com` → `app.letsmarknow.com`)
- SSL status (Let's Encrypt; auto-renew)
- Public share domain (`bookmarks.example.com/t/{slug}`) — toggle ON to use custom domain

### 1.4 Branding for shared views (Pro+)
- "Show LMN branding" toggle (Pro+ can hide; Team has it hidden by default)
- Custom logo upload (Team)
- Custom CSS overrides (Team) — limited safe-list (colors, fonts only)

### 1.5 Webhooks (Team)
- Outbound webhooks: URL + secret + events (item.created, share.viewed, member.added, etc.)
- Test endpoint button.
- Delivery log (last 50; replay).

### 1.6 API tokens (Team)
- Create personal access tokens with scoped permissions (read, write, admin) and expiry.
- Mask after creation (only shown once).

### 1.7 Audit log
- Read-only feed of admin-impacting events (member added/removed, role changed, billing changed, settings changed, share revoked).
- Filterable by actor, event type, date range.
- Export CSV.

### 1.8 Danger zone (Owner only)
- Transfer ownership → choose another Owner-eligible Member, re-auth, confirm.
- Soft-delete organization → 30-day grace; type "delete <name>" to confirm.
- Restore (within grace) — appears only if `deleted_at` set.
- Purge now → hard delete; type "delete <name> forever".

## 2. Layout

Left sub-nav (Profile · Defaults · Custom Domain · Branding · Webhooks · API Tokens · Audit · Danger). Main pane scrolls within.

## 3. Save UX

- Inline auto-save on blur for simple fields.
- Bulk save bar for grouped settings (Defaults & policy).
- Real-time validation (slug uniqueness, custom domain DNS check, color contrast warning if accent color fails AA on white).

## 4. Permissions matrix (within this page)

| Section | Owner | Admin | Editor | Viewer | Billing |
|---|---|---|---|---|---|
| Profile | edit | edit | read | read | read |
| Defaults | edit | edit | read | read | read |
| Custom domain | edit | read | — | — | — |
| Branding | edit | edit | read | — | — |
| Webhooks | edit | edit | — | — | — |
| API tokens | edit (own + others) | edit (own only) | — | — | — |
| Audit | view all | view all | view own actions | — | view billing actions |
| Danger | edit | — | — | — | — |

## 5. Concurrency

- All sections accept `If-Match`; conflict shows "Edited by <name> · [Reload] [Force save]".

## 6. Telemetry

- `org.settings.changed` with `{ section, field }` (no values logged).
- `org.danger.delete_initiated` / `_canceled` / `_completed`.
