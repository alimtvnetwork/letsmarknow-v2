# Account Deletion

How users delete their Account, with grace, GDPR export, and cleanup.

---

## 1. Entry point

`/me/security/delete` — clearly labeled, not hidden under "danger zone" buried navigation.

## 2. Pre-flight checks

Before allowing deletion:
- If user is sole Owner of any Team Org with other Members → must transfer or delete those Orgs first; UI lists blockers with one-click resolution links.
- If user has unpaid invoices on a Team Org as Billing role → must settle or transfer.
- Re-auth required (password or OAuth re-confirm).
- Optional: enter MFA code if MFA enabled.

## 3. Soft delete (30-day grace)

1. Confirmation modal: type "delete my account" + click button.
2. Server sets `account.deleted_at = now()`.
3. Personal Org marked `deleted_at = now()` (cascades to Spaces, Collections, etc., as soft).
4. All sessions revoked; refresh cookies cleared.
5. All Shares the user owns auto-revoked.
6. Memberships in other Orgs: `removed_at = now()` for each.
7. Email confirmation sent: "Your account is scheduled for deletion on <date>. Sign in before then to cancel."
8. During grace:
   - Sign-in possible → restoration flow offered ("Cancel deletion" CTA).
   - Otherwise no access; emails to address bounce a clear "scheduled for deletion" notice.

## 4. Hard delete (after 30 days)

Background job runs daily:
1. For each `Account` with `deleted_at < now() - 30d`:
   - Hard-delete `Account` row.
   - Hard-delete Personal Org + all child entities.
   - Anonymize references in foreign Orgs:
     - `created_by` → `null` (display "Deleted user").
     - Comments retained with author label "Deleted user".
     - Audit log retained with `actor_account_id` preserved (legal/compliance) but `actor_email` cleared.
   - Delete OAuth links, sessions, MFA secrets.
   - Delete `share_view` rows referencing the Account.
   - Delete personal stars, prefs, notification settings.
2. Idempotent; resumable.

## 5. GDPR / data export

- "Download my data" button at `/me/security/export`.
- Async job; ZIP delivered via signed URL (24h TTL); also email when ready.
- Contents:
  - `account.json` — profile, prefs.
  - `orgs/<id>/spaces.json`, `collections.json`, `groups.json`, `items.json`, `tags.json`, `notes.md` — for each Org user has membership in (only data they have access to).
  - `comments.json` — comments authored by user.
  - `audit_log.json` — Owner/Admin only.
  - `README.md` — schema description.
- Format: JSON + Markdown for notes (human-readable + machine-readable).
- Available regardless of deletion status.

## 6. Right to rectification

- All profile fields editable from `/me/profile`.
- Email change requires verification of new address (`email-verification.md`).
- Display name change immediate; propagates to UI on next render.

## 7. Org deletion (Owner action)

- Mirrors account deletion at Org level.
- Owner only; Admin cannot delete.
- All Members notified by email + inbox.
- 30-day grace; restoration possible by Owner.
- After 30 d: hard-delete Org + cascade.

## 8. Restoration

- During grace, sign-in flow offers "Restore account?" — single click.
- Restoration:
  - Clears `deleted_at` on Account, Personal Org, cascaded entities.
  - Memberships in other Orgs NOT auto-restored (Owners must re-invite).
  - Re-issues sessions on next sign-in.

## 9. Notifications

- Deletion scheduled (immediate email + inbox).
- 7 days before hard delete (email reminder).
- 24 hours before hard delete (final email).
- After hard delete (no email; address may not exist).
- Restoration confirmation email.

## 10. Telemetry

- `account.deletion_requested`
- `account.deletion_canceled` `{ days_into_grace }`
- `account.hard_deleted`
- `account.export_requested` / `_delivered`
- `account.export_failed` `{ reason }`

## 11. Anti-abuse

- Rate limit deletion requests: 1 per Account per hour.
- Re-auth required to prevent CSRF / session-hijack abuse.
- Hard delete cannot be triggered by API; only the background job after grace.

## 12. Audit

- All deletion-related actions logged to audit log (Team Orgs).
- For Personal Org, internal compliance log retained 1 year.

## 13. Edge cases

| Case | Behavior |
|---|---|
| Account deleted while exports pending | Exports completed if started; signed URL still valid for 24 h |
| Account deleted while comments referenced in shares | Comments shown as "Deleted user" |
| Re-signup with same email after hard delete | New Account; no carryover (data was destroyed) |
| Org transfer pending when Owner deletes | Transfer auto-cancelled; Owner must transfer first |
| Lifetime license holder deletes Account | License also voided; not transferable post-deletion |

## 14. Tests

- Pre-flight blocker enforcement.
- Soft delete cascade correctness.
- Restoration during grace.
- Hard delete job idempotency + cascade.
- Export schema fidelity.
- Anonymization in foreign Orgs (no PII leak).
