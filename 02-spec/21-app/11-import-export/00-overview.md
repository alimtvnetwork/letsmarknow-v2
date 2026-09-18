# 00 — Import / Export Folder Overview

> **Purpose.** Define how data **enters** the product (browser bookmarks, competitor exports, CSV, email-in, API/webhooks) and how it **leaves** (full GDPR export, scoped export, scheduled migration-out). Pipelines, formats, dedup logic, large-import handling, and migration safety all live here.

---

## 1. Responsibilities

1. **Format catalogue.** Every accepted import format and every emitted export format (HTML bookmarks, JSON, CSV, NDJSON, ZIP bundle).
2. **Importer per source.** Chrome HTML, Firefox HTML, Pocket, Raindrop, Diigo, Notion, custom CSV, generic JSON.
3. **Pipeline.** Upload → parse → validate → map → dedup → write → notify.
4. **Mapping & dedup.** How external fields map to our `items` columns; how duplicates are detected (URL canonicalisation + content fingerprint).
5. **Large imports.** Chunking, async job, progress reporting, partial-failure handling, resume.
6. **Webhooks & API imports.** Programmatic ingestion endpoints with idempotency.
7. **Email-in.** Per-user inbound email address that creates an Item from the message body / first link.
8. **GDPR export.** Full account dump on request; encrypted ZIP; download link expiry.
9. **Migration out.** Documented format that any competitor or self-hosted tool can re-ingest.
10. **Dedup algorithm.** Locked specification of URL canonicalisation rules.

---

## 2. File-by-file behaviour

| File | Owns |
|---|---|
| `01-formats.md` | Inventory of import & export formats with shape definitions. |
| `02-importers.md` | Per-source importer specs (Chrome, Firefox, Pocket, Raindrop, Diigo, Notion, CSV, JSON). |
| `03-import-pipeline.md` | Stages: upload → parse → validate → map → dedup → write → notify. |
| `04-export-pipeline.md` | Stages: scope → assemble → bundle → sign → expire. |
| `05-mapping-and-dedup.md` | Field mapping per source; dedup decision rules. |
| `06-large-imports.md` | Async job; chunking; progress; resume; partial-failure UX. |
| `07-webhooks-and-api-imports.md` | Programmatic ingestion contract with idempotency. |
| `08-email-in.md` | Per-user inbound address; parsing; spam controls. |
| `09-gdpr-export.md` | Full account dump format; encryption; expiry. |
| `10-migration-out.md` | Documented portable format competitors/self-hosters can re-ingest. |
| `11-dedup-algorithm.md` | URL canonicalisation rules; fingerprint hash; collision handling. |

---

## 3. Tasks performed by this folder

- **Accept data** from every supported source without losing fidelity.
- **Normalise into our schema** via documented mappers.
- **Detect and merge duplicates** deterministically.
- **Run large imports asynchronously** through the queue (`22-infrastructure/07-queues.md`).
- **Emit GDPR-compliant exports** with encryption and expiring links.
- **Guarantee the user can leave** with a documented portable format.

---

## 4. What this folder is NOT

- **Not the import/export UI.** That is `05-web-app/11-import-export-ui.md`.
- **Not the API surface.** Endpoint contracts are in `03-api-endpoints/15-import-export.md`.
- **Not the queue.** Queue infrastructure is in `22-infrastructure/07-queues.md`.

---

## 5. Cross-references

- Import/Export API: `03-api-endpoints/15-import-export.md`.
- Import/Export UI: `05-web-app/11-import-export-ui.md`.
- Queue: `22-infrastructure/07-queues.md`.
- Storage paths for upload bundles: `22-infrastructure/12-storage-layout.md` (W-7 lock).
- GDPR cross-cutting: `19-security-privacy/04-gdpr-ccpa.md`.
