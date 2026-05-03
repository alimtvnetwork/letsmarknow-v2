# Import & Export Endpoints

Bulk migration in/out of Lets Mark Now. Supports native JSON, browser bookmarks HTML, Pocket CSV, Toby JSON, Tab Extend export, and Raindrop CSV.

All require bearer auth + `X-Organization-Id`. Rate limit class: `bulk`.

---

### Direct multipart upload (small files / single-shot)
`POST /v1/imports/upload`

**Auth:** bearer + `X-Organization-Id`
**Idempotent:** Idempotency-Key (recommended)
**Rate limit class:** `bulk` (5 / hour per Org for files ≤ 25 MB)

> **When to use this vs `POST /v1/imports`.** `POST /v1/imports` is the **two-phase** flow: server returns a presigned `upload_url`, client PUTs the file, server processes async. `POST /v1/imports/upload` is the **one-shot** flow: client posts the file body directly as `multipart/form-data` and the server enqueues the job. Use one-shot for files ≤ 25 MB; use two-phase for larger files (presigned URLs bypass the API gateway body-size limit).

**Request** — `multipart/form-data` with parts:
- `file` (required) — the import payload (JSON / HTML / CSV)
- `manifest` (required) — JSON blob with the same `source` / `destination` / `options` fields documented under `POST /v1/imports`

**Response 202**
```json
{
  "data": {
    "import_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
    "status": "queued",
    "size_bytes": 184320,
    "sha256": "...",
    "preview_url": "/v1/imports/0190a4f1-6c5e-7c2a-9b3f-1234567890ab/preview"
  }
}
```

**Errors**
- `400 VALIDATION_FAILED` — manifest missing or invalid JSON
- `403 ENTITLEMENT_REQUIRED` — bulk import is Pro+
- `413 PAYLOAD_TOO_LARGE` — file > 25 MB; switch to `POST /v1/imports`
- `415 UNSUPPORTED_MEDIA_TYPE` — `source` does not match detected MIME

---

### Preview parsed import (before commit)
`GET /v1/imports/:id/preview`

**Auth:** bearer + `X-Organization-Id`
**Idempotent:** yes
**Rate limit class:** `read`

> **Why this exists.** After upload, the server parses the file but does NOT mutate the Space until the user confirms. Preview returns a structured summary so the client can show "We found 312 bookmarks in 8 lists. 18 are duplicates of items you already have." with per-collection drill-down, and let the user adjust mapping/dedup before committing.

**Response 200**
```json
{
  "data": {
    "import_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
    "source": "toby",
    "parsed_at": "2026-04-20T08:30:00Z",
    "totals": {
      "spaces": 1,
      "collections": 8,
      "groups": 3,
      "items": 312,
      "tags": 12
    },
    "duplicates": {
      "by_url_in_org": 18,
      "by_url_in_destination": 14,
      "by_canonical_url": 22
    },
    "warnings": [
      { "code": "MISSING_FAVICON", "count": 47 },
      { "code": "INVALID_URL", "count": 3, "samples": ["javascript:void(0)"] }
    ],
    "tree": [
      { "kind": "collection", "name": "Read Later", "items": 142, "groups": 2 }
    ],
    "expires_at": "2026-04-21T08:30:00Z"
  }
}
```

`tree` is paginated separately via `?cursor=` for large imports (> 1000 items).

**Errors**
- `404 NOT_FOUND` — import does not exist or expired
- `409 CONFLICT` — import is still parsing; poll `/status` first
- `410 GONE` — preview window closed (24 h after upload)

---

### Get import progress (polling)
`GET /v1/imports/:id/status`

**Auth:** bearer + `X-Organization-Id`
**Idempotent:** yes
**Rate limit class:** `read` (60 / min per import; SSE preferred for long jobs)

> **Why this exists separately from `GET /v1/imports/:import_id`.** `GET /v1/imports/:import_id` returns the **full import record** (manifest, summary, errors_url, audit fields) — heavier payload, suitable for the import-detail page. `GET /v1/imports/:id/status` returns **only the live progress fields**, optimized for sub-second polling from the progress bar in the importer UI.

**Response 200**
```json
{
  "data": {
    "import_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
    "status": "running",
    "phase": "writing_items",
    "progress": { "processed": 187, "total": 312, "percent": 60 },
    "eta_seconds": 24,
    "updated_at": "2026-04-20T08:30:42Z"
  }
}
```

`phase` enum: `parsing | previewing | awaiting_commit | writing_spaces | writing_collections | writing_items | writing_tags | finalizing | done`.

**SSE alternative:** `GET /v1/imports/:id/status?stream=sse` upgrades to text/event-stream emitting the same payload on every progress tick. Preferred over polling for jobs > 30 s.

**Errors**
- `404 NOT_FOUND` — same as preview

---

### Commit a previewed import
`POST /v1/imports/:id/commit`

**Auth:** bearer + `X-Organization-Id`
**Idempotent:** Idempotency-Key (server stores result keyed by import_id; safe to retry)
**Rate limit class:** `bulk`

> **Why this exists.** A successful preview leaves the import in `awaiting_commit` state. The user reviews the preview, optionally adjusts options, and commits. Without an explicit commit, no rows are written. This is the user-confirmation gate that makes destructive imports (e.g. "merge with existing") safe.

**Request body** (all optional — overrides values from the original manifest)
```json
{
  "options": {
    "dedupe_urls": true,
    "on_duplicate": "skip",
    "tag_prefix": "toby:"
  },
  "destination": {
    "kind": "existing_collection",
    "collection_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab"
  }
}
```

`on_duplicate` enum: `skip | overwrite | create_new | merge_tags`.

**Response 202**
```json
{
  "data": {
    "import_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
    "status": "queued",
    "committed_at": "2026-04-20T08:30:00Z"
  }
}
```

**Errors**
- `409 CONFLICT` — import not in `awaiting_commit` state
- `410 GONE` — preview expired; client must re-upload
- `422 UNPROCESSABLE_ENTITY` — destination override invalid (e.g. collection in another Org)

---

### Start import job
`POST /v1/imports`

**Idempotent:** Idempotency-Key

**Request body** — multipart `application/json` envelope describing the upload:
```json
{
  "source": "toby",
  "destination": {
    "kind": "new_space",
    "space_name": "Imported from Toby",
    "collection_strategy": "preserve_lists_as_collections"
  },
  "options": {
    "dedupe_urls": true,
    "tag_prefix": "toby:",
    "preserve_dates": true,
    "convert_groups": true
  },
  "upload": {
    "filename": "toby-export.json",
    "size_bytes": 184320,
    "mime": "application/json",
    "sha256": "..."
  }
}
```

**`source`** values: `lmn_native | bookmarks_html | pocket_csv | toby_json | tab_extend_json | raindrop_csv | instapaper_csv`.

**`destination.kind`**: `new_space | existing_space | existing_collection`.

**Response 202**
```json
{
  "data": {
    "import_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
    "status": "awaiting_upload",
    "upload_url": "https://uploads.letsmarknow.com/imports/0190a4f1-6c5e-7c2a-9b3f-1234567890ab/put?token=...",
    "upload_method": "PUT",
    "upload_expires_at": "2026-04-18T15:22:31.000Z",
    "max_size_bytes": 52428800
  }
}
```

Client then PUTs the file to `upload_url`. Server processes async.

**Errors**
- `403 ENTITLEMENT_REQUIRED` — bulk import is Pro+; Free tier limited to 200 items/import
- `413 PAYLOAD_TOO_LARGE` — `max_size_bytes` exceeded

---

### Get import status
`GET /v1/imports/:import_id`

**Response 200**
```json
{
  "data": {
    "import_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
    "source": "toby",
    "status": "succeeded",
    "progress": { "processed": 312, "total": 312, "percent": 100 },
    "summary": {
      "spaces_created": 1,
      "collections_created": 8,
      "groups_created": 3,
      "items_created": 287,
      "items_skipped_duplicate": 18,
      "items_failed": 7,
      "tags_created": 12
    },
    "errors_url": "https://uploads.letsmarknow.com/imports/0190a4f1-6c5e-7c2a-9b3f-1234567890ab/errors.json",
    "started_at": "...",
    "finished_at": "..."
  }
}
```

`status`: `awaiting_upload | queued | running | succeeded | partial | failed | canceled`.

---

### Cancel import
`POST /v1/imports/:import_id/cancel`
**Response 200** Updated import.

---

### List imports (history)
`GET /v1/imports?limit=20`

---

### Start export job
`POST /v1/exports`

**Request body**
```json
{
  "format": "lmn_native_json",
  "scope": {
    "kind": "organization",
    "include": ["spaces","collections","groups","items","tags","shares","members","history"],
    "include_deleted": false
  },
  "options": {
    "include_favicons": false,
    "redact_share_passwords": true
  }
}
```

**`format`**: `lmn_native_json | bookmarks_html | csv_flat | pocket_csv`.
**`scope.kind`**: `organization | space | collection`.

**Response 202**
```json
{
  "data": {
    "export_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
    "status": "queued",
    "estimated_completion_at": "..."
  }
}
```

---

### Get export status (download URL when ready)
`GET /v1/exports/:export_id`

**Response 200**
```json
{
  "data": {
    "export_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
    "status": "succeeded",
    "format": "lmn_native_json",
    "download_url": "https://uploads.letsmarknow.com/exports/0190a4f1-6c5e-7c2a-9b3f-1234567890ab/file?token=...",
    "download_expires_at": "2026-04-25T...",
    "size_bytes": 1843200,
    "sha256": "...",
    "items_count": 4123
  }
}
```

`download_url` is signed and expires in 7 days. Re-issue via `POST /v1/exports/:export_id/refresh-url`.

---

### List exports
`GET /v1/exports?limit=20`

---

### Refresh expired download URL
`POST /v1/exports/:export_id/refresh-url`

**Auth:** bearer + `X-Organization-Id`
**Idempotent:** yes (safe to retry; new URL each call)
**Rate limit class:** `read` (10 / hour per export)

> **Why this exists.** Export download URLs expire after 7 days. Rather than re-running the full export job (which can take minutes for large Orgs), this endpoint mints a fresh signed URL pointing at the same underlying object. Object-storage retention is 30 days; after that the export must be re-run.

**Request body** (optional)
```json
{ "ttl_hours": 168 }
```
- `ttl_hours` — requested URL lifetime; max 168 (7 days), default 168.

**Response 200**
```json
{
  "data": {
    "export_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
    "download_url": "https://uploads.letsmarknow.com/exports/0190a4f1-6c5e-7c2a-9b3f-1234567890ab/file?token=...",
    "download_expires_at": "2026-04-27T08:30:00Z",
    "object_expires_at": "2026-05-05T08:30:00Z"
  }
}
```

**Errors**
- `404 NOT_FOUND` — export does not exist
- `409 CONFLICT` — export not in `succeeded` state (still running, failed, canceled)
- `410 GONE` — underlying object purged (> 30 days); re-run the export

---

### Migration-token export (out-of-band download)
`GET /v1/exports/lmn-json/:account_token`

**Auth:** none — the path-embedded `account_token` is the credential. NOT a bearer endpoint.
**Idempotent:** yes
**Rate limit class:** `bulk` (3 / day per token; `429 RATE_LIMITED` after)

> **Why this exists.** Power-users who want to mirror their Lets Mark Now data into external tooling (cron jobs, personal scripts, alternative clients) need a stable, scriptable URL that does NOT require an interactive OAuth dance. The Account-scoped migration token is issued in `/settings/api/migration-token` (`11-import-export/10-migration-out.md §88`) and returns a streaming `lmn_native_json` of the user's primary Org.
>
> **Security:** The token is bearer-equivalent — anyone with it can download the user's full export. Tokens can be revoked at any time from settings. Never log the token in URLs (use header form `Authorization: Bearer lmn_mig_…` if the client supports it; the path form is provided only because most curl/wget pipelines do not).

**Path params**
- `account_token` — opaque string `lmn_mig_<base32>`, 40+ chars; rotates on revoke.

**Response 200** — `Content-Type: application/json`, streamed.

The body is identical to a successful `lmn_native_json` export from `POST /v1/exports`. No envelope wrapping; the JSON object IS the export.

**Headers returned**
- `Content-Disposition: attachment; filename="lmn-export-<org_slug>-<yyyy-mm-dd>.json"`
- `X-Export-Sha256: <hex>`
- `X-Export-Item-Count: <int>`

**Errors**
- `401 UNAUTHENTICATED` — unknown or revoked token
- `403 FORBIDDEN` — token's Account is suspended or has no primary Org
- `429 RATE_LIMITED` — daily cap exceeded

---

### Move organization data to another Org (export-then-import combo)
`POST /v1/transfers/cross-org`

Convenience: server orchestrates export from Org A and import into Org B in one job. Both Orgs must have caller as Editor+.

**Request body**
```json
{
  "from_organization_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
  "to_organization_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
  "scope": { "kind": "space", "space_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab" },
  "destination": { "kind": "new_space", "space_name": "Imported from Personal" },
  "delete_source_after_success": false
}
```
**Response 202** `{ data: { transfer_id: "0190a4f1-6c5e-7c2a-9b3f-1234567890ab", status: "queued" } }`
