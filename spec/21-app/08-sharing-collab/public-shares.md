# Public Shares

Anonymous-readable share links. The most common share mode.

---

## 1. URL

`https://letsmarknow.com/t/{slug}` — slug is 8–32 chars, `[a-z0-9-]`, optionally user-customized.

## 2. Viewer page

- SSR for first paint (good SEO when allowed).
- Layout:
  - Top bar: Org logo + Collection name (no nav into rest of app).
  - Optional banner: "Shared by <Owner display name>" with avatar.
  - Body: items in owner's chosen view mode.
  - Footer: "Made with Lets Mark Now · Get yours →" (removable on Team plan).

## 3. Capabilities

| Action | Allowed? |
|---|---|
| Read items | ✅ |
| Open items in new tab | ✅ |
| Search within share | ✅ (client-side) |
| Filter by tag | ✅ |
| Switch view mode | ✅ (session only) |
| Comment | ❌ public; ✅ if owner enabled + viewer signs in |
| React (emoji) | ❌ public; ✅ if owner enabled + viewer signs in |
| Save items to own LMN | ✅ if signed in |
| Edit anything | ❌ |

## 4. Caching

- HTML: edge-cached 60 s (`s-maxage=60, stale-while-revalidate=300`).
- JSON API responses: edge-cached 30 s.
- Cache busted on any change to scope or revoke.

## 5. SEO

- `noindex, nofollow` by default.
- Owner can opt-in to `index, follow` per share (Pro+).
- When indexable:
  - JSON-LD `CollectionPage`.
  - Canonical URL = the share URL.
  - OG image: owner's custom OR auto-generated server-side from share contents.
  - Title: `{Collection name} · Shared on Lets Mark Now`.

## 6. Performance budgets

- TTFB p75 < 200 ms (edge cache hit).
- LCP p75 < 1.5 s.
- JS bundle for viewer < 90 KB gzip.
- Items list virtualized at > 100 items.

## 7. Anti-abuse

- Rate limit per IP: 60 req/min per share.
- DMCA reporting form linked in footer.
- Trust & Safety: malicious content (CSAM/illegal) reports trigger automated kill switch on slug; owner notified.
- All public shares scanned by safety classifier on creation; flagged → manual review queue.

## 8. Branding (Pro+/Team)

| Setting | Pro | Team |
|---|---|---|
| Custom OG image | ✅ | ✅ |
| Hide footer attribution | ❌ | ✅ |
| Custom favicon for share | ❌ | ✅ |
| Custom theme accent color | ✅ | ✅ |
| Custom domain | ❌ | ✅ |

## 9. Embedding

- iframe embed available at `/e/{slug}`; see `embed-widget.md`.
- Auto-resize via `postMessage` to host page.

## 10. Telemetry

- `public_share.viewed` `{ slug, country, referrer_host }`
- `public_share.item_opened` `{ rank }`
- `public_share.search_used`
- `public_share.tag_filter_used`
- `public_share.attempted_action_blocked` `{ action }`

## 11. A11y

- Skip-link to items list.
- Single H1 = Collection name.
- All cards keyboard-reachable; sane focus order.
- High-contrast theme inherits from owner's pick or viewer's `prefers-color-scheme` if set to "auto".

## 12. Edge cases

| Case | Behavior |
|---|---|
| Share revoked mid-session | Next request returns 410; viewer sees "This share has been revoked" |
| Empty Collection share | Friendly empty state "Nothing here yet" + owner avatar |
| Items individually marked private (system tag) | Hidden from share automatically |
| Browser blocks third-party cookies | Works (no auth required) |
| Viewer signs in mid-session | Page hot-swaps to authed mode (comments/reactions enable if allowed) |
