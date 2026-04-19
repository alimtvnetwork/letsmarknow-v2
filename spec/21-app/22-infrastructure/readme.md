# 22 — Infrastructure

> **Closes:** Blocker B6 from `audit/gap-analysis.md`.
>
> **Purpose:** Single source of truth for hosting, CI/CD, env vars, secrets, domains, SSL, CDN, queues, cron, and observability. Anything the on-call engineer needs at 3 a.m. lives here.

## Reading order

1. `01-hosting.md` — where every surface runs (web app, marketing site, API, extension assets, share viewer).
2. `02-environments.md` — `dev` / `staging` / `prod` topology and promotion flow.
3. `03-env-vars.md` — complete env-var inventory per surface, with required/optional flag.
4. `04-secrets.md` — secrets vault, rotation policy, who has access.
5. `05-domains-ssl.md` — domain map, DNS records, SSL provisioning, custom-domain workflow for Team plan.
6. `06-cdn-storage.md` — static asset CDN, image/favicon storage buckets, cache headers.
7. `07-queues.md` — background-job queue (imports, exports, webhooks, email).
8. `08-cron.md` — scheduled jobs (trash purge, dunning, share-expiry, analytics rollups).
9. `09-ci-cd.md` — pipelines, build-time secrets, deployment gates, rollback.
10. `10-observability.md` — logs, metrics, traces, alerts, on-call.
11. `13-iac.md` — Terraform/Pulumi snippets for hosting, storage, cron, DNS; drift detection (F-M03 closure).

## Files

| File | Purpose |
|---|---|
| `01-hosting.md` | Where each surface runs |
| `02-environments.md` | dev/staging/prod topology |
| `03-env-vars.md` | Env-var inventory |
| `04-secrets.md` | Secrets vault + rotation |
| `05-domains-ssl.md` | Domains, DNS, SSL |
| `06-cdn-storage.md` | CDN + buckets |
| `07-queues.md` | Background jobs |
| `08-cron.md` | Scheduled jobs |
| `09-ci-cd.md` | CI/CD pipelines |
| `10-observability.md` | Logs, metrics, alerts |
| `13-iac.md` | Terraform/Pulumi modules + drift detection (F-M03) |

## Locked rules

- **Default stack:** Lovable Cloud (Supabase under the hood) for DB + Auth + Storage + Edge Functions. **Never expose "Supabase" in user-facing copy** — always "Lovable Cloud".
- **Region:** EU-West primary (Frankfurt). US-East read replica only when M14 quota crosses threshold. EU-resident user data **never** leaves EU.
- **TLS 1.3 mandatory** on every public endpoint. HSTS preload after stable launch.
- **No secrets in git.** Ever. Build secrets in workspace settings; runtime secrets in Cloud secrets vault.
- **Twelve-factor.** All config via env vars; no env-specific code branches.
- **Infrastructure-as-spec.** Every change to hosting / DNS / queues is recorded in this folder before being applied. Drift = bug.
- **Disaster recovery:** RPO ≤ 1 h, RTO ≤ 4 h for prod. Backups encrypted, restored monthly to staging as test.
- **No vendor lock-in for data.** Postgres dump must be restorable on stock PostgreSQL 16+. Storage uses S3-compatible API only.
- **Cost ceiling:** prod infra ≤ USD 800/month at 5k MAU; alert if MAU/cost ratio degrades > 20% MoM.
- **On-call rotation:** weekly, primary + secondary; runbooks per alert in `10-observability.md`.
