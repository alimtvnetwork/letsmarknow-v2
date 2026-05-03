# Internal Endpoints

> **Scope.** Endpoints that exist for first-party LMN UI surfaces (in-app feedback widget, beta-program reports, crash-uploader) and are NOT part of the public API contract. They live here because they share auth and rate-limit infrastructure with the rest of `/v1/`, but they are intentionally undocumented in the public OpenAPI export.
>
> **Stability.** Endpoints under `/v1/internal/` may change between minor versions without notice. Do NOT use them from third-party integrations.

All require bearer auth (Account scope; Org optional). Rate limit class: `write`.

---

### Submit in-app feedback
`POST /v1/internal/feedback`

**Auth:** bearer (Account; `X-Organization-Id` optional but recorded if present)
**Idempotent:** Idempotency-Key (recommended; prevents duplicate ticket on double-click)
**Rate limit class:** `write` (10 / hour per Account; 30 / hour for users on the beta channel)

> **Why this exists.** The in-app "Send feedback" widget, the beta-program "Report a bug" sheet (`16-notifications-updates/03-release-channels.md §55`), and the crash-uploader all post here. The server creates a support ticket in the configured help-desk system (Plain / Linear / Zendesk depending on `category`) and tags it with the route/version/user-agent so support engineers do not have to ask follow-ups for basic context.

**Request body**
```json
{
  "category": "bug",
  "subject": "Drag and drop fails in column view",
  "body": "Steps:\n1. ...\n2. ...\nExpected: ...\nActual: ...",
  "context": {
    "route": "/space/0190a4f1-6c5e-7c2a-9b3f-1234567890ab/collection/0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
    "client_version": "1.4.2",
    "user_agent": "Mozilla/5.0 ...",
    "viewport": { "w": 1440, "h": 900 },
    "locale": "en-US",
    "release_channel": "beta",
    "console_log_excerpt": "TypeError: Cannot read property 'id' of undefined\n  at ...",
    "screenshot_attachment_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab"
  },
  "consent": {
    "include_email": true,
    "include_org_name": false
  }
}
```

**Field semantics**
- `category` enum: `bug | feature_request | question | praise | crash | beta_report`.
- `subject` — required, max 200 chars.
- `body` — required, max 10 000 chars, Markdown subset.
- `context.screenshot_attachment_id` — uploaded separately via `POST /v1/internal/feedback/attachments` (returns the id) before this call. Attachments are auto-purged after 90 days if no ticket references them.
- `consent.include_email` — when `false`, the server submits the ticket pseudonymized (`account-<short-hash>@feedback.letsmarknow.com`); the user's real email is NOT shared with the help-desk vendor.
- `consent.include_org_name` — when `false`, only the org **id** is recorded, never the name.

**Response 202**
```json
{
  "data": {
    "feedback_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
    "ticket_id": "PLAIN-04823",
    "ticket_url": "https://app.plain.com/...",
    "submitted_at": "2026-04-20T08:30:00Z",
    "estimated_response_hours": 24
  }
}
```

`ticket_url` is `null` when the user opted into pseudonymized submission AND the help-desk vendor does not support deep-linking unauthenticated.

**Errors**
- `400 VALIDATION_FAILED` — body too long / category invalid.
- `403 FORBIDDEN` — feedback widget disabled for this Org by Owner.
- `502 BAD_GATEWAY` — help-desk vendor unreachable; client should retry with same Idempotency-Key.
