# Import Pipeline

End-to-end flow from file upload to committed records.

---

## 1. Stages

```
upload → detect → parse → preview → confirm → commit → finalize
```

Each stage is observable, cancellable, and resumable.

## 2. Upload

- Surface: `/import` web app page OR extension popup "Import" tab.
- Multipart upload to `POST /v1/imports/upload`.
- Max file size: 50 MB per file (5 files per batch).
- Streaming receive; written to temp object storage with TTL = 24h.
- Returns `import_id` + `upload_url` for resumable chunks (tus protocol for files > 5 MB).

## 3. Detect

- Server sniffs file (`01-formats.md` § 10).
- Returns `{ import_id, detected_source, confidence }`.
- If ambiguous: client shows source picker.
- If unsupported: error with suggested formats.

## 4. Parse

- Triggered by `POST /v1/imports/:id/parse?source=<id>`.
- Spawns background job (Bull / Lovable Cloud function).
- Streams records; computes summary stats.
- Status tracked in `import_jobs` table with `progress_pct`.
- Errors per record collected (max 1000 logged, count of overflow).

### Parse output (preview cache)
- Stored in object storage as Parquet (compact columnar) for fast preview rendering.
- TTL 24h after preview created.

## 5. Preview

`GET /v1/imports/:id/preview` returns:
```json
{
  "import_id": "...",
  "source": "chrome",
  "summary": {
    "total_items": 1234,
    "total_collections": 12,
    "total_groups": 45,
    "total_tags": 89,
    "duplicates_against_existing": 56,
    "errors": 3
  },
  "structure_preview": [
    {"type": "collection", "name": "Reading List", "items": 234, "groups": [...]}
  ],
  "sample_items": [/* first 10 items per collection */],
  "issues": [
    {"row": 45, "type": "missing_url", "raw": "..."}
  ]
}
```

Client renders tree-view of detected structure with:
- Per-collection item counts.
- Duplicate badge.
- Error list (collapsible).

## 6. Confirm options

User picks (defaults bold):

- **Target Org**: dropdown of accessible Orgs.
- Target Space (optional): drop into specific Space, default = "Imports".
- **Dedup mode**: `merge_by_url` (default) | `keep_both` | `skip_duplicates`.
- **Tag prefix**: optional (e.g., `chrome-` prefix on every imported tag).
- **Add import tag**: toggle (on by default — adds `imported-2026-04-18` tag for traceability).
- **Date import**: keep original `created_at` vs use today.
- **Preserve hierarchy**: deep nesting → flatten with breadcrumb (default) vs flatten to single level.

## 7. Commit

`POST /v1/imports/:id/commit` with selected options.
- `Idempotency-Key` per canonical contract in `03-api-endpoints/01-conventions.md §6` (UUID, client-generated, 24h TTL, `(account_id, key) → response` cache, body-mismatch → `400 IDEMPOTENCY_KEY_REUSED_DIFFERENT_BODY`). Prevents double-commit.
- Spawns commit job.
- Writes records in transactions of 500.
- Each transaction:
  - Insert items + tags + group memberships.
  - Apply dedup logic.
  - Emit history events.
- Progress reported via SSE or polled `GET /v1/imports/:id/status`.

### Atomicity
- Per-file atomic: full rollback on fatal error during commit.
- Per-transaction durable: a partial-progress crash leaves committed batches intact, with internal checkpoint `resumed_from=<batch_id>` for recovery (top-level `status` remains `running` per the canonical enum in `03-api-endpoints/15-import-export.md` line 250).
- User sees "X of Y imported" with retry option for failed batches.

## 8. Finalize

- Job status → `completed`.
- Email sent (optional, default on for > 100 items): "Import complete: 1234 items added".
- Audit log entry.
- `imports/:id` page shows final summary + "View imported items" CTA.
- Preview cache evicted.

## 9. Cancellation

- User can cancel at any stage before commit.
- During commit: cancellation halts new transactions; committed work persists; top-level `status=canceled` (US spelling, per canonical enum in `03-api-endpoints/15-import-export.md` line 250).
- Soft undo: bulk-delete imported items from `imports/:id` page within 24h (uses item's `imported_at_id` link).

## 10. Quotas

| Plan | Imports per 24h | Max items per import |
|---|---|---|
| Free | 1 | 1,000 |
| Pro | 5 | 10,000 |
| Team | 50 | 100,000 |

Exceeding cap → 402 with upgrade CTA.

## 11. Error model

Per-record errors don't fail the import; collected and reported.

| Error | Behavior |
|---|---|
| `MISSING_URL` | Skip record |
| `INVALID_URL` | Skip; log raw |
| `URL_TOO_LONG` (> 4 KB) | Skip; log |
| `MALFORMED_DATE` | Use today's date |
| `UNKNOWN_TAG_REFERENCE` | Drop tag from item |
| `DUPLICATE_IN_FILE` | Keep first only |

Fatal errors (full file fail):
- `INVALID_FORMAT`
- `CHECKSUM_MISMATCH` (LMN JSON)
- `CORRUPT_FILE`
- `SCHEMA_VERSION_TOO_NEW`

## 12. Performance

- Preview generation: < 5 s for files < 1 MB; < 60 s for 50 MB.
- Commit throughput: ~ 5,000 items/sec (DB-bound).
- 100k import end-to-end: < 5 min p95.
- Preview UI streams structure as parsed (don't wait for full parse).

## 13. Security

- Files scanned for embedded scripts / suspicious URLs (basic regex).
- HTML import: sanitized; no `<script>` execution attempted.
- ZIP imports: bomb-detected (max ratio 100:1; max extracted size 200 MB).
- Uploaded files isolated in temp bucket; not web-accessible.
- Auto-deleted after 24h regardless of import outcome.

## 14. Telemetry

- `import.upload_started` `{ size_bytes }`
- `import.upload_completed` `{ size_bytes, duration_ms }`
- `import.detect_resolved` `{ source }`
- `import.parse_started`
- `import.parse_completed` `{ records, errors, duration_ms }`
- `import.preview_viewed`
- `import.commit_started` `{ dedup_mode }`
- `import.commit_progress` `{ pct }` (sampled)
- `import.commit_completed` `{ items_added, items_merged, items_skipped, duration_ms }`
- `import.canceled` `{ stage }`
- `import.failed` `{ stage, reason }`

## 15. Tests

- End-to-end: upload → preview → commit → verify items in DB.
- Idempotency: double-commit produces single result.
- Resume after simulated commit-time crash.
- Quota enforcement.
- Per-stage cancellation.
- ZIP bomb rejection.
