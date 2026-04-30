# Data Handling

Classification, lifecycle, retention, residency, access controls.

---

## 1. Classification

| Class | Examples | Storage |
|---|---|---|
| **Public** | Marketing pages, public share content (when explicitly shared), help docs | CDN, no encryption needed |
| **Internal** | Aggregated metrics, feature flag config | Standard DB, encrypted at rest |
| **Confidential** | User content (items, notes, tags), Org settings, member emails | Encrypted at rest + RLS |
| **Restricted** | Passwords (hashed), MFA secrets, API tokens, payment tokens | Encrypted at rest + KMS-wrapped + access-audited |
| **Critical** | Encryption master keys | KMS only; no plaintext access |

## 2. Lifecycle

```
Create → Active → (Archive | Trash) → Soft delete (30 d) → Hard delete → Backup retained 90 d → Purged
```

Per-class retention:

| Class | Active | Soft delete | Backup | Hard purge |
|---|---|---|---|---|
| User content | Indefinite | 30 d | 90 d | 90 d |
| Audit log | Per-tier (7 d - 7 y) | n/a | 90 d | per tier |
| Analytics raw | 90 d | n/a | n/a | 90 d |
| Analytics aggregated | 2 y | n/a | n/a | 2 y |
| Error reports | 30 d | n/a | n/a | 30 d |
| Sessions | Per session TTL | n/a | n/a | on logout / TTL |
| Payment tokens | While subscription active | 30 d post-cancel | 90 d | 90 d |

## 3. Residency

| Region | Where data lives |
|---|---|
| EU (default; serves EU + UK + Switzerland customers from this region in v1) | Frankfurt + Dublin (multi-AZ) |
| US (opt-in for US-billed Orgs) | Virginia + Oregon |

> **v1 scope (locked Session 56).** Only EU and US regions are offered in v1, matching the public privacy policy `19-security-privacy/07-privacy-policy.md §3`. UK and Switzerland customers are served from the EU region (no separate residency boundary in v1). AU/Sydney and Rest-of-world were spec'd in earlier drafts but are **deferred to v2**; opening any new region requires (a) a new sub-processor row in the policy, (b) a 30-day advance notice, and (c) a residency-migration tool (export → re-import in target region — out of v1 scope).

- Residency declared at Org creation; not migratable post-creation in v1 (would require export/import; planned for v2).
- Backups stay in same region.
- Cross-region access only for support troubleshooting (with user consent).

## 4. Access controls

### Application layer
- Every read/write goes through endpoint with role check.
- Postgres RLS enforces row-level access independent of app code (defense in depth).
- Service-to-service uses signed mTLS or signed JWTs (not shared secrets).

### Infrastructure layer
- Cloud accounts have per-environment isolation (dev / staging / prod).
- Production write access requires:
  - Hardware MFA.
  - Just-in-time temporary credential.
  - Approval from second engineer.
  - Session recording.
- Read-only access for on-call requires same MFA but auto-granted.

### Data layer
- DB superuser disabled in production; only migration tooling has limited DDL.
- Sensitive columns (`password_hash`, `mfa_secret`, `payment_token`) encrypted at app layer with KMS.
- Backup decryption requires separate KMS key.

## 5. Logging & redaction

- App logs structured JSON.
- PII fields auto-redacted by middleware: `email` → hash, `password` → never logged, `note`/`title` → never logged.
- Linter scans log statements in CI.
- Logs retained 30 d hot, 1 y cold.
- Access audited.

## 6. Data subject requests

| Request | SLA | Mechanism |
|---|---|---|
| Access (export) | 7 d (legal max 30) | Self-service via `/account/export` |
| Rectification | Immediate | Edit in app |
| Deletion (right to erasure) | 30 d | `/account/delete` (with grace period) |
| Restriction | Immediate | Org settings → suspend membership |
| Portability | 7 d | Same as access; format documented |
| Objection | Case-by-case | privacy@letsmarknow.com |

DSR portal also at `privacy.letsmarknow.com` for non-account holders (e.g., share recipients whose email was logged).

## 7. Sub-processors

> **Single source of truth:** `19-security-privacy/07-privacy-policy.md §3`. To prevent drift, this section deliberately does NOT mirror the table — see the policy for the authoritative list. Engineering implications (which sub-processor backs which capability) are cross-referenced from the locked infra files (e.g. Resend in `22-infrastructure/11-email-provider.md`, Stripe in `10-licensing-billing/`).

Public list mirrored at `letsmarknow.com/legal/subprocessors`. Adding a sub-processor requires: updating `07-privacy-policy.md §3`, publishing 30-day advance notice, and updating the deployed policy. Each sub-processor has a DPA in place.


## 8. Backup strategy

- Continuous WAL streaming to encrypted S3.
- Snapshot daily; retained 90 d.
- Cross-region replicas (same residency boundary).
- Quarterly restore drills with documented RTO/RPO.
  - RTO: 4 h.
  - RPO: 5 min.

## 9. Retention enforcement

- Cron jobs purge data per retention table:
  - Trash > 30 d → hard delete.
  - Audit > tier limit → archive cold or delete.
  - Analytics raw > 90 d → delete.
  - Sessions > TTL → delete.
- Job results audit-logged (counts; no row data).

## 10. Telemetry

- `data.dsr_received` `{ kind }`
- `data.dsr_completed` `{ kind, days_to_complete }`
- `data.retention_purge_run` `{ kind, rows_deleted }`
- `data.backup_drill_completed` `{ rto_minutes }`

## 11. Edge cases

| Case | Behavior |
|---|---|
| User in restricted country (e.g. embargoed) | Account creation blocked at signup; existing accounts read-only with notice |
| Org changes residency request | Treated as full migration: export + new Org in target region + manual import |
| Data subject is in shared content of others | Erasure removes their PII (comments, member entry); content authored by others retained |
| Backup contains data the user deleted | Retained 90 d for DR; not user-accessible; purged on schedule |
| Court-ordered preservation | Legal hold flag prevents purge; Owner notified unless gag order |

## 12. Tests

- Retention cron correctness across all classes.
- Cross-region access blocked for non-support paths.
- PII redaction in logs (linter + integration test).
- Backup encryption + restore round-trip.
- DSR self-service flows e2e.
- Sub-processor list reflects actual deployed services (CI check).
