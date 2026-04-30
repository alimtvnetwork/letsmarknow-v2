# Embed Widget

Iframe-friendly variant of a public/password share for embedding in blogs, docs, internal wikis.

---

## 1. URL

`https://letsmarknow.com/e/{slug}` — same slug as `/t/{slug}` but renders an embed shell.

## 2. Differences from `/t/{slug}`

- No top-bar logo / nav.
- No footer attribution by default (Pro+); attribution required on Free/Pro shares (small "via LMN").
- Compact theme by default; respects `?theme=light|dark|auto` and `?accent=<hex>` params.
- Auto-resizes via `postMessage` (`{ type: "lmn:embed:size", height }`) every 200 ms when content height changes.
- `X-Frame-Options` set to allow embedding (specifically: omitted; rely on owner allowlist).

## 3. Embed snippet

```html
<iframe
  src="https://letsmarknow.com/e/abc123?theme=auto"
  style="width:100%; border:0;"
  height="600"
  loading="lazy"
  referrerpolicy="strict-origin"
  sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
></iframe>
<script src="https://letsmarknow.com/e/embed.js" async></script>
```

> **Sandbox security note.** The `sandbox` attribute intentionally **omits** `allow-same-origin` (prevents the embed from reading parent cookies/localStorage) and `allow-top-navigation` (prevents clickjacking redirects of the host page). `allow-popups-to-escape-sandbox` is required so that user-initiated "Open in new tab" lands on a normal `letsmarknow.com` tab (not a sandboxed one), which is acceptable because popups are user-gesture-gated. Threat-model context: `19-security-privacy/05-share-link-security.md §Embed`. Origin allowlist enforcement: §4 below.

The optional `embed.js` listens for `postMessage` and updates iframe height; if absent, iframe falls back to fixed height.

## 4. Allowlist

- Owner sets allowed parent origins in Share settings (Pro+).
- Server checks `Sec-Fetch-Site` and (when present) request `Origin` against allowlist; rejects with 403 page if mismatched.
- "*" wildcard available but discouraged (warning in UI).

## 5. Capabilities

| Action | Allowed |
|---|---|
| Read items | ✅ |
| Open items in new tab | ✅ |
| Search | ✅ |
| Tag filter | ✅ |
| Switch view mode | optional (param `?view=`) |
| Comments / reactions | ❌ in embed in v1 (deep-link out to `/t/{slug}`) |

## 6. Performance

- Initial HTML < 30 KB gzip.
- JS < 70 KB gzip.
- LCP p75 < 1.2 s on cached embed.
- No third-party fonts loaded; uses system stack inside iframe to avoid layout shifts.

## 7. SEO

- Embed page itself: always `noindex`.
- Item links inside use `rel="noopener"`.

## 8. Theming

- `?theme=auto` follows host page via CSS `prefers-color-scheme`.
- `?accent=ff5722` overrides primary accent.
- Host-page tokens not inherited (sandbox isolation).

## 9. Security

- iframe sandbox attribute recommended in snippet.
- CSP on embed: `default-src 'self'; img-src https:; script-src 'self' 'unsafe-inline'` (the inline is for resize messaging only, hashed if possible).
- No outbound XHR to non-LMN origins.

## 10. Telemetry

- `embed.loaded` `{ slug, parent_origin_hash }`
- `embed.item_clicked` `{ rank }`
- `embed.resize` (sampled 0.1%)
- `embed.blocked_origin` `{ slug }`

## 11. Entitlements

| Feature | Free | Pro | Team |
|---|:---:|:---:|:---:|
| Embed available | ❌ | ✅ | ✅ |
| Hide attribution | ❌ | ❌ | ✅ |
| Origin allowlist | ❌ | ✅ | ✅ |
| Custom accent | ❌ | ✅ | ✅ |
| Multiple embed variants per share | ❌ | ❌ | ✅ |

## 12. Edge cases

| Case | Behavior |
|---|---|
| Embedded inside another LMN share | Allowed but flagged in telemetry |
| Parent page sets `X-Frame-Options: DENY` | Browser blocks; nothing we can do |
| Slow parent — message handler not registered | Iframe uses fallback height |
| Share revoked | Embed renders "Share revoked" panel |
| Free plan owner adds embed snippet | Embed page returns 402 panel with upgrade prompt |

## 13. Tests

- E2E: embed in test host page; resize behavior.
- Origin allowlist enforcement.
- CSP compliance verification.
- Cross-browser (Chrome/Firefox/Safari) iframe rendering.
