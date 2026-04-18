# SEO Conventions

For both `letsmarknow.com` (marketing) and `app.letsmarknow.com` (selectively for `/t/{slug}` and login pages).

---

## 1. Title

- Format: `<Page Title> — Lets Mark Now`
- Max 60 chars total; truncate page title if needed (don't truncate brand).
- One `<h1>` per page; matches title intent.

## 2. Meta description

- 130–155 chars.
- Action-oriented (verb up front).
- Different per page; no duplicates.

## 3. Canonical

- `<link rel="canonical">` on every public page pointing to the canonical URL (no query params, no trailing slash).
- For paginated pages, canonical points to page itself (not page 1).

## 4. Robots

`/robots.txt`:
```
User-agent: *
Allow: /
Disallow: /me/
Disallow: /auth/
Disallow: /save
Disallow: /handle
Disallow: /onboarding
Disallow: /onboarding-ext
Disallow: /org/
Disallow: /search?
Sitemap: https://letsmarknow.com/sitemap.xml
```

Per-page `<meta name="robots">`:
- Marketing pages: `index, follow` (default).
- Share viewer (public mode + sharer opted in to indexing): `index, follow`.
- Share viewer (default): `noindex, follow`.
- Share viewer (password/invite): `noindex, nofollow`.
- Login/signup/auth: `noindex, nofollow`.
- Account/org pages: `noindex, nofollow`.

## 5. Sitemap

- `/sitemap.xml` — index pointing to per-section sitemaps:
  - `/sitemap-marketing.xml` (home, pricing, features, legal)
  - `/sitemap-blog.xml` (auto from MDX)
  - `/sitemap-docs.xml`
  - `/sitemap-changelog.xml`
- Updated daily by build job; `lastmod` set per source file mtime.
- Share viewer URLs are NOT in sitemap (private content; opt-in to indexing is rare).

## 6. Open Graph

Every public page:
- `og:type` (`website` / `article` / `product`)
- `og:title`
- `og:description`
- `og:url`
- `og:image` (1200×630, AVIF+JPEG; auto-generated from title for blog/changelog)
- `og:locale` (e.g. `en_AU`)
- `og:site_name` = `Lets Mark Now`

## 7. Twitter card

- `twitter:card` = `summary_large_image` (or `summary` for narrow content)
- `twitter:site` = `@letsmarknow`
- `twitter:title` / `twitter:description` / `twitter:image` (mirrors OG)

## 8. JSON-LD (Schema.org)

| Page type | Type |
|---|---|
| Home | `Organization` + `WebSite` (with `SearchAction`) + `SoftwareApplication` |
| Pricing | `FAQPage` (per FAQ block) + `Product` per plan |
| Blog index | `Blog` + `ItemList` |
| Blog post | `BlogPosting` (author, datePublished, image, mainEntityOfPage) |
| Docs page | `TechArticle` |
| Changelog | `WebPage` |
| Share viewer (Collection) | `CollectionPage` + `ItemList` of items |
| Share viewer (Item) | `Article` |
| Customer story | `Article` with `Review` block |
| Pricing FAQ | `FAQPage` |
| Breadcrumbs | `BreadcrumbList` on every nested page |

## 9. Performance for SEO

- Core Web Vitals targets: LCP < 1.8 s, INP < 200 ms, CLS < 0.05.
- Server-Timing header on SSR responses for diagnostics.
- Preconnect to `cdn.letsmarknow.com` and `api.letsmarknow.com`.
- Preload critical fonts (subset: latin + chosen heading face).

## 10. Internationalization

- Locale-prefixed URLs (`/de/...`).
- `<link rel="alternate" hreflang="de" href="https://letsmarknow.com/de/...">` for each translated page.
- `x-default` points to English.
- `<html lang="...">` set per locale.

## 11. Accessibility (overlap with SEO)

- Headings in correct order (no h1 → h3 jumps).
- Image alt text descriptive (not "image of …").
- Buttons vs links semantic distinction.
- ARIA only when native HTML is insufficient.

## 12. Crawl budget

- Block low-value query strings via robots: `Disallow: /*?utm_*`.
- Prefer canonical to dedupe.
- Pagination uses `rel="next"` / `rel="prev"` (still beneficial in some engines).

## 13. Monitoring

- Weekly Search Console crawl error report → automated Slack message.
- Sitemap submitted to Google Search Console + Bing Webmaster Tools at deploy time via API.
- Monthly review of top 20 landing pages for CTR/position regressions.
