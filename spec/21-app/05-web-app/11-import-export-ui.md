# Import / Export UI

`/org/:id/import` and `/org/:id/export`. Front-ends for `03-api-endpoints/15-import-export.md`.

---

## 1. Import flow

### 1.1 Source picker
Tile grid (4-up):
- Lets Mark Now JSON (native)
- Browser bookmarks (HTML)
- Toby (JSON)
- Tab Extend (JSON)
- Pocket (CSV)
- Raindrop (CSV)
- Instapaper (CSV)
- "Other" → contact-support modal

Each tile shows source logo + "What's preserved" mini-table on hover (folders/lists/tags/notes/dates).

### 1.2 Destination picker
- "New Space" (default) — name inputs, optional emoji.
- "Existing Space" — dropdown.
- "Existing Collection" — dropdown (only for source types that map to one Collection, e.g. single Pocket export).

Strategy options (per source):
- `preserve_lists_as_collections` (default for list-based sources)
- `preserve_folders_as_spaces_then_collections` (for hierarchical bookmark HTML)
- `flatten_into_one_collection` (advanced)

### 1.3 Options
- Dedupe URLs (default ON) — within import + against destination
- Tag prefix (default `imported:` + source slug, e.g. `imported:toby`)
- Preserve original timestamps (default ON for native; OFF for unreliable sources)
- Convert source "groups" → LMN Groups (default ON for Tab Extend & Toby)

### 1.4 Upload
- Drag-and-drop zone or file picker.
- Client validates extension (`.json`, `.html`, `.csv`) and max size (50 MB Pro, 200 MB Team).
- Progress bar (chunked PUT to signed URL).

### 1.5 Processing
- Polls `GET /v1/imports/:import_id` every 2 s.
- Progress bar updates from `progress.percent`.
- Cancel button until `running` ends.
- On `succeeded`: success card with summary counters + "View imported Space" CTA.
- On `partial`: warning card; "Download error report" link (signed URL).
- On `failed`: error card with reason + "Retry" + support link.

### 1.6 Free tier
- Cap of 200 items per import.
- If file would exceed: warn before upload with offer to "Upgrade to Pro for unlimited imports".

## 2. Export flow

### 2.1 Scope picker
- Whole organization (Owner/Admin)
- Specific Space (any Member with read access)
- Specific Collection (any Member with read access)

### 2.2 Format
- LMN native JSON (default; round-trippable)
- Browser bookmarks HTML (universal)
- CSV flat (one row per item)
- Pocket CSV (interop)

### 2.3 Includes
Checkboxes for: Spaces / Collections / Groups / Items / Tags / Shares (config only) / Members (Owner only) / History (Owner only). Greyed out per format.

Toggle: include soft-deleted (default OFF), include favicons (default OFF; bloats file).

### 2.4 Submit & track
- POST `/v1/exports`.
- Job appears in "Recent exports" list with status pill.
- On `succeeded`: "Download" button (signed URL, 7-day expiry).
- Email notification when ready (if user enabled in `/me/notifications`).

## 3. Recent jobs panel

Bottom of page: list of last 10 import + export jobs across this Org with statuses, actor avatar, and quick re-run/download.

## 4. Permissions

- Editors+ can import.
- Anyone with read on the source scope can export at the lowest scope; org-wide export needs Owner/Admin.

## 5. Edge cases

| Case | Behavior |
|---|---|
| Browser bookmarks HTML with deeply nested folders | First 5 levels mapped: top → Space, next → Collections, deeper → Groups (capped); deepest URLs preserved with breadcrumb tag |
| Toby JSON with ungrouped tabs | Created as Items directly under Collection without Group |
| Pocket CSV missing tags | Imported with `imported:pocket` tag only |
| Duplicate URL within file | Skipped, listed in error report with line numbers |
| Export larger than 100 MB | Server splits into multi-part zip; download includes manifest |
| Import job stuck > 1 h | Auto-fails with "internal_timeout"; user retries |

## 6. Telemetry

- `import.started` `{ source, scope_kind }`
- `import.completed` `{ source, success_count, skip_count, fail_count, duration_ms }`
- `import.failed` `{ source, error_code }`
- `export.started` `{ format, scope_kind }`
- `export.completed` `{ format, item_count, size_bytes, duration_ms }`
