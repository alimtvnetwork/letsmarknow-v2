# Storage Bucket Layout

> **Closes gap M8.** Canonical bucket names, path conventions, retention policies, and access patterns for object storage.
> **Locked rule:** All paths follow `{bucket}/{shard}/{logical_id}/{kind}.{ext}`. PRs that invent new top-level paths are rejected.

---

## 1. Buckets

| Bucket | Visibility | Purpose | Retention |
|---|---|---|---|
| `favicons` | Public (CDN) | Site favicons | Immutable, refreshed every 90 d |
| `attachments` | Private (signed URLs) | User uploads on items / comments | Lifetime of item; orphan purge after 30 d |
| `exports` | Private (signed URLs) | GDPR exports, manual exports | 7 days, then purge |
| `imports` | Private (write-only by user) | Source files for importers | 24 h after import completes |
| `org-assets` | Public (CDN) | Org logos, share-page branding | Lifetime of Org |
| `share-snapshots` | Public (CDN) | OG image snapshots of public shares | 90 days, regen on demand |
| `email-attachments` | Private (signed URLs, 24 h) | Email-in pipeline temp storage | 24 h hard purge |
| `audit-archive` | Private (system only) | Compressed audit-log JSON | 7 years (compliance) |

## 2. Path convention

```
{bucket}/{shard}/{logical_id}/{kind}.{ext}
```

- **shard** = first 2 hex chars of `logical_id` (UUIDv7), distributes load
- **logical_id** = entity UUID or content-addressed sha256
- **kind** = role of the file (`orig`, `thumb`, `16`, `32`, `og`, `csv`)

### Examples

| Bucket | Path |
|---|---|
| favicons | `ab/abcdef0123…/16.png` |
| attachments | `01/01ABCDEF…/orig.pdf` |
| exports | `9c/9cFEDCBA…/gdpr.zip` |
| org-assets | `7f/7f0123…/logo.png` |
| share-snapshots | `4d/4d8888…/og.png` |
| audit-archive | `2026/04/19/audit-org-{org_id}.json.zst` |

(`audit-archive` uses date-partitioned path because it is time-series, not entity-keyed.)

## 3. Access patterns

| Bucket | Read | Write | Delete |
|---|---|---|---|
| favicons | Public via CDN | Edge function only | Cron purge |
| attachments | Signed URL (5 min) issued by API after RLS check | Signed upload URL (5 min, ≤25 MB) | Owner / admin or item owner |
| exports | Signed URL (1 h) | Edge function only | Cron purge after 7 d |
| imports | Signed upload URL (15 min, ≤500 MB) | User | Cron purge 24 h after import |
| org-assets | Public via CDN | Owner / admin | Owner / admin |
| share-snapshots | Public via CDN | Edge function (regen on share update) | Cron purge 90 d after share revoke |
| email-attachments | System-only signed URLs | Email pipeline | Cron purge 24 h |
| audit-archive | System-only | Cron writer | Never (compliance) |

## 4. CDN config

- All public buckets fronted by CDN at `cdn.letsmarknow.com`.
- Cache key strips query string (objects are content-addressed).
- `Cache-Control: public, max-age=31536000, immutable` for content-addressed paths.
- `Cache-Control: public, max-age=3600` for entity-keyed paths (org-assets, share-snapshots).

## 5. Cleanup jobs (cron)

| Job | Schedule | Action |
|---|---|---|
| `purge_imports` | hourly | Delete `imports/*` older than 24 h |
| `purge_exports` | hourly | Delete `exports/*` older than 7 d |
| `purge_email_attachments` | hourly | Delete `email-attachments/*` older than 24 h |
| `purge_share_snapshots` | daily | Delete `share-snapshots/*` for revoked shares > 90 d |
| `refresh_favicons` | weekly | Re-extract favicons not refreshed in 90 d |
| `archive_audit` | nightly | Roll prior day's `audit_log` rows into `audit-archive` then delete from DB |

## 6. Quotas (per Org)

| Bucket | Free | Pro | Team | Lifetime |
|---|---|---|---|---|
| attachments | 100 MB | 5 GB | 50 GB | 5 GB |
| exports (concurrent) | 1 | 5 | 20 | 5 |
| imports (concurrent) | 1 | 3 | 5 | 3 |

Quota check runs at signed-upload-URL issue time → 413 if would exceed.

## 7. Locked rules

1. Path convention `{bucket}/{shard}/{logical_id}/{kind}.{ext}` is mandatory.
2. Attachments are virus-scanned (ClamAV edge function) before signed download URL is issued the first time; result cached in `attachments_scan` table.
3. No bucket is publicly writable. All writes go through signed URLs with Content-Length + Content-Type pinned.
4. No PII in bucket names or object paths. UUIDs and shas only.
5. `audit-archive` is **append-only**. PRs adding delete logic are auto-rejected.
