# Embeds & Previews

Pro+ rich previews on Item cards.

---

## 1. Concept

For known URL patterns, replace the favicon-only card with a richer media preview that helps the user identify the resource at a glance.

## 2. Supported sources (v1)

| Pattern | Preview |
|---|---|
| `youtube.com/watch?v=` / `youtu.be/` | 16:9 thumbnail + duration + title |
| `vimeo.com/` | thumbnail + duration |
| `twitter.com/*/status/` / `x.com/*/status/` | first tweet text + author + media count |
| `github.com/<org>/<repo>` (root) | name + description + ★ count + language |
| `medium.com/`, `substack.com/` | hero image + author + reading time |
| Image URLs (`.jpg/.png/.gif/.webp/.avif`) | thumbnail |
| PDF (`.pdf` or content-type) | first page render (server) |
| `figma.com/file/`, `figma.com/proto/` | thumbnail (Figma OG) |
| `notion.so/`, `notion.site/` | OG image + title |
| `linkedin.com/posts/` | OG image + author |
| `dribbble.com/shots/` | shot image |
| `behance.net/gallery/` | first image |
| `producthunt.com/posts/` | thumbnail + tagline |

Other URLs fall back to OG image if found, else favicon-only card.

## 3. Pipeline

1. Item created → background job picks up.
2. Job fetches URL with respectful UA, 5 s timeout, max 1 MB.
3. Extracts via plugin per source (YouTube oEmbed, Twitter syndicate, GitHub API, OG meta, etc.).
4. Stores resulting `preview` JSON on Item:
   ```json
   {
     "kind": "youtube",
     "image_url": "...",
     "duration_s": 384,
     "metadata": { "channel": "...", "views": 12345 }
   }
   ```
5. Image cached on `cdn.letsmarknow.com/preview/<sha>` with 30-day TTL.
6. WebSocket broadcast to refresh card.

## 4. Render rules

- Preview takes thumbnail slot in `grid` mode.
- In `list` mode, preview as small 80×60 thumbnail at left.
- In `compact` mode, ignored (favicon only).
- Loading state: shimmer over thumbnail until preview ready.
- Failed preview: silent fallback to favicon-only.

## 5. Performance

- Preview job pool isolated; no blocking effect on save flow.
- Image lazy-loaded; AVIF + WebP variants generated.
- Card render p75 < 50 ms even with previews.

## 6. Privacy / safety

- Server-side fetch from a dedicated egress IP (no user IP leakage).
- Don't follow `redirect_uri`-style chains; max 3 redirects.
- Don't fetch local/private IPs (SSRF guard list).
- Skip `noindex` pages? — fetch metadata anyway (preview is public-data only).
- User can opt out per-item ("Don't fetch preview").

## 7. Entitlements

| Feature | Free | Pro | Team |
|---|---|---|---|
| Favicon-only card | ✅ | ✅ | ✅ |
| OG image fallback | ✅ | ✅ | ✅ |
| Rich previews (YouTube, Twitter, etc.) | ❌ | ✅ | ✅ |
| PDF first-page render | ❌ | ✅ | ✅ |
| Custom preview rules (Team) | ❌ | ❌ | ✅ |

## 8. Refresh

- Manual refresh from card menu → "Refresh preview".
- Auto-refresh weekly for Pro+ on visible items only.
- Stale preview shown with subtle "stale" badge if > 30 d old and last fetch failed.

## 9. Telemetry

- `preview.requested` `{ kind }`
- `preview.completed` `{ kind, duration_ms }`
- `preview.failed` `{ kind, reason }`
- `preview.refreshed` `{ kind, manual: bool }`
- `preview.disabled_for_item`

## 10. Edge cases

| Case | Behavior |
|---|---|
| Auth-walled URLs | Preview shows host's OG; small lock badge |
| YouTube Shorts | Detected; vertical thumbnail kept aspect-correct |
| Tweet deleted later | Preview retained until refresh; refresh marks "deleted" with strikethrough |
| Image URL very large | Downsampled to 1280 max dimension |
| URL on private/local IP | Skipped (SSRF guard); no preview ever |

## 11. Tests

- Unit: source matchers (each pattern).
- Integration: mocked YouTube/Twitter/GitHub APIs; assert extracted fields.
- Image pipeline: AVIF/WebP generated; size budget < 80 KB.
- SSRF tests: confirm private IPs blocked.
