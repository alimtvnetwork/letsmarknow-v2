# GDPR Export

Full Account data export for legal compliance (GDPR Art. 15 / CCPA equivalent).

---

## 1. Scope

Includes EVERYTHING associated with the Account:
- Profile data.
- All Orgs the Account owns (full data).
- Orgs the Account is a Member of (Member's view of data only).
- Auth data: sessions, devices, login history.
- Billing: invoices, subscriptions, payment method (last 4 only — no PAN).
- Audit log entries authored by Account.
- Telemetry events attributed to Account (last 90 days only — older is anonymized).
- Inbound email-in events.
- API tokens (metadata only — secrets cannot be exported).
- Notifications (in-app inbox).

## 2. Excludes

- Other Accounts' personal data (in shared Orgs, only IDs + display names).
- Server logs (separate IT process).
- Backups (legal retention; users can request explicit deletion).
- ML model weights (anonymized; no individual extraction possible).

## 3. Request flow

`/settings/privacy/data-export`:
1. User clicks "Request my data".
2. Re-auth required (password / WebAuthn).
3. Confirms email destination.
4. Job enqueued; UI shows "We'll email you within 24 hours".

`POST /v1/me/gdpr-export`:
- Idempotency-Key auto-set per Account per 24h (prevents abuse).
- Returns `{ request_id, eta_hours: 24 }`.

## 4. Generation

Background job:
1. Snapshots all Account-related data into staging area.
2. Renders to:
   - **`account.json`** — profile, settings, sessions, devices, login history.
   - **`organizations/<org_slug>/`** — per-Org bundle (LMN JSON + Markdown bundle).
   - **`billing.json`** — subscriptions, invoices (with download URLs to processor PDFs).
   - **`audit.json`** — Account-attributed audit events.
   - **`api_tokens.json`** — metadata (no secrets).
   - **`email_in.json`** — historical email-in events.
   - **`README.md`** — explains every file + structure + format reference.
3. Bundled as ZIP.
4. Compressed; signed for integrity.
5. Encrypted with random per-export AES-256 key; key delivered separately to Account email (defense-in-depth against link leak).

### Total budget
- < 24 h end-to-end (regulation: 30 days; we aim for < 24 h).
- Typical Account: < 10 min.

## 5. Delivery

- Email with secure download link (signed URL, valid 7 days).
- Separate email with decryption key.
- In-app inbox notification.
- Re-download possible from `/settings/privacy/data-export` until expiry.

## 6. Frequency limits

- Max 1 GDPR export per Account per 24h.
- Max 4 per Account per 30 days.
- Override available via support ticket for legitimate need.

## 7. Verification

User can verify integrity:
- README includes SHA-256 of each file.
- ZIP itself signed (Ed25519); public key documented at `/legal/data-export-pubkey`.
- Decryption key shipped via separate channel (anti-MITM).

## 8. Format guarantees

- Machine-readable: JSON + LMN JSON.
- Human-readable: Markdown bundle within ZIP.
- Schema versioned; pinned in README.
- Round-trippable: re-import to a fresh Account yields equivalent state (modulo IDs / timestamps).

## 9. Retention

- Generated bundle deleted from object storage at expiry (7 days).
- DB row of `gdpr_exports` retained 2 years (legal record of fulfilled request).
- Audit log entry retained per audit policy.

## 10. Telemetry

- `gdpr.export_requested`
- `gdpr.export_generated` `{ duration_ms, size_bytes }`
- `gdpr.export_delivered`
- `gdpr.export_downloaded` `{ from_email_link }`
- `gdpr.export_expired`
- `gdpr.export_failed` `{ reason }`

## 11. Audit

Every GDPR export logged:
- Account ID
- Request timestamp
- Generation timestamp
- Delivery timestamp
- Download timestamp(s)
- IP of requestor + downloader

## 12. Right-to-be-forgotten interplay

- Linked to Account deletion flow (`09-auth-accounts/08-account-deletion.md`).
- Can request export BEFORE deletion ("download my data first").
- After deletion: 30-day grace window; export still requestable from grace.
- Post-grace: data anonymized; export no longer possible (returns "data deleted" notice).

## 13. Special cases

| Case | Behavior |
|---|---|
| Account is Member of an Org with strict data policy | Export includes only Account's view; Org Owner notified of export request (audit transparency, not approval) |
| Account has lifetime license | Included in `billing.json` |
| Account in middle of large import | Export waits for import completion OR includes snapshot at export-start time |
| Multiple Orgs, very large total data | Bundle split into multi-part ZIP if > 5 GB |
| Account in deletion grace | Export includes data as of grace start |

## 14. Customer support

- Ops dashboard shows pending / completed / failed GDPR exports.
- Failed exports auto-escalate to engineer.
- Manual override for compliance edge cases (e.g., regulator-mandated immediate fulfillment).

## 15. Tests

- Full export of synthetic Account with all data types.
- Round-trip: export → re-import to fresh Account → equivalent state.
- Encryption + decryption verification.
- Signed URL expiry.
- Frequency limit enforcement.
- Generation completes within 24 h for 100k-item Account.
- README references valid for every included file.
