# Import & Export Endpoints

Bulk migration in/out of Lets Mark Now. Supports native JSON, browser bookmarks HTML, Pocket CSV, Toby JSON, Tab Extend export, and Raindrop CSV.

All require bearer auth + `X-Organization-Id`. Rate limit class: `bulk`.

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
    "import_id": "01J...",
    "status": "awaiting_upload",
    "upload_url": "https://uploads.letsmarknow.com/imports/01J.../put?token=...",
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
    "import_id": "01J...",
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
    "errors_url": "https://uploads.letsmarknow.com/imports/01J.../errors.json",
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
    "export_id": "01J...",
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
    "export_id": "01J...",
    "status": "succeeded",
    "format": "lmn_native_json",
    "download_url": "https://uploads.letsmarknow.com/exports/01J.../file?token=...",
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

### Move organization data to another Org (export-then-import combo)
`POST /v1/transfers/cross-org`

Convenience: server orchestrates export from Org A and import into Org B in one job. Both Orgs must have caller as Editor+.

**Request body**
```json
{
  "from_organization_id": "01J...",
  "to_organization_id": "01J...",
  "scope": { "kind": "space", "space_id": "01J..." },
  "destination": { "kind": "new_space", "space_name": "Imported from Personal" },
  "delete_source_after_success": false
}
```
**Response 202** `{ data: { transfer_id: "01J...", status: "queued" } }`
