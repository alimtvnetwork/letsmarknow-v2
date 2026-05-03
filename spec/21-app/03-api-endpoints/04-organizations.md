# Organizations Endpoints

CRUD on Organizations + ownership transfer + theme/avatar + danger-zone.

All endpoints require bearer auth. The `X-Organization-Id` header is NOT required for `list`, `get`, `create`. It IS required for member-scoped queries.

---

### List my organizations
`GET /v1/organizations`

**Auth:** bearer
**Rate limit class:** read

**Response 200**
```json
{
  "data": [
    {
      "id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
      "name": "Personal",
      "slug": "personal",
      "avatar_token": "PE",
      "avatar_color": "#e94560",
      "avatar_image_url": null,
      "theme": "pink",
      "my_role": "owner",
      "subscription_plan": "pro",
      "is_default": true,
      "last_active_at": "2026-04-18T14:22:31.123Z"
    }
  ]
}
```

Sorted by `last_active_at DESC`.

---

### Create organization
`POST /v1/organizations`

**Auth:** bearer
**Idempotent:** with Idempotency-Key
**Rate limit class:** write

**Request body**
```json
{
  "name": "My Sample",
  "theme": "pink",
  "avatar_image_url": null
}
```

**Response 201** Full Organization object (see § Get).
Server-side side effects: creates Owner Member row; creates default Space `My Collections`; emits `organization.created`.

**Errors**
- `409 LIMIT_REACHED` `details.limit_name="max_organizations"` — Account hit Org cap
- `400 VALIDATION_FAILED`

---

### Get organization
`GET /v1/organizations/:id`

**Auth:** bearer (must be Member)
**Rate limit class:** read

**Response 200**
```json
{
  "data": {
    "id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
    "name": "Personal",
    "slug": "personal",
    "avatar_token": "PE",
    "avatar_color": "#e94560",
    "avatar_image_url": null,
    "theme": "pink",
    "description": null,
    "owner_account_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
    "subscription": {
      "plan": "pro",
      "status": "active",
      "seats": 1,
      "seats_used": 1,
      "current_period_end": "2026-05-18T..."
    },
    "default_space_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
    "settings": { /* see Organization.md */ },
    "my_role": "owner",
    "member_count": 1,
    "space_count": 4,
    "created_at": "2026-04-10T...",
    "updated_at": "2026-04-18T..."
  }
}
```

**Errors**
- `404 NOT_FOUND` — not a member or doesn't exist (uniform 404, no enumeration)

---

### Update organization
`PATCH /v1/organizations/:id`

**Auth:** bearer (Owner or Admin)
**Idempotent:** with If-Match
**Rate limit class:** write

**Request body** (all fields optional)
```json
{
  "name": "...",
  "avatar_token": "PE",
  "avatar_color": "#e94560",
  "avatar_image_url": "https://...",
  "theme": "indigo",
  "description": "...",
  "default_space_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
  "settings": { /* partial settings merge */ }
}
```

**Response 200** Full Organization.

**Errors**
- `403 FORBIDDEN` — not Owner/Admin
- `409 STALE_RESOURCE` — If-Match mismatch
- `400 VALIDATION_FAILED` — `slug` is immutable; do not include

---

### Transfer ownership
`POST /v1/organizations/:id/transfer-ownership`

**Auth:** bearer (current Owner only)
**Idempotent:** no
**Rate limit class:** write

**Request body**
```json
{
  "new_owner_account_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
  "current_password": "..."   // re-auth required
}
```

**Response 200** Updated Organization.
Side effects: old Owner becomes Admin; new Owner gets role `owner`; `organization.ownership_transferred` emitted.

**Errors**
- `401 UNAUTHENTICATED` — wrong current password
- `403 FORBIDDEN` — not current Owner
- `422 BUSINESS_RULE_VIOLATION` — new owner is not an active Member

---

### Soft-delete organization
`DELETE /v1/organizations/:id`

**Auth:** bearer (Owner only)
**Idempotent:** yes
**Rate limit class:** write

**Request body**
```json
{
  "current_password": "...",
  "confirm_text": "delete personal"   // must match "delete <name lowercased>"
}
```

**Response 202**
```json
{ "data": { "deleted_at": "2026-04-18T...", "purges_at": "2026-05-18T..." } }
```

**Errors**
- `403 FORBIDDEN` — not Owner
- `422 BUSINESS_RULE_VIOLATION` `details.reason="active_subscription"` — cancel subscription first
- `422 BUSINESS_RULE_VIOLATION` `details.reason="other_members_present"` — remove other Members first

---

### Restore soft-deleted organization
`POST /v1/organizations/:id/restore`

**Auth:** bearer (Owner only, within 30-day grace)
**Response 200** Full Organization.

**Errors**
- `410 GONE` — already hard-deleted

---

### Hard-delete organization (purge now)
`POST /v1/organizations/:id/purge`

**Auth:** bearer (Owner only)
**Request body**
```json
{ "current_password": "...", "confirm_text": "delete personal forever" }
```
**Response 204**
All data deleted permanently; cannot be undone.

---

### Export organization data (GDPR)
`POST /v1/organizations/:id/data-export`

**Auth:** bearer (Owner or Admin)
**Idempotent:** with Idempotency-Key
**Rate limit class:** bulk

**Request body**
```json
{ "format": "json", "include": ["spaces","collections","groups","items","tags","shares","members","history"] }
```
**Response 202**
```json
{
  "data": {
    "export_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
    "status": "queued",
    "estimated_completion_at": "2026-04-18T14:32:00.000Z"
  }
}
```
Polled via `GET /v1/organizations/:id/data-export/:export_id` (declared below).

---

### Get organization data-export status
`GET /v1/organizations/:id/data-export/:export_id`

**Auth:** bearer + `X-Organization-Id` + role(`owner` | `admin`)
**Idempotent:** yes
**Rate limit class:** `read` (60 / min per export)

> **Why this exists separately from the global `GET /v1/exports/:export_id`.** The Org-scoped GDPR export is a regulated data-residency artifact (see `19-security-privacy/04-gdpr-ccpa.md`). It carries an additional `legal_basis`, an audit-log entry, and is restricted to Owner/Admin roles regardless of the global export ACL. Mounting it under `/v1/organizations/:id/...` makes the audit trail unambiguous and prevents leakage via the general-purpose export listing.

**Path params**
- `id` — Organization id (must match `X-Organization-Id`).
- `export_id` — id returned by `POST /v1/organizations/:id/data-export`.

**Response 200**
```json
{
  "data": {
    "export_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
    "organization_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
    "status": "succeeded",
    "format": "json",
    "include": ["spaces","collections","groups","items","tags","shares","members","history"],
    "progress": { "processed": 4123, "total": 4123, "percent": 100 },
    "download_url": "https://uploads.letsmarknow.com/gdpr/0190a4f1-6c5e-7c2a-9b3f-1234567890ab/file?token=...",
    "download_expires_at": "2026-04-27T08:30:00Z",
    "size_bytes": 1843200,
    "sha256": "...",
    "legal_basis": "gdpr_art_15",
    "requested_by_account_id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
    "requested_at": "2026-04-20T08:30:00Z",
    "completed_at": "2026-04-20T08:42:00Z"
  }
}
```

`status` enum: `queued | running | succeeded | failed | expired`.

**Errors**
- `403 FORBIDDEN` — role lacks GDPR-export privilege OR export belongs to another Org
- `404 NOT_FOUND` — export id does not exist for this Org
- `410 GONE` — download URL expired AND object purged (> 30 days); request a new export

See also `11-import-export/09-gdpr-export.md`.
