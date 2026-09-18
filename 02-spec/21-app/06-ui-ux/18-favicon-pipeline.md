# Favicon Pipeline

> **Closes gap M6.** Defines how favicons (the small site icons shown next to every Item) are sourced, stored, cached, and served.
> **Locked decision:** **Self-hosted `favicon-extractor` edge function** with **DuckDuckGo proxy fallback**. **Google s2 is forbidden** (privacy: leaks user URLs to Google).

---

## 1. Decision matrix

| Source | Privacy | Reliability | Cost | Verdict |
|---|---|---|---|---|
| Google `s2/favicons` | ❌ leaks every saved URL to Google | High | Free | **Forbidden** |
| DuckDuckGo `icons.duckduckgo.com` | ✅ no tracking | Medium | Free | **Fallback** |
| **Self-hosted extractor** | ✅ full control | High (with caching) | Storage + CPU | **Primary** |
| Iconhorse / favicongrabber.com | ⚠️ third-party | Medium | Free tier | Backup only |

## 2. Pipeline

```
Item saved → enqueue favicon job → edge function:
  1. Fetch <link rel="icon"> / <link rel="apple-touch-icon"> from origin (HEAD + GET, 3 s timeout)
  2. Fall back to /favicon.ico
  3. Fall back to DuckDuckGo proxy: https://icons.duckduckgo.com/ip3/<host>.ico
  4. Resize → 32×32 PNG (sharp), 16×16 PNG, original (max 256×256)
  5. Compute sha256 of original
  6. Upload to bucket `favicons/<sha256>.{png,webp}`
  7. Write `favicons` row: host → sha256 + fetched_at
  8. Item.favicon_sha → joins to favicons table
```

## 3. Storage layout

(Resolved by `M8 — Storage layout`, summarised here.)

```
bucket: favicons
  /{sha256_first_2}/{sha256}/16.png
  /{sha256_first_2}/{sha256}/32.png
  /{sha256_first_2}/{sha256}/orig.webp
```

## 4. Caching

- **CDN cache:** `Cache-Control: public, max-age=31536000, immutable` (sha-content-addressed).
- **Negative cache:** failed lookups stored as `favicon_misses(host, attempted_at, retry_after)`; retried after 7 days.
- **Refresh:** Successful favicons re-fetched every 90 days (background cron), replaced if hash changes.

## 5. Privacy & legal

- Origin fetcher uses outbound IP from a dedicated edge worker; no user-identifiable headers (`User-Agent: LetsMarknowFaviconBot/1.0 (+https://letsmarknow.com/bot)`).
- `robots.txt` honored.
- Right-to-be-forgotten: `DELETE /favicons/{sha256}` cascades to all referencing items (via NULL set).

## 6. Item rendering

```html
<img
  src="https://cdn.letsmarknow.com/favicons/ab/abcdef…/32.png"
  srcset="
    https://cdn.letsmarknow.com/favicons/ab/abcdef…/16.png 1x,
    https://cdn.letsmarknow.com/favicons/ab/abcdef…/32.png 2x"
  width="16" height="16"
  alt=""               <!-- decorative -->
  loading="lazy"
  onerror="this.replaceWith(letterFallback(host))"
/>
```

`letterFallback()` renders a colored circle with the first letter of the host (deterministic color from host hash).

## 7. Locked rules

1. **Google s2 is forbidden.** PRs referencing `s2/favicons` are auto-rejected.
2. All favicons are sha-content-addressed and immutable. Updates create new sha; old sha kept for 30 days.
3. CDN URL format: `https://cdn.letsmarknow.com/favicons/{sha[0:2]}/{sha}/{size}.{ext}` — never change.
4. Negative cache 7 days; never spam-fetch a missing favicon.
5. The fallback letter avatar is rendered client-side; never store generated PNG fallbacks server-side (waste).
