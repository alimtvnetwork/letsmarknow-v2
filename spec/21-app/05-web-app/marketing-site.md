# Marketing Site (`letsmarknow.com`)

Top-of-funnel + content. SSR for SEO and OG cards.

---

## 1. Stack

- Same React + Vite codebase as app, separate entry under `/marketing`.
- SSR via Vite SSR plugin OR static-prerender at build for stable pages (home, pricing, features, legal).
- Blog & docs use MDX, content in repo (`marketing/content/`).
- Edge-cached at Cloudflare; cache keys per locale.

## 2. IA

| Page | Purpose |
|---|---|
| `/` | Home — hero, demo video, social proof, problem→solution, CTA ("Add to Chrome") |
| `/pricing` | Plans table + lifetime banner + FAQ |
| `/features/save-tabs` | Feature page |
| `/features/share-collections` | Feature page |
| `/features/teams` | Feature page |
| `/features/import-from-toby` | Migration landing |
| `/features/import-from-tabextend` | Migration landing |
| `/features/import-from-pocket` | Migration landing |
| `/blog` | Index, paginated 12/page |
| `/blog/:slug` | Post with TOC, related posts, share buttons |
| `/changelog` | Versioned releases, RSS feed |
| `/docs` | Sidebar-navigated MDX docs |
| `/help` | Support landing (FAQ + contact form) |
| `/security` | Security overview, certifications, bug bounty |
| `/legal/terms` | ToS |
| `/legal/privacy` | Privacy policy |
| `/legal/dpa` | DPA |
| `/legal/cookies` | Cookie policy |
| `/welcome` | Post-extension-install landing |
| `/affiliate` | Affiliate program signup |
| `/customers/:slug` | Case studies (Team plan customers) |
| `/integrations` | Integrations directory |
| `/about` | Team, mission |
| `/jobs` | Careers |

## 3. Home page sections

1. Sticky nav (logo · Features · Pricing · Docs · Login · "Add to Chrome")
2. Hero: H1, subhead, two CTAs ("Add to Chrome" primary, "See how it works" secondary), animated screenshot
3. Logo bar (proof: TechCrunch / ProductHunt / etc.)
4. "Why" (3-up: Save · Organize · Share)
5. Animated demo (looped MP4 + WebM, 12 s)
6. Comparison table vs Toby, Tab Extend, Raindrop, Pocket
7. Pricing teaser → CTA to `/pricing`
8. Customer quotes (3 cards)
9. Final CTA + footer

## 4. Pricing page

- Toggle Monthly/Yearly (yearly shows ~30% off badge)
- 3 cards: Free · Pro · Team (4th card: "Lifetime" linked)
- Feature comparison table (collapsed mobile, expanded desktop)
- FAQ accordion (8 items: refunds, taxes, seat reduction, lifetime stacking, EU VAT, etc.)
- Banner: "Lifetime deal on AppSumo / PitchGround" (when active)

## 5. Docs

- Generated from MDX with frontmatter (title, slug, order, group).
- Sidebar TOC, in-page TOC, search (Algolia DocSearch).
- Code blocks with copy button.
- Version selector (current major).
- "Was this helpful? Yes/No" feedback form.

## 6. Blog

- Categories: Product updates · Productivity · Comparisons · Tutorials · Engineering.
- RSS feed at `/blog/feed.xml`.
- Author pages.
- Reading time estimate.
- OG images auto-generated from title via Cloudflare Image Functions.

## 7. SEO

- See `seo.md`.
- Sitemap: `/sitemap.xml` (auto from routes).
- Robots: `/robots.txt` allows everything except `/auth/*`, `/i/*` (private items), `/me/*`.
- Schema.org: `Organization`, `WebSite`, `BreadcrumbList`, `FAQPage` on pricing, `BlogPosting` on posts, `SoftwareApplication` on home.

## 8. Analytics

- First-party only (Plausible self-hosted at `plausible.letsmarknow.com`).
- Cookieless; respects DNT; no consent banner needed in EU.
- No third-party trackers (no GA, no FB pixel) — explicit selling point on `/security`.

## 9. Performance

- LCP < 1.8 s on 4G.
- CLS < 0.05.
- All images responsive (`srcset`, `sizes`, AVIF + WebP).
- Critical CSS inlined.
- No render-blocking JS above the fold.

## 10. A11y

- Lighthouse a11y ≥ 95.
- All interactive elements keyboard-reachable.
- Color contrast AA minimum, AAA for body text.
- Skip links.

## 11. Localization

- Marketing in `en` at launch.
- `de`, `fr`, `es`, `ja`, `zh` planned post-launch via translation memory + human review.
- Locale-prefixed URLs (`/de/pricing`); `hreflang` tags.
