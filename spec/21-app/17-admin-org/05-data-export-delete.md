# Data Export & Delete

Self-service Org-wide data export (GDPR/portability) and Org deletion (with grace period).

> ⚠️ **GDPR / DSR override.** Standard Org deletion has a 30-day reversible grace period. A verified Data Subject Request under GDPR Art. 17 (right to erasure) **bypasses** the grace period and triggers immediate hard-delete of the requesting Account's PII and any Org where they are sole Owner. See `19-security-privacy/04-gdpr-ccpa.md` for the verification flow and precedence chain. The 30-day grace applies only to user-initiated voluntary deletions, not to DSR-initiated deletions.

---

## 1. Export

### Trigger

- Settings → Danger Zone → "Export all Org data".
- Or `POST /v1/organizations/:id/data-export`.

### Scope

Full Org snapshot:
- All Spaces, Collections, Groups, Items.
- All Tags + tag relationships.
- All Members + roles (PII-light: email + name + role only).
- All Shares (incl. revoked, with timestamps).
- All Comments / reactions.
- Audit log (within retention).
- Org settings + branding assets.
- Saved searches, mind-map layouts, view preferences.

### Format

- Single ZIP archive.
- Inside:
  - `manifest.json` — metadata, version, counts, signature.
  - `org.json` — Org row.
  - `members.json` — membership rows.
  - `spaces/`, `collections/`, `groups/`, `items/` — each entity in NDJSON files (1 row per line, sharded by 10k).
  - `assets/` — uploaded images (covers, logos), original filenames preserved.
  - `23-audits/` — NDJSON, monthly files.
  - `README.md` — human-readable schema description + version + restore instructions.

Schema versioned (`schema_version: 1`). Future versions add fields backward-compatibly.

### Pipeline

1. `POST /exports` creates job; returns `export_id`.
2. Background worker streams data → multi-part S3 upload.
3. On complete: signed download URL valid 7 days.
4. Email Owner with download link.
5. In-app banner persists until downloaded or dismissed.

### Performance

| Org size | Target completion |
|---|---|
| < 10k items | < 60 s |
| 10k-100k | < 10 min |
| 100k-1M | < 2 h |
| > 1M | Background; ETA emailed |

### Limits

- 1 export per Org per 24 h (Free / Pro); unlimited (Team+).
- Export size capped at 50 GB; larger Orgs split into multiple parts.

### Re-import

- Same archive can be uploaded to a NEW Org via `POST /v1/imports?from=lmn-export` (with `X-Organization-Id` header set to the destination Org).
- Per-entity ID remapping; original IDs preserved as `legacy_id`.
- Members invited (not auto-joined) — they must accept.
- Import pipeline detailed in `11-import-export/03-import-pipeline.md`.

## 2. Per-Account export (GDPR)

- Different from Org export.
- Accessible at `/account/export`.
- Includes the user's data across all Orgs they belong to:
  - Items they created.
  - Comments they made.
  - Their profile + preferences + sessions.
  - Their personal Org (full export).
- Excluded: data created by others in shared Orgs (handled by those Org's exports).
- Same archive format with `account.json` root.
- Spec'd in `11-import-export/09-gdpr-export.md`.

## 3. Delete Org

### Flow

1. Settings → Danger Zone → "Delete this Org".
2. Confirmation modal:
   - Read consequences (members lose access, content deleted in 30 d, shares revoked immediately).
   - Recommended: trigger an export first ("Export now" button shortcut).
   - Type Org name to confirm.
   - Re-enter Owner password.
   - Optional: feedback survey (why deleting?).
3. Submit → `DELETE /v1/organizations/:id`.
4. Org enters `pending_deletion` state immediately:
   - All members signed out.
   - All API tokens revoked.
   - All shares marked `revoked`; share viewer returns 410 Gone.
   - Org URL returns 410 with "This Org is scheduled for deletion".
5. 30-day grace period.
6. Owner can cancel via emailed link or `/account/orgs/restore` during grace.
7. After 30 days: hard delete cascades through DB + storage; audit purge per retention.

### Notifications

- Owner: email at deletion request, day 7 reminder, day 25 final reminder, day 30 confirmation.
- All Admins / Members: email at request time.
- All external share recipients: NO email (privacy; share just stops working).

### Restore

During grace period: one-click restore. After grace: not possible (data is gone). Backups for disaster recovery only, never user-facing.

### Auth & guardrails

- Owner-only; no delegation.
- Cannot delete Org if active paid subscription unless cancelled first (modal links to billing flow).
- Cannot delete Org if it owns content shared with another Org's members > N (Enterprise) without special unlinking step.

## 4. Per-Account delete

- Settings → Account → "Delete account".
- Triggers per-Account export option, then deletion flow.
- For each Org user is in:
  - Personal Org → deleted with same 30-day grace.
  - Shared Orgs → user removed; their content reassigned to Owner per Org policy (per `02-members-management.md` § 7).
- Auth identity purged after grace (email + password hash gone).
- 30-day reversibility; afterwards permanent.
- Spec linked in `09-auth-accounts/08-account-deletion.md`.

## 5. Hard-delete mechanics

When grace period ends:
- DB: cascade DELETE through all FK chains within transaction.
- Storage: object deletion via S3 multipart batch deletes; verified.
- Search index: delete by `org_id` filter.
- Cache: bust by `org_id` tag.
- Audit log: retained for legal hold per tier (separate retention from Org lifetime).
- Backup tapes: not actively scrubbed; lifecycle policy purges within 90 days.

## 6. Audit log entries

Every deletion action logged:
- `org.deletion_requested` `{ requested_by, reason }`
- `org.deletion_cancelled` `{ cancelled_by }`
- `org.deletion_completed` (system actor)
- `org.export_requested` `{ size_estimate }`
- `org.export_downloaded` `{ ip }`

## 7. Telemetry

- `export.requested` `{ size_estimate, items_count }`
- `export.completed` `{ duration_ms, size_bytes }`
- `export.failed` `{ stage, error }`
- `delete.org_initiated`
- `delete.org_cancelled` `{ days_into_grace }`
- `delete.org_completed`

## 8. Edge cases

| Case | Behavior |
|---|---|
| Export job fails mid-way | Resume from last shard; 3 retry attempts; email failure if all fail |
| Owner deletes Org while another Owner-transfer pending | Block until transfer resolved |
| Owner's payment fails AND Org schedules delete | Grace period extended; deletion paused |
| Re-import into existing Org with conflicts | Conflict resolution options: skip / overwrite / merge per item (UI wizard) |
| Account delete while Org owner of paid Org | Block until ownership transferred or Org deleted |
| Export during MFA challenge | Re-prompt for fresh MFA before generating signed URL |

## 9. Tests

- Round-trip export → import preserves all data + relationships.
- 30-day grace cancel restores Org fully.
- Hard-delete leaves no orphaned rows.
- Signed URL expires at 7 days exactly.
- Owner-payment-failure pauses deletion correctly.
- GDPR per-Account export covers cross-Org data correctly.
- Audit log entries always written even if main action fails (best-effort).
