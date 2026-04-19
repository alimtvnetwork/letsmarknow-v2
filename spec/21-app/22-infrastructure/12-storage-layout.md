# Storage Bucket Layout

> **Closes gap M8.** Canonical bucket names, path conventions, retention policies, and access patterns for object storage.
> **Reconciliation note (2026-04-19, F-M01 + F-M12):** Bucket inventory unified with `06-cdn-storage.md`. Older `lmn-` prefix dropped per Cloud convention. Path scheme is **hybrid**: content-addressed buckets use sharded scheme; entity-keyed buckets use `{bucket}/{org_id}/{entity_type}/{entity_id}/...`. Old `lmn-og-images` ≡ new `share-snapshots`. `backups` and `avatars` re-added.

---

## 1. Buckets (canonical inventory)

| Bucket | Visibility | Path scheme | Purpose | Retention |
|---|---|---|---|---|
| `favicons` | Public (CDN) | content-addressed | Site favicons (resolved by worker, never user upload) | Immutable, refreshed every 90 d |
| `attachments` | Private (signed URLs) | entity-keyed | User uploads on items / comments | Lifetime of item; orphan purge after 30 d |
| `exports` | Private (signed URLs) | entity-keyed | GDPR exports, manual exports | 7 days, then purge |
| `imports` | Private (write-only by user) | entity-keyed | Source files for importers | 24 h after import completes |
| `org-assets` | Public (CDN) | entity-keyed | Org logos, share-page branding | Lifetime of Org |
| `avatars` | Public (CDN) | entity-keyed | Org + Account avatars | TTL 30 d after delete |
| `share-snapshots` | Public (CDN) | content-addressed | OG image snapshots of public shares (was `lmn-og-images`) | 90 days, regen on demand |
| `email-attachments` | Private (signed URLs, 24 h) | content-addressed | Email-in pipeline temp storage | 24 h hard purge |
| `audit-archive` | Private (system only) | date-partitioned | Compressed audit-log JSON | 7 years (compliance) |
| `backups` | Private (system only, restricted IAM) | date-partitioned | DB + storage backups | Per `02-environments.md` retention |

> **Bucket count:** 10. Names are lowercase + hyphen, no prefix. PRs that introduce other buckets are rejected.

## 2. Path conventions

Two schemes are allowed; the bucket determines which.

### 2.1 Content-addressed (favicons, share-snapshots, email-attachments)

```
{bucket}/{shard}/{logical_id}/{kind}.{ext}
```

- **shard** = first 2 hex chars of `logical_id` (UUIDv7 or sha256 hex), distributes load.
- **logical_id** = entity UUID or content-addressed sha256 (lowercase hex).
- **kind** = role of the file (`orig`, `thumb`, `16`, `32`, `og`, `csv`).

### 2.2 Entity-keyed (attachments, exports, imports, org-assets, avatars)

```
{bucket}/{org_id}/{entity_type}/{entity_id}/{filename}
```

`org_id` first → bulk-delete on Org deletion is a single prefix scan.

### 2.3 Date-partitioned (audit-archive, backups)

```
{bucket}/{YYYY}/{MM}/{DD}/{name}.{ext}
```

Time-series, not entity-keyed; never enumerate via prefix scan from app code.

### Examples

| Bucket | Scheme | Path |
|---|---|---|
| favicons | content | `ab/abcdef0123…/16.png` |
| share-snapshots | content | `4d/4d8888…/og.png` |
| email-attachments | content | `9c/9c1234…/orig.eml` |
| attachments | entity | `<org_id>/items/<item_id>/orig.pdf` |
| exports | entity | `<org_id>/exports/<export_id>/full.zip` |
| imports | entity | `<org_id>/imports/<import_id>/source.html` |
| org-assets | entity | `<org_id>/orgs/<org_id>/logo.png` |
| avatars | entity | `<org_id>/users/<account_id>/avatar-256.webp` |
| audit-archive | date | `2026/04/19/audit-org-<org_id>.json.zst` |
| backups | date | `2026/04/19/db-pgdump-prod.sql.zst` |

## 3. Access patterns

| Bucket | Read | Write | Delete |
|---|---|---|---|
| favicons | Public via CDN | Edge function only | Cron purge |
| attachments | Signed URL (5 min) issued by API after RLS check | Signed upload URL (5 min, ≤25 MB) | Owner / admin or item owner |
| exports | Signed URL (1 h) | Edge function only | Cron purge after 7 d |
| imports | Signed upload URL (15 min, ≤500 MB) | Account | Cron purge 24 h after import |
| org-assets | Public via CDN | Owner / admin | Owner / admin |
| avatars | Public via CDN | Account (own) / admin (org) | Account / admin |
| share-snapshots | Public via CDN | Edge function (regen on share update) | Cron purge 90 d after share revoke |
| email-attachments | System-only signed URLs | Email pipeline | Cron purge 24 h |
| audit-archive | System-only | Cron writer | Never (compliance) |
| backups | System-only (restricted IAM, owner+sre only) | Backup cron | Per retention policy |

## 4. CDN config

- All public buckets fronted by CDN at `cdn.letsmarknow.com`.
- Cache key strips query string for content-addressed paths; preserves it for entity-keyed (versioned via `?v=` query).
- `Cache-Control: public, max-age=31536000, immutable` for content-addressed paths.
- `Cache-Control: public, max-age=3600` for entity-keyed paths (`org-assets`, `avatars`, `share-snapshots`).

## 5. Cleanup jobs (cron)

> **All cron schedules in this section are UTC** (F-M20 reconciliation, 2026-04-19). `nightly = 03:00 UTC`. `daily = 02:00 UTC`. `weekly = Sunday 04:00 UTC`. `hourly = top of every hour, UTC`. Owner-facing dashboards translate to Asia/Kuala_Lumpur (UTC+8) per locked timezone rule.

| Job | Schedule (UTC) | Action |
|---|---|---|
| `purge_imports` | hourly (`:00`) | Delete `imports/*` older than 24 h |
| `purge_exports` | hourly (`:05`) | Delete `exports/*` older than 7 d |
| `purge_email_attachments` | hourly (`:10`) | Delete `email-attachments/*` older than 24 h |
| `purge_share_snapshots` | daily (`02:00 UTC`) | Delete `share-snapshots/*` for revoked shares > 90 d |
| `purge_avatars` | daily (`02:15 UTC`) | Delete `avatars/*` orphaned > 30 d |
| `refresh_favicons` | weekly (`Sun 04:00 UTC`) | Re-extract favicons not refreshed in 90 d |
| `archive_audit` | nightly (`03:00 UTC`) | Roll prior day's `audit_log` rows into `audit-archive` then delete from DB |
| `backup_db` | nightly (`03:30 UTC`) | Snapshot DB → `backups/` per `02-environments.md` |

## 6. Quotas (per Org)

| Bucket | Free | Pro | Team | Lifetime |
|---|---|---|---|---|
| attachments | 100 MB | 5 GB | 50 GB | 5 GB |
| exports (concurrent) | 1 | 5 | 20 | 5 |
| imports (concurrent) | 1 | 3 | 5 | 3 |

Quota check runs at signed-upload-URL issue time → 413 if would exceed.

## 7. Locked rules

1. Path conventions in §2 are mandatory. Buckets choose ONE scheme; PRs mixing schemes within a bucket are rejected.
2. Attachments are virus-scanned (ClamAV edge function) before signed download URL is issued the first time; result cached in `attachments_scan` table.
3. No bucket is publicly writable. All writes go through signed URLs with Content-Length + Content-Type pinned.
4. No PII in bucket names or object paths. UUIDs and content hashes only.
5. `audit-archive` and `backups` are **append-only**. PRs adding delete logic are auto-rejected.
6. Bucket inventory in §1 is the single source of truth. `06-cdn-storage.md` defers to this file.
