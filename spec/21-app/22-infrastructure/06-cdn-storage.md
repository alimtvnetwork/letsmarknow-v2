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

## 2. Storage buckets (Cloud Storage, S3-compatible)

| Bucket | Visibility | Purpose | Lifecycle |
|---|---|---|---|
| `lmn-favicons` | public-read | Cached favicons resolved by our worker | TTL 90 d, refresh on miss |
| `lmn-og-images` | public-read | Generated OG cards for shares | TTL 30 d after share revoked |
| `lmn-exports` | private (signed URLs) | User-requested exports (zips, JSON) | Auto-delete after 7 d |
| `lmn-imports` | private (signed URLs) | User-uploaded import files | Auto-delete after 24 h |
| `lmn-attachments` | per-Org private | Future: Item attachments (Pro+) | Soft-delete with parent |
| `lmn-avatars` | public-read | Org + user avatars | TTL 30 d after delete |
| `lmn-backups` | private, restricted IAM | DB + storage backups | Per `02-environments.md` retention |

## 3. Bucket path convention

```
<bucket>/<org_id>/<entity_type>/<entity_id>/<filename>
```

Examples:

```
lmn-favicons/<org_id>/items/<item_id>/icon.png
lmn-og-images/shares/<share_id>/card-1200x630.png
lmn-exports/<org_id>/exports/<export_id>/full.zip
lmn-avatars/orgs/<org_id>/avatar-256.webp
lmn-avatars/users/<account_id>/avatar-256.webp
```

> Org ID always present (except `shares/` and `users/`) so bulk-delete on Org deletion is a single prefix scan.

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
