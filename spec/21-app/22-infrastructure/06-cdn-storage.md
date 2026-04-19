# CDN & Storage

Static asset delivery + bucket layout for user uploads, favicons, exports.

---

## 1. CDN layers

| Surface | CDN | Cache TTL | Invalidation |
|---|---|---|---|
| Web app SPA bundles | Lovable edge | `immutable, max-age=31536000` (hashed filenames) | None needed; new hash = new URL |
| Marketing pages (SSR) | Lovable edge | `s-maxage=300, stale-while-revalidate=86400` | Tag-based purge on publish |
| Public share viewer (`/t/{slug}`) | Lovable edge | `s-maxage=60, stale-while-revalidate=300` | Purge on share update / revoke |
| API responses (read-only public) | edge | `s-maxage=30` for `/v1/share-public/*` | Tag purge on share update |
| Favicons | edge cached from storage | `max-age=86400` | Purge on item URL change |
| OG images | edge cached from storage | `max-age=604800` | Purge on share metadata change |
| Exports (signed URLs) | not cached | — | n/a |

## 2. Storage buckets

> **Authoritative inventory:** `12-storage-layout.md` §1. The table here is a non-normative summary kept in sync. **Bucket names are unprefixed** (no `lmn-`). The reconciliation on 2026-04-19 (F-M01) dropped the prefix.

| Bucket | Visibility | Purpose |
|---|---|---|
| `favicons` | public-read | Cached favicons resolved by our worker |
| `share-snapshots` | public-read | Generated OG cards for shares (was `lmn-og-images`) |
| `exports` | private (signed URLs) | User-requested exports (zips, JSON) |
| `imports` | private (signed URLs) | User-uploaded import files |
| `attachments` | per-Org private | Item attachments (Pro+) |
| `avatars` | public-read | Org + Account avatars |
| `org-assets` | public-read | Org logos, share-page branding |
| `email-attachments` | private (signed URLs, 24 h) | Email-in pipeline temp |
| `audit-archive` | private (system only) | Compressed audit-log JSON |
| `backups` | private, restricted IAM | DB + storage backups |

## 3. Bucket path conventions

Two schemes — see `12-storage-layout.md` §2 for full rules. Summary:

- **Content-addressed** (`favicons`, `share-snapshots`, `email-attachments`): `{bucket}/{shard}/{logical_id}/{kind}.{ext}`
- **Entity-keyed** (`attachments`, `exports`, `imports`, `org-assets`, `avatars`): `{bucket}/{org_id}/{entity_type}/{entity_id}/{filename}`
- **Date-partitioned** (`audit-archive`, `backups`): `{bucket}/{YYYY}/{MM}/{DD}/{name}.{ext}`

Examples:

```
favicons/ab/abcdef0123…/16.png
share-snapshots/4d/4d8888…/og.png
attachments/<org_id>/items/<item_id>/orig.pdf
exports/<org_id>/exports/<export_id>/full.zip
avatars/<org_id>/users/<account_id>/avatar-256.webp
audit-archive/2026/04/19/audit-org-<org_id>.json.zst
```

> Org ID always present in entity-keyed paths so bulk-delete on Org deletion is a single prefix scan.

## 4. Image pipeline

- **Favicons:** background worker fetches via headless browser → resizes 16/32/64/128 → stores WebP + PNG fallback → returns CDN URL. Source page never hit from user's browser (privacy).
- **OG images:** generated server-side using `satori` + `resvg` from share metadata; regenerated on share-edit.
- **Avatars:** uploaded client-side; resized server-side to 64/128/256/512 WebP; original discarded after 24 h.

## 5. Cache headers (locked)

- HTML routes: `Cache-Control: no-cache, no-store, must-revalidate` unless explicitly cacheable.
- Hashed assets: `Cache-Control: public, max-age=31536000, immutable`.
- API JSON: `Cache-Control: private, no-cache` unless endpoint marks otherwise.
- Public share viewer JSON: `Cache-Control: public, s-maxage=30`.

## 6. Cross-references

- Hosting: `01-hosting.md`
- Storage retention: `19-security-privacy/02-data-handling.md`
- Export pipeline: `11-import-export/04-export-pipeline.md`
