# 11 — Import & Export

How users get data INTO Lets Mark Now and OUT of it. First-class concern: portability is the antidote to lock-in fear.

## Reading order

1. `01-formats.md` — supported file formats (HTML, JSON, CSV, OPML, Markdown).
2. `02-importers.md` — per-source importers (Chrome, Raindrop, Pocket, Pinboard, etc.).
3. `03-import-pipeline.md` — upload → parse → preview → commit flow.
4. `04-export-pipeline.md` — request → render → deliver flow.
5. `05-mapping-and-dedup.md` — how external structures map to our model; dedup rules.
6. `06-large-imports.md` — chunking, streaming, resumability for 50k+ items.
7. `07-webhooks-and-api-imports.md` — programmatic ingestion.
8. `08-email-in.md` — `save@user.lmn.email` capture address.
9. `09-gdpr-export.md` — full account data export (legal compliance).
10. `10-migration-out.md` — exporters for users leaving (we make this easy on purpose).

## Files

| File | Purpose |
|---|---|
| `01-formats.md` | File format specs |
| `02-importers.md` | Source-specific adapters |
| `03-import-pipeline.md` | Upload → commit |
| `04-export-pipeline.md` | Request → deliver |
| `05-mapping-and-dedup.md` | Model translation |
| `06-large-imports.md` | Scale & resumability |
| `07-webhooks-and-api-imports.md` | Programmatic |
| `08-email-in.md` | Email capture |
| `09-gdpr-export.md` | Full data export |
| `10-migration-out.md` | Leaving Lets Mark Now |

## Locked rules

- **Import is always previewable** before commit (no surprise data dumps).
- **Imports are atomic per file** — full rollback on parse failure.
- **Imports run async** for files > 1 MB or > 500 items.
- **Exports never block on size** — always async + delivered via signed download URL.
- **Original source preserved** in item metadata (`imported_from`, `imported_at`) for audit.
- **Dedup is opt-in** at import time; default is "merge by URL".
- **GDPR export complete in < 24h**; signed URL valid 7 days; one request per Account per 24h.
- **Migration-out exporters MUST round-trip** — exporting then re-importing yields identical structure.
- **Email-in throttled** per plan; spam-filtered; replies bounce with friendly explanation.
