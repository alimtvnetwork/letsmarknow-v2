# Share Viewer (`letsmarknow.com/t/{slug}`)

Public (or password / invite-only) read-only experience. SSR for OG cards; client-side hydration for interactivity. The flagship surface for Persona 3 (Public Sharer's audience).

---

## 1. URL shapes

| URL | Resolves to |
|---|---|
| `/t/{slug}` | The Share's target (Space / Collection / Group / Item) |
| `/t/{slug}/i/{item_id}` | An Item-focused view inside the share scope |
| `/t/{slug}/g/{group_id}` | A Group focused view |
| `/t/{slug}?view=list` | Override view mode |
| `bookmarks.example.com/t/{slug}` | Same content via custom domain (Team) |

## 2. SSR pipeline

1. Edge fetches `GET /v1/public/shares/:slug` (no body parse for revoked).
2. If `requires_password` or `requires_invite_auth`, render the gate page with OG meta but no contents.
3. If open and `analytics_enabled`, fetch share contents (`/v1/public/shares/:slug/contents`).
4. Render full HTML with OG/Twitter/Schema.org meta. Title from `meta.title || target.name`.
5. Send.

Revoked / expired / not found → 410 page (custom illustration + "create your own collection" CTA).

## 3. Anatomy

```
┌────────────────────────────────────────────────────────────┐
│  ◐  Marketing Improvements                                   │
│      shared by Atto Property                                  │
│  ──────────────────────────────────────────────────────────  │
│  📈  Marketing Improvements                                   │
│  Curated marketing reads.                                     │
│  ─────────────────                                            │
│  [ Grid ] [ List ] [ Compact ] [ Column ]   13 items · 3 tags│
│                                                                │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐                          │
│  │card │  │card │  │card │  │card │                          │
│  └─────┘  └─────┘  └─────┘  └─────┘                          │
│                                                                │
│  Group: Quick Tools  🐤                                       │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐                                          │
│                                                                │
│  ─────────────────────────────────────────                   │
│  [ Save to my account ↗ ]   [ Powered by Lets Mark Now ]    │
└────────────────────────────────────────────────────────────┘
```

## 4. Header behavior

- Owner branding section: org name + avatar+color or uploaded image.
- "Powered by Lets Mark Now" badge: visible by default. Hidden when `show_branding=false` (Pro+).
- Custom logo (Team) replaces owner section entirely.
- View mode toggle remembered per visitor in `localStorage` (no auth needed).

## 5. Item card

- Click anywhere on card → opens URL in new tab + fires `POST /v1/public/shares/:slug/items/:item_id/clicks`.
- Long-press / right-click → "Copy link" (raw item URL).
- "Save to my LMN" icon (Pro feature for sharer; Free viewers can use it if `allow_clone_to_my_account=true`).

## 6. Save-to-my-account flow

- Click → if signed in to LMN, opens modal "Save 13 items to your collection" (destination picker — same as extension popup picker). Submits via `POST /v1/items` per item with `source_share_id` for attribution.
- If not signed in, redirects to `/signup?next=/t/{slug}?clone=1`. After signup, returns and runs the save.
- Sharer's owner sees these in analytics as "clones".

## 7. Auth gates

### 7.1 Password
- Centered card: lock icon + "This collection is password-protected" + password input + "Unlock".
- Submits to `/v1/public/shares/:slug/unlock`. Sets `lmn_share_<slug>` cookie. Reload triggers content render.
- 5 wrong attempts → 60 s lockout per IP+slug.

### 7.2 Invite-only
- Card: "This collection is shared with specific people. Sign in with your invited email."
- "Sign in" button → `/login?next=/t/{slug}`.
- After sign-in, viewer's email is checked against `allowed_emails`; mismatch → "Your email isn't on the list. [Request access]" (sends email to sharer).

## 8. Analytics

- View tracked once per `client_id` per 30 min (POST `/views`).
- Click tracked per item per `client_id` per 5 min.
- `client_id` is a random UUID stored in `localStorage` under `lmn_anon_id`. Cleared if user clears site data.
- DNT browser setting → no tracking calls; viewer count for that visit not counted.

## 9. SEO

- Public mode: `index, follow` per share owner setting (default `noindex` to respect privacy; opt-in to indexing in share settings).
- Password / invite-only: `noindex, nofollow` always.
- OG: `og:title` = share title, `og:description` = description, `og:image` auto-generated thumbnail (server-side rendered card with title + first 4 favicons + brand color).
- Twitter card: `summary_large_image`.
- JSON-LD: `CollectionPage` for Collection shares; `Article` for Item shares.

## 10. Performance

- LCP < 1.5 s on 4G.
- All assets from `cdn.letsmarknow.com`.
- Static cards rendered server-side; only interactivity (view-mode toggle, save-to-my-account) is client-side.
- Favicons inlined as `data:` URIs when ≤ 2 KB.

## 11. A11y

- Semantic landmarks (header / main / footer).
- Skip-link.
- `aria-live` for password unlock errors.
- Cards reachable via Tab; Enter opens (with `target="_blank"` and `rel="noopener noreferrer"`).
- Color contrast AA against custom brand backgrounds (warning to sharer if their brand color fails contrast).

## 12. Item-only share

Same chrome but content is one card with full description + notes (rendered as Markdown-lite read-only). No view-mode toggle.

## 13. Custom domain UX

When served via `bookmarks.example.com`:
- All branding swaps to org's.
- "Powered by Lets Mark Now" forced ON unless Team plan with hide-branding.
- HTTPS via Let's Encrypt; no mixed content; HSTS header.

## 14. Edge cases

| Case | Behavior |
|---|---|
| Share revoked while user viewing | WebSocket-less; on next interaction (click/refresh), 410 page. |
| Share expired during session | Same. |
| Owner deleted Item shown in viewer | Item card hidden on next page load. |
| Owner moved Item out of share scope | Same. |
| Many viewers concurrently | Server caches `/contents` for 60 s when `analytics_enabled=false`; live for analytics-on shares. |
| Share viewed via in-app browser (Instagram, etc.) | Layout works; "Add to Chrome" CTA hidden when not desktop Chrome. |
