# Wireframe — Public Share Viewer

> **Route:** `/s/:token`
> **Spec ref:** `05-web-app/14-share-viewer.md`, `08-sharing-collab/02-public-shares.md`

---

## 1. Default — public share, no password

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Logo]  Shared by Alice K.                                  [Sign in] [Save copy] │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │                                                                    │    │
│   │   [Cover image OR initials gradient]                               │    │
│   │                                                                    │    │
│   │   "My Reading List"                                                │    │
│   │   24 items · Updated 2 days ago · Public                           │    │
│   │                                                                    │    │
│   │   [Description / about this collection — optional]                 │    │
│   │                                                                    │    │
│   └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│   [View: ▾ Grid]  [Sort: ▾ Newest]                          [Search…]       │
│                                                                              │
│   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                              │
│   │ Item │ │ Item │ │ Item │ │ Item │ │ Item │   [ItemCard read-only]      │
│   └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                              │
│   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                              │
│   │ Item │ │ Item │ │ Item │ │ Item │ │ Item │                              │
│   └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                              │
│                                                                              │
│   ... pagination or infinite scroll                                          │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  Powered by {product_name}  ·  [Report]  ·  [Privacy]                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Component map
- **Header** — minimal: brand, sharer attribution, [Sign in] / [Save copy] CTAs
- **Hero** — cover image or gradient, collection name, metadata, optional description
- **Toolbar** — view mode (grid/list/compact), sort, search-within-share
- **Items** — read-only cards; click opens external URL in new tab
- **Footer** — branding, report-abuse link, privacy

### What viewers can do
- Open items (external link)
- Search/filter within share
- Switch view mode (preference saved per share via cookie)
- Save a copy to their workspace (requires sign-in)

### What viewers cannot do
- Edit items
- See other items in the workspace
- See the owner's personal info beyond display name

---

## 2. Password-protected state

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Logo]                                                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                          ┌──────────────┐                                    │
│                          │      🔒      │                                    │
│                          └──────────────┘                                    │
│                                                                              │
│                  {share.viewer.password.title}                               │
│                  {share.viewer.password.body}                                │
│                                                                              │
│                  ┌────────────────────────┐                                  │
│                  │ Enter password         │                                  │
│                  └────────────────────────┘                                  │
│                                                                              │
│                  [Unlock]                                                    │
│                                                                              │
│                  3 attempts remaining                                        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

After 5 failed attempts within 10 min → `SHARE_PASSWORD_LOCKED` (see `18-error-codes.md`).

---

## 3. Expired / revoked

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          ┌──────────────┐                                    │
│                          │     ⏱        │                                    │
│                          └──────────────┘                                    │
│                                                                              │
│                  {share.viewer.expired.title}                                │
│                  {share.viewer.expired.body}                                 │
│                                                                              │
│                  [Go to {product_name}]                                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

Same shape for revoked, with `{share.viewer.revoked.*}` keys.

---

## 4. Empty share

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ... hero unchanged ...                                                       │
│                                                                              │
│                          ┌──────────────┐                                    │
│                          │      📭      │                                    │
│                          └──────────────┘                                    │
│                  {share.viewer.empty}                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Mobile (< 768px)

- Header collapses; CTAs become a single `[•••]` menu
- Hero stacks: image full-width, then title, then meta
- Toolbar: view mode hidden by default; sort + search visible
- Items: 2-column grid → 1-column list on `< 480px`

---

## 6. SEO & meta

- `<title>`: `"{collection_name} — shared by {sharer_name}"`
- `<meta name="description">`: collection description (truncated 160 chars)
- OG tags: cover image, title, description, type=`website`
- `<link rel="canonical">`: `https://{domain}/s/{token}`
- `noindex` if password-protected or invite-only

---

## 7. Telemetry

- `share_viewer_loaded` (`{token, has_password, view_mode}`)
- `share_password_attempted` (`{token, success}`)
- `share_item_opened` (`{token, item_id}`)
- `share_save_copy_clicked` (`{token, signed_in}`)
- `share_blocked` (`{token, reason: "expired"|"revoked"|"locked"}`)
