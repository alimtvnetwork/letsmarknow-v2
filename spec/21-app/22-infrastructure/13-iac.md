# 13 — Infrastructure as Code (Terraform / Pulumi)

> **Closes:** F-M03 (IaC examples gap from `audit-2026-04-19-m-gaps.md`).
>
> **Purpose.** Make every piece of production infrastructure declarable, diffable, and reviewable. This file gives **canonical IaC snippets** for hosting, storage, cron, secrets, DNS, and CDN, plus the rules for repository layout, state, and drift detection. Anything provisioned by hand is a bug; the fix is to import it into IaC the same week.
>
> **Scope.** Lovable Cloud (Supabase under the hood — never expose that name in user copy), object storage (S3-compatible), DNS (Cloudflare), CDN, scheduled functions. Multi-cloud is deferred per `01-hosting.md` §3.

---

## 1. Locked rules

1. **Two providers supported, one project per env.** Terraform 1.7+ (primary) **or** Pulumi v3 with TypeScript (alternate). A repository picks one and stays. Mixing is forbidden.
2. **State is remote and locked.** Terraform: S3 backend with DynamoDB lock table. Pulumi: Pulumi Cloud or self-hosted backend with passphrase-encrypted state.
3. **One workspace per environment.** `dev`, `staging`, `prod` are separate workspaces with separate state files. No cross-env reads.
4. **Secrets are referenced, never embedded.** All secret values come from the secrets vault (`04-secrets.md`) via data sources. Plaintext secrets in `.tf`/`.ts` fail CI.
5. **Plan before apply, always.** `terraform plan -out=tfplan` (or `pulumi preview`) is posted to the PR. Apply only after green CI + reviewer approval.
6. **Drift detection runs hourly** in prod (see §7) and opens a Linear ticket on any diff.
7. **Module versioning.** Internal modules are pinned by Git SHA. Public registry modules pinned to exact version. `~>` constraints forbidden in prod.
8. **No console clicks.** If a resource exists in prod and is not in IaC, file a P1 ticket and import within 5 working days.

---

## 2. Repository layout

```
infra/
├── README.md
├── modules/
│   ├── cloud-project/        # Lovable Cloud (Supabase) project + auth + db
│   ├── storage-bucket/       # Single S3-compatible bucket with policy
│   ├── cron-job/             # One scheduled function
│   ├── dns-zone/             # Cloudflare zone + records
│   └── cdn-distribution/     # CDN in front of public buckets
├── envs/
│   ├── dev/
│   │   ├── main.tf           # OR index.ts for Pulumi
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── backend.tf        # remote state config
│   ├── staging/  …
│   └── prod/     …
└── policies/
    ├── opa/                  # Open Policy Agent rules enforced in CI
    └── tflint/               # tflint config
```

`infra/` lives in the same monorepo as `spec/` and `src/`. PRs that change infra require a label `infra-change` and an additional reviewer from the on-call rotation.

---

## 3. Hosting — Lovable Cloud project (Terraform)

> Provider = community Supabase Terraform provider, used here under the **Lovable Cloud** branding for internal infra only. The user-facing product never says "Supabase".

```hcl
# envs/prod/main.tf

terraform {
  required_version = ">= 1.7"
  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "= 1.4.1"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "= 4.40.0"
    }
  }
  backend "s3" {
    bucket         = "lmn-tfstate-prod"
    key            = "lovable-cloud/terraform.tfstate"
    region         = "eu-central-1"
    dynamodb_table = "lmn-tfstate-locks"
    encrypt        = true
  }
}

provider "supabase" {
  access_token = data.vault_kv_secret_v2.cloud_access.data["token"]
}

module "cloud_project" {
  source                = "../../modules/cloud-project"
  name                  = "letsmarknow-prod"
  region                = "eu-central-1"            # Frankfurt — EU residency lock
  organization_id       = var.cloud_org_id
  db_password           = data.vault_kv_secret_v2.cloud_db.data["password"]
  point_in_time_recovery = true                     # RPO ≤ 1 h per readme.md
  retention_days        = 30                        # backups
  jwt_expiry_seconds    = 3600                      # access JWT 1h per 09-auth-accounts/06-sessions.md
  enable_realtime       = true                      # W-2 lock
  smtp_admin_email      = "ops@letsmarknow.com"
  smtp_sender_name      = "Let's Mark Now"
}
```

**Module contract** (`modules/cloud-project/variables.tf` excerpt):

```hcl
variable "name"            { type = string }
variable "region"          { type = string }     # must be one of: eu-central-1, eu-west-1
variable "organization_id" { type = string }
variable "db_password"     { type = string, sensitive = true }
variable "point_in_time_recovery" { type = bool, default = true }
variable "retention_days"  { type = number, default = 30 }
variable "jwt_expiry_seconds" { type = number, default = 3600 }
variable "enable_realtime" { type = bool, default = true }
variable "smtp_admin_email" { type = string }
variable "smtp_sender_name" { type = string }
```

---

## 4. Storage — buckets and policies

Bucket inventory is canonical in `12-storage-layout.md` §1. Each bucket is provisioned by one `module "storage_bucket"` call. **No bucket exists outside IaC.**

```hcl
# envs/prod/storage.tf

locals {
  buckets = {
    favicons          = { public = true,  retention_days = 90,  cors = true  }
    attachments       = { public = false, retention_days = 0,   cors = false }
    exports           = { public = false, retention_days = 7,   cors = false }
    imports           = { public = false, retention_days = 1,   cors = false }
    org-assets        = { public = true,  retention_days = 0,   cors = true  }
    avatars           = { public = true,  retention_days = 30,  cors = true  }
    share-snapshots   = { public = true,  retention_days = 90,  cors = true  }
    email-attachments = { public = false, retention_days = 1,   cors = false }
    audit-archive     = { public = false, retention_days = 2557, cors = false } # 7 years
    backups           = { public = false, retention_days = 90,  cors = false }
  }
}

module "buckets" {
  for_each       = local.buckets
  source         = "../../modules/storage-bucket"
  name           = each.key
  project_ref    = module.cloud_project.ref
  public         = each.value.public
  retention_days = each.value.retention_days
  cors_enabled   = each.value.cors
  tags = {
    env     = "prod"
    owner   = "platform"
    managed = "terraform"
  }
}
```

**Module contract** must enforce:
- `public = true` ⇒ no PUT from anonymous; reads only via CDN.
- `retention_days > 0` ⇒ lifecycle rule that deletes objects older than N days.
- Object-lock (immutability) on `audit-archive` and `backups` — required by compliance.
- Block-public-policy = true on every private bucket (defence in depth).

---

## 5. Cron — scheduled functions

Cron job definitions are canonical in `08-cron.md`. Each row in that table maps to one `module "cron_job"` invocation. Per-job timezone column (F-M20 closure) is honoured via the `timezone` variable.

```hcl
# envs/prod/cron.tf

module "cron_purge_trash" {
  source       = "../../modules/cron-job"
  name         = "purge-trash"
  schedule     = "0 3 * * *"          # 03:00 daily
  timezone     = "UTC"                # F-M20 lock
  function_ref = "trash_purger"       # edge function name
  project_ref  = module.cloud_project.ref
  alert_on_failure = true
  max_runtime_seconds = 600
}

module "cron_dunning" {
  source       = "../../modules/cron-job"
  name         = "dunning-retry"
  schedule     = "*/15 * * * *"
  timezone     = "UTC"
  function_ref = "dunning_runner"
  project_ref  = module.cloud_project.ref
  alert_on_failure = true
  max_runtime_seconds = 120
}

module "cron_share_expiry" {
  source       = "../../modules/cron-job"
  name         = "share-expiry"
  schedule     = "0 * * * *"          # hourly
  timezone     = "UTC"
  function_ref = "share_expiry_sweeper"
  project_ref  = module.cloud_project.ref
  alert_on_failure = true
  max_runtime_seconds = 60
}
```

**Module contract**:
- `schedule` is standard cron (5 fields). Seconds and 6-field cron are forbidden — Postgres `pg_cron` semantics.
- `timezone` is an IANA name (e.g. `UTC`, `Europe/Berlin`). Defaults to `UTC` if omitted.
- `alert_on_failure = true` wires to `10-observability.md` alerting.
- `max_runtime_seconds` enforces a hard ceiling; jobs that exceed it are killed and alerted.

---

## 6. DNS, SSL, CDN

DNS lives in Cloudflare; SSL is auto-provisioned at the edge. Custom domains for Team plan customers are added by an internal admin endpoint that calls Terraform Cloud's run-trigger API — never via dashboard clicks.

```hcl
# envs/prod/dns.tf

module "dns_apex" {
  source       = "../../modules/dns-zone"
  zone         = "letsmarknow.com"
  account_id   = var.cloudflare_account_id
  records = [
    { name = "@",    type = "A",     value = "1.2.3.4",            proxied = true  },
    { name = "app",  type = "CNAME", value = "lovable.app.",       proxied = true  },
    { name = "api",  type = "CNAME", value = "cloud.lovable.app.", proxied = true  },
    { name = "docs", type = "CNAME", value = "lovable.app.",       proxied = true  },
    { name = "@",    type = "MX",    value = "10 mx.resend.com.",  proxied = false },
    { name = "@",    type = "TXT",   value = "v=spf1 include:_spf.resend.com -all", proxied = false },
  ]
  hsts_enabled         = true
  hsts_max_age_seconds = 31536000
  always_use_https     = true
  min_tls_version      = "1.3"        # Locked rule from readme.md
}
```

---

## 7. CI / drift detection

CI rules (referenced from `09-ci-cd.md`):

1. **`terraform fmt -check`** + **`tflint`** + **`tfsec`** + **OPA policy bundle** run on every PR that touches `infra/`.
2. **`terraform plan`** runs against the affected env workspace; the plan is posted as a PR comment and uploaded as an artefact.
3. **Apply** runs only after merge to `main`, gated on the same plan SHA.
4. **Drift check** is a workflow `infra-drift.yml` running hourly via GitHub Actions cron in prod. It runs `terraform plan -detailed-exitcode`; exit code `2` (drift) opens a Linear ticket tagged `infra-drift` and pings on-call.
5. **Cost diff** via `infracost` runs on every PR; large deltas (>USD 50/month) require an additional approval (cost ceiling lock — `readme.md`).

---

## 8. Pulumi alternate (TypeScript)

Repositories that prefer Pulumi must mirror the same module boundaries. Example for the cron-job module call:

```ts
// envs/prod/cron.ts
import { CronJob } from "../../modules/cron-job";

new CronJob("purge-trash", {
  schedule: "0 3 * * *",
  timezone: "UTC",
  functionRef: "trash_purger",
  projectRef: cloudProject.ref,
  alertOnFailure: true,
  maxRuntimeSeconds: 600,
});
```

State backend uses Pulumi Cloud (preferred) with a passphrase from the secrets vault. Stack names are `letsmarknow/<env>`. `pulumi preview` is the equivalent gate to `terraform plan`.

---

## 9. Importing existing resources

When a resource exists in prod but not in IaC:

1. Open a P1 ticket tagged `infra-import`.
2. Within 5 working days: write the module call, run `terraform import`, run `plan`, confirm zero diff.
3. Merge with the `infra-change` label. The drift check from §7 stays green.
4. Document the import event in the PR description.

---

## 10. Disaster recovery hooks

- **Backup restore drill** runs monthly (`08-cron.md` row `dr-restore-drill`); restores latest prod snapshot to a throwaway staging-shadow env. Pass criterion: app boots and reads/writes succeed within RTO ≤ 4 h. Failure pages on-call.
- **State recovery.** If Terraform state is lost: re-bootstrap from S3 versioning (state bucket has versioning + MFA-delete).
- **Provider compromise.** If a provider token leaks: rotate via vault, run `terraform plan` to detect any resources we no longer own, run `apply` to re-converge.

---

## 11. Cross-references

- Hosting topology this provisions: `01-hosting.md`
- Environments matrix: `02-environments.md`
- Env vars consumed by modules: `03-env-vars.md`
- Secrets vault: `04-secrets.md`
- Domains & SSL: `05-domains-ssl.md`
- CDN & storage canonical: `06-cdn-storage.md`, `12-storage-layout.md`
- Queues (provisioned similarly via `module "queue"` — see `07-queues.md`): `07-queues.md`
- Cron table: `08-cron.md`
- CI/CD pipeline integration: `09-ci-cd.md`
- Observability hooks for drift alerts: `10-observability.md`
- Email provider DNS records: `11-email-provider.md`
