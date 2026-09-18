# 00 — Infrastructure Folder Overview

> **Purpose.** Single source of truth for **everything that runs in production**: hosting, environments, env vars, secrets, domains, SSL, CDN, storage, queues, cron, CI/CD, observability. Anything the on-call engineer needs at 3 a.m. lives here. Drift between this folder and reality is a P0 bug.

---

## 1. Responsibilities

1. **Hosting topology.** Where each surface (web app, marketing, API, share viewer, extension assets, storage, email, error reporting, analytics) runs, in which region, and why.
2. **Environments.** dev / staging / prod topology and the promotion flow between them.
3. **Configuration.** Env-var inventory per surface; required vs optional flag; per-environment matrix.
4. **Secrets.** Vault location, rotation policy, who has access.
5. **Domains & SSL.** DNS records, SSL provisioning, custom-domain workflow for Team plan.
6. **CDN & storage.** Static asset CDN, image/favicon storage buckets (S3-compatible), cache headers, storage path layout (W-7 lock).
7. **Queues.** Background-job queue for imports, exports, webhooks, email.
8. **Cron.** Scheduled jobs with per-job timezone column (F-M20 closure).
9. **CI/CD.** Pipelines, build-time secrets, deployment gates, rollback, plus the **spec-drift-linter** that locks every W-class fix from the audit (F-CI-DRIFT closure).
10. **Observability.** Logs, metrics, traces, alerts, on-call rotation, runbooks.
11. **Email provider.** Resend (transactional), DKIM/SPF/DMARC, EU residency.
12. **Storage layout.** Bucket-and-prefix map (W-7 lock retains `lmn-` for client-visible IDs).

---

## 2. File-by-file behaviour

| File | Owns |
|---|---|
| `01-hosting.md` | Surface → host map; URL inventory; multi-cloud deferral. |
| `02-environments.md` | dev / staging / prod topology; promotion flow. |
| `03-env-vars.md` | Complete env-var inventory per surface; W-12 lock with Chrome Identity API exception. |
| `04-secrets.md` | Vault, rotation policy, access list. |
| `05-domains-ssl.md` | DNS records, SSL provisioning, custom-domain workflow. |
| `06-cdn-storage.md` | CDN config, storage buckets, cache headers. |
| `07-queues.md` | Background job queue: imports, exports, webhooks, email. |
| `08-cron.md` | Scheduled jobs (trash purge, dunning, share-expiry, analytics rollups) with per-job timezone column. |
| `09-ci-cd.md` | Pipelines + spec-drift-linter (11 sub-checks locking W-1, W-3 … W-13, F-M09/F-M10) + deployment gates + rollback. |
| `10-observability.md` | Logs, metrics, traces, alerts, on-call. |
| `11-email-provider.md` | Resend config, DKIM/SPF/DMARC, EU residency. |
| `12-storage-layout.md` | Bucket and prefix map; W-7 lock. |

---

## 3. Tasks performed by this folder

- **Run the product** — every surface mapped to a host, region, and trust boundary.
- **Promote builds** through dev → staging → prod with the canary + auto-rollback rules in `09-ci-cd.md` §2.4.
- **Lock spec drift in CI** so W-class fixes cannot regress (`09-ci-cd.md` §2.1.1).
- **Schedule recurring work** via cron with explicit timezone semantics.
- **Receive and process billing webhooks** through the queue with `(provider, event_id)` idempotency.
- **Hold all secrets** outside git; rotate per policy.
- **Observe everything** with logs, metrics, traces, and alerts wired to on-call runbooks.

---

## 4. What this folder is NOT

- **Not the API.** Endpoint contracts are in `03-api-endpoints/`.
- **Not the data model.** Schema is in `02-data-model/`.
- **Not migrations.** DDL artefacts are an implementation deliverable (deferred per spec-only mode).
- **Not the design system.** Token files live in `06-ui-ux/`.

---

## 5. Cross-references

- Locked rules: `22-infrastructure/readme.md` §Locked rules (TLS 1.3, EU residency, no secrets in git, twelve-factor, IaC-as-spec, RPO/RTO, no vendor lock-in for data, cost ceiling).
- Webhook idempotency consumer: `03-api-endpoints/17-billing-webhooks.md`.
- Queue consumer for imports: `11-import-export/06-large-imports.md`.
- Email triggers: `08-sharing-collab/08-notifications.md`.
- CI drift-linter rule sources: `23-audits/audit-2026-04-19-ai-readiness-score.md` §Live Issue Tracker.
