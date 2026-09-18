# Jobs Endpoints

> **Scope.** A `Job` is any server-side async unit of work that the client may want to poll without knowing its specific domain (export, import, GDPR-export, bulk delete, mindmap layout compute, share-purge, license-recompute, etc.). The Jobs API is a uniform polling surface across all of those.
>
> Per-domain endpoints (e.g. `GET /v1/imports/:id/status`, `GET /v1/exports/:export_id`) still exist and return richer, domain-specific payloads. `GET /v1/jobs/:job_id` returns the **lowest-common-denominator** envelope so generic UI (toast progress bars, a "Background tasks" tray, the command-palette job list) can work without knowing the domain.

All require bearer auth + `X-Organization-Id`. Rate limit class: `read`.

---

### Get job status (generic poller)
`GET /v1/jobs/:job_id`

**Auth:** bearer + `X-Organization-Id`
**Idempotent:** yes
**Rate limit class:** `read` (120 / min per Account; SSE preferred for jobs > 30 s)

> **Why this exists.** When a server action returns `{ job_id }` (e.g. `POST /v1/spaces/:id/duplicate` returns 202 with a job id — see `05-spaces.md §168`), the client gets a single canonical URL to poll. The server resolves which underlying domain owns the job and returns a normalized status envelope.

**Path params**
- `job_id` — opaque server-assigned id; do NOT assume it equals an `import_id`, `export_id`, or any other domain primary key.

**Query params**
- `stream` (`sse`, optional) — upgrade to text/event-stream emitting the same payload on every state change.

**Response 200**
```json
{
  "data": {
    "job_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
    "kind": "import",
    "status": "running",
    "phase": "writing_items",
    "progress": { "processed": 187, "total": 312, "percent": 60 },
    "eta_seconds": 24,
    "result_url": null,
    "result_summary": null,
    "error": null,
    "organization_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
    "created_by_account_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
    "created_at": "2026-04-20T08:30:00Z",
    "updated_at": "2026-04-20T08:30:42Z",
    "finished_at": null,
    "expires_at": "2026-04-21T08:30:00Z"
  }
}
```

**Field semantics**
- `kind` enum: `import | export | gdpr_export | bulk_delete | bulk_move | mindmap_layout | share_purge | license_recompute | data_migration | webhook_replay`.
- `status` enum: `queued | running | succeeded | partial | failed | canceled`.
- `phase` — domain-specific free-form string, advisory only. Generic UI displays `progress.percent`; the importer UI may use `phase` for finer-grained labels.
- `result_url` — populated on `succeeded` for jobs that produce a downloadable artifact (exports, GDPR). `null` for in-place mutations (bulk delete).
- `result_summary` — populated on `succeeded`/`partial` with domain-specific counters (e.g. `{ items_created: 287, items_failed: 7 }`). Schema is `kind`-dependent; consult the domain endpoint for canonical fields.
- `error` — populated on `failed` with `{ code, message, details? }` matching the standard error envelope (`18-error-codes.md`).
- `expires_at` — when the job record itself is purged from the jobs table (default 24 h after `finished_at`; longer for export-bearing jobs to allow `result_url` retrieval).

**Cross-domain payload** — clients needing the rich, domain-specific view should re-fetch the owning resource using the URL implied by `kind`:

| `kind` | Rich endpoint |
|---|---|
| `import` | `GET /v1/imports/:import_id` (`15-import-export.md`) |
| `export` | `GET /v1/exports/:export_id` (`15-import-export.md`) |
| `gdpr_export` | `GET /v1/organizations/:id/data-export/:export_id` (`04-organizations.md`) |
| `mindmap_layout` | `GET /v1/mindmap-layouts/:id` (`23-mindmap-layouts.md`) |
| `share_purge` | (no rich poll; share record is gone on success) |
| `bulk_delete` / `bulk_move` | `result_summary` is the only payload |

**Errors**
- `404 NOT_FOUND` — job does not exist OR has expired AND been purged.
- `403 FORBIDDEN` — job belongs to another Org.
- `410 GONE` — job finished and the result artifact has been purged (e.g. export object expired); see the rich domain endpoint for re-issue mechanics.
