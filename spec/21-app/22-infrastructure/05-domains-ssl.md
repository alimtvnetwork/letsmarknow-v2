# Domains & SSL

Authoritative DNS layout. Any divergence is a bug.

---

## 1. Domain map

> **Reconciled (F-M23, 2026-04-19):** added `staging.`, `preview.`, `cdn.`, `api.staging.`, `share.` so that every redirect URI registered in `09-auth-accounts/12-oauth-clients.md` §3 has a corresponding origin enumerated here.

| Domain | Purpose | Provider |
|---|---|---|
| `letsmarknow.com` | Root (marketing + share viewer) | Registrar: Porkbun. DNS: Cloudflare. |
| `app.letsmarknow.com` | Web app SPA (prod) | CNAME → Lovable hosting |
| `staging.letsmarknow.com` | Web app SPA (staging) — also OAuth redirect host for staging | CNAME → Lovable hosting (staging env) |
| `preview.letsmarknow.com` | Preview-branch reverse proxy → `*.lovable.app` | CNAME → preview proxy worker |
| `api.letsmarknow.com` | REST API (prod) | CNAME → Cloud Edge Functions |
| `api.staging.letsmarknow.com` | REST API (staging) | CNAME → Cloud Edge Functions (staging) |
| `cdn.letsmarknow.com` | Public CDN for storage buckets per `06-cdn-storage.md` §4 | CNAME → CDN provider |
| `share.letsmarknow.com` | Custom-domain CNAME target for Team plan share viewers (per §4 below) | CNAME → Lovable hosting |
| `docs.letsmarknow.com` | User docs (static) | CNAME → Lovable hosting |
| `status.letsmarknow.com` | Status page | CNAME → Instatus |
| `letsmarknow.dev` | dev/staging legacy zone (kept for tooling) | Same registrar; isolated zone |
| `*.lmn.email` | `save@user.lmn.email` import addresses | MX → email-in vendor (per `11-import-export/08-email-in.md`) |
| `letsmarknow.app` | Defensive registration (redirect to `.com`) | 301 |
| `letsmark.com` / `lets-mark.com` | Defensive (typosquatting) | 301 |

> Note: `rt.letsmarknow.com` is **not** registered. Realtime transport runs on Supabase Realtime per `08-sharing-collab/14-realtime-transport.md` (post F-M06 reconciliation).

## 2. DNS records (prod)

```
letsmarknow.com.            A     <Lovable IP, see hosting>
www.letsmarknow.com.        CNAME letsmarknow.com.
app.letsmarknow.com.        CNAME <hosting target>
api.letsmarknow.com.        CNAME <Cloud Edge Functions target>
docs.letsmarknow.com.       CNAME <hosting target>
status.letsmarknow.com.     CNAME <Instatus target>
letsmarknow.com.            MX 10 <Resend inbound>           ; transactional only
letsmarknow.com.            TXT   "v=spf1 include:_spf.resend.com -all"
resend._domainkey.letsmarknow.com. TXT "<DKIM key>"
_dmarc.letsmarknow.com.     TXT   "v=DMARC1; p=quarantine; rua=mailto:dmarc@letsmarknow.com"
letsmarknow.com.            CAA   0 issue "letsencrypt.org"
letsmarknow.com.            CAA   0 issuewild ";"            ; no wildcard certs
```

## 3. SSL

- **Provider:** Let's Encrypt via the hosting platform (auto-renewal).
- **Cipher policy:** TLS 1.3 only; TLS 1.2 fallback disabled after stable launch.
- **HSTS:** `max-age=63072000; includeSubDomains; preload` (after stable launch; preload submission once).
- **OCSP stapling:** enabled.
- **No wildcard certificates** — explicit cert per subdomain (CAA enforces).
- **CT logs:** monitored via Cert Spotter; alert on unexpected issuance.

## 4. Custom domains for Team plan

Per `05-web-app/06-org-settings.md` §1.3, Team customers can map `bookmarks.example.com` → their org's share viewer.

- User adds CNAME pointing to `share.letsmarknow.com`.
- Server validates DNS via TXT verification token.
- SSL provisioned automatically (Let's Encrypt, auto-renew).
- Per-domain SNI; no shared cert.
- Status surfaced in Org Settings using the same status taxonomy as Lovable's domain feature: `Verifying` → `Setting up` → `Active` / `Failed` / `Offline`.

## 5. Email DNS (transactional)

- Outbound only (we do not host inboxes).
- SPF, DKIM, DMARC mandatory.
- Bounce handling: webhook from Resend → Cloud Function → mark email as bouncing → suppress further sends.

## 6. Defensive registrations

| Domain | Action |
|---|---|
| `letsmarknow.app`, `letsmarknow.io`, `letsmarknow.co`, `letsmarknow.net`, `letsmarknow.org` | 301 → `letsmarknow.com` |
| `letsmark.com`, `lets-mark.com`, `letsmarknow.xyz` | 301 → `letsmarknow.com` |
| Common typos: `letsmrknow.com`, `letsmarkow.com` | 301 |

## 7. Cross-references

- Hosting targets: `01-hosting.md`
- Email send pipeline: `07-queues.md`
- Custom-domain UX: `05-web-app/06-org-settings.md`
