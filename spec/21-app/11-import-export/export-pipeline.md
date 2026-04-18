# Export Pipeline

End-to-end flow from request to delivered file(s).

---

## 1. Stages

```
request → enqueue → render → package → deliver → expire
```

Always async — even small exports use the same pipeline for consistency.

## 2. Request

Surface: `/settings/export` OR per-Collection "Export" menu.

Form:
- **Scope**: Whole Org | Specific Space | Specific Collection(s).
- **Format**: LMN JSON (default) | Netscape HTML | CSV | OPML | Markdown bundle.
- **Include**: notes ✅ | tags ✅ | shares ❌ | history ❌ | previews ❌ (large).
- **Date filter** (optional): Items created/updated between dates.
- **Delivery**: Email link (default) | In-app inbox notification.

`POST /v1/exports`:
```json
{
  "scope": { "type": "org", "id": "..." },
  "format": "lmn_json",
  "include": { "notes": true, "tags": true, "previews": false },
  "filters": { "since": "2026-01-01", "until": null },
  "delivery": "email"
}
```
Returns `{ export_id, status: "queued" }`.

## 3. Enqueue

- Job pushed to `exports` queue.
- Quota check: max 5 active exports per Account; pending count returned.
- Priority by plan: Team > Pro > Free.

## 4. Render

Background worker:
1. Streams data from DB in pages of 1000 items.
2. Renders to format-specific writer (writer is a stream sink).
3. For Markdown bundle: per-Collection file written to temp dir.
4. Computes checksum (LMN JSON).
5. Reports `progress_pct` to `exports` table.

### Format renderers

| Format | Renderer |
|---|---|
| LMN JSON | streaming JSON encoder; emits canonical key order |
| Netscape HTML | template-based; nested DL/DT structure |
| CSV | RFC 4180 writer; UTF-8 with BOM |
| OPML | XML builder |
| Markdown bundle | one .md per Collection; manifest.json; zipped |

## 5. Package

- Single-file formats: written directly to object storage.
- Markdown / multi-file: zipped (DEFLATE, level 6).
- LMN JSON: gzipped if > 1 MB.
- File naming: `lmn-export-<org_slug>-<YYYY-MM-DD>-<short_id>.<ext>`.

## 6. Deliver

- Signed download URL valid 7 days.
- Email sent: "Your export is ready · Download (expires in 7 days)".
- In-app inbox notification (regardless of delivery choice).
- `/settings/export` shows history of exports with re-download (until expiry) + re-run.

## 7. Expire

- Files auto-deleted from storage at expiry.
- DB row retained 90 days for audit (no file, just metadata).

## 8. Quotas

| Plan | Active exports | Per 24h | Max scope |
|---|---|---|---|
| Free | 1 | 1 | Personal Org |
| Pro | 3 | 10 | any Org member of |
| Team | 10 | 100 | any Org member of |

`bulk_export` entitlement gates the multi-Org / large-scope variants.

## 9. Performance

- Latency target: 95% of exports < 60 s; 100k items < 5 min.
- Single object-storage upload; chunked if > 100 MB.

## 10. Security

- Signed URLs use short tokens (no enumeration).
- Download requires neither auth nor account (anyone with link can download).
- Email recipient = Owner email at request time.
- Exports include only data the requester has access to (Member role honored).
- `share_secrets`, `password_hashes`, `api_tokens` NEVER exported (separate GDPR flow handles those).

## 11. Resume / failure

- If render crashes mid-job: state machine restarts from last checkpoint (per 1000-item page).
- 3 retries; then failure email + admin alert.
- Failed exports do not count against quota.

## 12. Telemetry

- `export.requested` `{ format, scope_type, include }`
- `export.queued`
- `export.render_started`
- `export.render_completed` `{ items, size_bytes, duration_ms }`
- `export.delivered` `{ channel }`
- `export.downloaded` `{ from_email_link }`
- `export.failed` `{ reason }`
- `export.expired`

## 13. Edge cases

| Case | Behavior |
|---|---|
| Org deleted between request and render | Export aborted; user notified |
| Scope contains 0 items | Empty file delivered (with friendly README in Markdown bundle) |
| User loses access to scope during render | Pages re-checked per fetch; lost-access pages excluded; user notified of partial export |
| Concurrent exports of same scope | Both processed; no dedup (user explicitly requested both) |
| File > 1 GB | Split into multi-part download (zip with .001, .002 etc.) |

## 14. Re-imports

- LMN JSON exports must round-trip back via the import pipeline byte-identically (modulo timestamps).
- Continuous integration test asserts this.

## 15. Tests

- Each format: snapshot of small fixture export.
- LMN JSON round-trip.
- Quota enforcement.
- Signed URL expiry.
- Resume after crash.
- Performance: 100k items end-to-end < 5 min in CI synthetic.
