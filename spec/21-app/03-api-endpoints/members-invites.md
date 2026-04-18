# Members & Invites Endpoints

Org membership: list/invite/accept/role-change/remove. Plus pending invite management.

All require bearer auth + `X-Organization-Id` (except invite acceptance, which uses the invite token).

---

### List members
`GET /v1/members`

**Query**
- `include_pending` (bool, default true) — include not-yet-accepted invites
- `role` (csv: `owner,admin,editor,viewer,billing`)
- `q` (string) — name/email substring
- `sort` (`-last_active_at` default; also `name`, `created_at`)
- `limit`, `cursor`

**Response 200**
```json
{
  "data": [
    {
      "id": "01J...",
      "organization_id": "01J...",
      "account_id": "01J...",
      "email": "alim@example.com",
      "name": "Alim Ul Karim",
      "avatar_url": null,
      "role": "owner",
      "status": "active",
      "invited_by": null,
      "invited_at": null,
      "joined_at": "2026-04-10T...",
      "last_active_at": "2026-04-18T...",
      "two_factor_enabled": true,
      "created_at": "...",
      "updated_at": "..."
    },
    {
      "id": "01J...",
      "account_id": null,
      "email": "sara@example.com",
      "name": null,
      "role": "editor",
      "status": "pending",
      "invited_by": "01J...",
      "invited_at": "2026-04-15T...",
      "invite_expires_at": "2026-04-22T...",
      "joined_at": null
    }
  ]
}
```

---

### Get member
`GET /v1/members/:id`

---

### Invite member(s)
`POST /v1/members/invites`

**Auth:** Owner or Admin
**Idempotent:** Idempotency-Key

**Request body**
```json
{
  "invites": [
    { "email": "sara@example.com", "role": "editor", "message": "Welcome!" },
    { "email": "joe@example.com", "role": "viewer" }
  ],
  "default_space_ids": ["01J..."]
}
```
- Max 50 invites per call.
- `role`: `admin | editor | viewer | billing`. Cannot invite as `owner`.

**Response 207**
```json
{
  "data": {
    "results": [
      { "index": 0, "status": 201, "member_id": "01J...", "invite_token": "lmn-iv-..." },
      { "index": 1, "status": 409, "error": { "code": "CONFLICT", "details": { "reason": "already_member" } } }
    ]
  }
}
```

**Errors**
- `403 ENTITLEMENT_REQUIRED` — seat cap exceeded; `details.seats_used`, `details.seats`, `details.required_entitlement="seat"`
- `403 FORBIDDEN` — caller not Owner/Admin

---

### Resend invite
`POST /v1/members/:id/invite/resend`
**Response 202** `{ data: { sent: true, invite_expires_at: "..." } }`

---

### Cancel pending invite
`DELETE /v1/members/:id/invite`
**Auth:** Owner or Admin
**Response 204**

---

### Accept invite (uses invite token, NOT bearer)
`POST /v1/members/invites/accept`

**Auth:** none (uses invite token); or bearer if signed-in account email matches
**Request body**
```json
{ "token": "lmn-iv-..." }
```
**Response 200**
```json
{
  "data": {
    "organization_id": "01J...",
    "member_id": "01J...",
    "role": "editor",
    "requires_signup": false,
    "access_token": "eyJ...",
    "expires_in": 900
  }
}
```
- If `requires_signup=true`, the email is not yet an Account → client must call `/v1/auth/signup` with the same `invite_token` to bind.

**Errors**
- `400 VALIDATION_FAILED` — malformed token
- `410 GONE` — invite expired or canceled
- `409 CONFLICT` — already a member

---

### Decline invite
`POST /v1/members/invites/decline`
**Body** `{ "token": "lmn-iv-..." }`
**Response 204**

---

### Change role
`PATCH /v1/members/:id`
**Auth:** Owner or Admin (Admins cannot create Owners or modify Owners)
**If-Match:** required
**Body**
```json
{ "role": "admin" }
```
**Errors**
- `422 BUSINESS_RULE_VIOLATION` `details.reason="last_owner"` — cannot demote sole Owner
- `403 FORBIDDEN` — Admin trying to modify Owner

---

### Remove member
`DELETE /v1/members/:id`
**Auth:** Owner or Admin
**Body**
```json
{ "transfer_assets_to_account_id": null }
```
- Items, Collections, etc. are owned by Org, not the Member, so removal is non-destructive.
- `transfer_assets_to_account_id` reassigns `created_by` historically — optional; defaults to keeping `created_by` for audit.
**Response 204**

**Errors**
- `422 BUSINESS_RULE_VIOLATION` `details.reason="last_owner"`

---

### Leave organization (self)
`POST /v1/members/me/leave`
**Body** `{ "current_password": "..." }`
**Response 204**
**Errors**
- `422 BUSINESS_RULE_VIOLATION` `details.reason="last_owner"` — must transfer ownership first
- `422 BUSINESS_RULE_VIOLATION` `details.reason="only_organization"` — cannot leave your only Org; delete it instead

---

### Resend my own access token after role change
`POST /v1/members/me/refresh-entitlements`
**Response 200** `{ data: { access_token, expires_in, entitlements_hash } }`
Useful when an Admin promoted/demoted you while you were online.
