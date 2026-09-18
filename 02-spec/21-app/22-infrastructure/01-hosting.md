# Hosting

Where every surface runs in production. Each surface is independently deployable.

---

## 1. Surface → host map

| Surface | Host | Region | Why |
|---|---|---|---|
| `app.letsmarknow.com` (web app SPA) | Lovable hosting (CDN + edge) | global edge | Static SPA; CSR; needs deep-link fallback |
| `letsmarknow.com` (marketing + share viewer) | Lovable hosting (SSR for `/t/{slug}` and marketing pages) | global edge | SEO + social previews |
| API (`api.letsmarknow.com`) | Lovable Cloud Edge Functions (Deno) | EU-West (Frankfurt) primary | Co-located with Postgres; low p99 |
| Postgres + Auth + Storage | Lovable Cloud (managed) | EU-West (Frankfurt) | EU residency by default |
| Background jobs | Lovable Cloud Edge Functions invoked via queue (see `07-queues.md`) | EU-West | Same trust boundary as API |
| Cron | Lovable Cloud scheduled functions (see `08-cron.md`) | EU-West | Native to Cloud |
| Chrome extension assets | Chrome Web Store CDN | global (Google) | Required by store; no choice |
| Share-viewer images / favicons / OG cards | Lovable Cloud Storage (S3-compatible) + CDN in front | EU-West, cached globally | See `06-cdn-storage.md` |
| Outbound email | Resend (transactional) | EU region | DKIM + SPF managed; EU residency |
| Error reporting | Self-hosted Sentry-compatible (e.g. GlitchTip) | EU-West | No third-party tracker per `19-security-privacy/` |
| Product analytics | Self-hosted PostHog | EU-West | Per `18-analytics-telemetry/01-opt-in-analytics.md` |

## 2. Surface URLs

| URL | Purpose | Auth |
|---|---|---|
| `https://letsmarknow.com` | Marketing home | none |
| `https://letsmarknow.com/t/{slug}` | Public share viewer | none / share-cookie |
| `https://app.letsmarknow.com` | Authenticated web app | bearer (cookie) |
| `https://api.letsmarknow.com/v1/*` | REST API | bearer / webhook-sig / share-cookie |
| `https://docs.letsmarknow.com` | User docs (static, MDX) | none |
| `https://status.letsmarknow.com` | Status page (third-party, e.g. Instatus) | none |

## 3. Why not multi-cloud

v1 stays single-vendor (Lovable Cloud) for: faster iteration, fewer secrets, single audit surface. Multi-cloud is a Phase 4 decision once we have measured load and a real SRE team.

## 4. Cross-references

- Environments: `02-environments.md`
- Domains & DNS: `05-domains-ssl.md`
- Cost ceiling: `readme.md` locked rules
