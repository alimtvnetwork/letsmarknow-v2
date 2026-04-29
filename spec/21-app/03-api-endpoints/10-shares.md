# Shares Endpoints (Management)

Create/edit/revoke shares for Space, Collection, Group, or Item. Public viewer endpoints live in `02-public-share-viewer.md`.

All management endpoints require bearer auth + `X-Organization-Id`.

---

### List shares for an entity
`GET /v1/shares`

**Query params** (exactly one target required)
- `space_id` | `collection_id` | `group_id` | `item_id`
- `include_revoked` (bool, default false)

**Response 200**
```json
{
  "data": [
    {
      "id": "01J...",
      "slug": "my-gear",
      "target_type": "collection",
      "target_id": "01J...",
      "organization_id": "01J...",
      "mode": "public",
      "created_by": "01J...",
      "title_override": null,
      "description_override": null,
      "expires_at": null,
      "allow_clone_to_my_account": true,
      "show_branding": true,
      "analytics_enabled": true,
      "default_view_mode": "grid",
      "password_set": false,
      "allowed_emails": [],
      "view_count": 142,
      "unique_viewer_count": 38,
      "click_count": 76,
      "revoked_at": null,
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

---

### Create share
`POST /v1/shares`

**Auth:** Editor+
**Idempotent:** Idempotency-Key

**Request body**
```json
{
  "target_type": "collection",
  "target_id": "01J...",
  "mode": "public",
  "slug": null,
  "title_override": null,
  "description_override": null,
  "expires_at": null,
  "password": null,
  "allowed_emails": [],
  "allow_clone_to_my_account": true,
  "show_branding": true,
  "analytics_enabled": true,
  "default_view_mode": "grid"
}
```

- `mode`: `"public" | "password" | "invite_only"`
- `slug`: null → server generates random short slug (8 chars). Custom slug requires entitlement.
- `password`: required when `mode="password"`; min 6 chars; stored as bcrypt.
- `allowed_emails`: required when `mode="invite_only"`; max 100 in v1.

**Response 201** Full Share + computed URL:
```json
{
  "data": {
    "id": "01J...",
    "slug": "my-gear",
    "url": "https://letsmarknow.com/t/my-gear",
    "...": "..."
  }
}
```

**Errors**
- `403 ENTITLEMENT_REQUIRED` — `details.required_entitlement="custom_share_slug"` or `"password_share"` etc.
- `409 CONFLICT` `details.reason="slug_taken"`
- `409 LIMIT_REACHED` — Free tier active-share cap

---

### Get share
`GET /v1/shares/:id`

---

### Update share
`PATCH /v1/shares/:id`
**If-Match:** required
**Body**: any subset of mutable fields. To rotate password: `{ "password": "newpass" }`. To remove password (downgrade to public): `{ "mode": "public", "password": null }`.

---

### Rotate slug
`POST /v1/shares/:id/rotate-slug`
**Body** `{ "new_slug": null }` (null = random)
**Response 200** Full Share with new `slug` and `url`. Old slug returns 410 GONE.

---

### Revoke share
`POST /v1/shares/:id/revoke`
**Response 200** Full Share with `revoked_at` set.
After revoke: `/t/{slug}` returns `410 GONE`. Cookie sessions invalidated.

---

### Restore (un-revoke) share
`POST /v1/shares/:id/restore`
Allowed within 7 days of revoke; same slug restored.

---

### Get share analytics
`GET /v1/shares/:id/analytics`

**Query**
- `range` (`24h` | `7d` | `30d` | `all`, default `30d`)

**Response 200**
```json
{
  "data": {
    "range": "30d",
    "view_count": 142,
    "unique_viewer_count": 38,
    "click_count": 76,
    "top_items": [
      { "item_id": "01J...", "title": "ChatGPT", "clicks": 19 }
    ],
    "by_day": [
      { "date": "2026-04-01", "views": 4, "clicks": 2 }
    ],
    "top_referrers": [
      { "host": "twitter.com", "views": 22 }
    ]
  }
}
```

**Errors**
- `403 ENTITLEMENT_REQUIRED` — analytics requires Pro+

---

### Resend invite emails (invite-only mode)
`POST /v1/shares/:id/invites/resend`
**Body** `{ "emails": ["a@example.com"] }` (empty array → resend to all)
**Response 202** `{ data: { sent: 3 } }`

---

### Hard-delete (purge) a share
`POST /v1/shares/:id/purge`

**Auth:** bearer + `X-Organization-Id` + role(owner/admin) + recent re-auth (5 min)
**Idempotent:** yes (re-calling on already-purged share returns 200 with `{ already_purged: true }`)

> **Why this exists.** `POST /v1/shares/:id/revoke` disables the share but preserves analytics for up to 90 days (`08-sharing-collab/12-revocation-and-expiry.md §95`). `POST /v1/shares/:id/purge` skips the 90-day grace and immediately destroys the share record, all viewer analytics rows, and any associated invite-mode email allowlist.

**Request body** (required for confirmation)
```json
{ "confirm_slug": "my-gear" }
```
- `confirm_slug` MUST equal the current slug; prevents accidental purge from stale UI.

**Response 200**
```json
{
  "data": {
    "share_id": "01J...",
    "slug_at_purge": "my-gear",
    "purged_at": "2026-04-20T08:30:00Z",
    "analytics_rows_deleted": 142,
    "invite_emails_deleted": 3
  }
}
```

**Side effects**
- Share row deleted (not soft-delete; cannot be restored).
- Slug returned to the global pool after 30 days.
- Audit event `share.purged` written.
- Public viewer hits return `404 NOT_FOUND` (not `410 GONE`, since record is gone).

**Errors**
- `400 VALIDATION_FAILED` — `confirm_slug` mismatch.
- `403 FORBIDDEN` — role insufficient OR re-auth older than 5 min.
- `409 CONFLICT` — share is currently in `restoring` state from a recent un-revoke.

---

### Revoke a single share-link (v2 multi-link)
`POST /v1/shares/links/:id/revoke`

> **Status:** declared in P0 spec for forward-compatibility. **Emitter ships when the v2 multi-link share model lands** (planned design note in `08-sharing-collab/`, deliberately unauthored — Share v1 is single-table per the locked memory rule). Until then, server returns `403 FEATURE_NOT_AVAILABLE`.

In v1, one Share has one slug. In v2, a Share owns N independently revocable Links (different slugs, different perms, different expiries). This endpoint revokes one Link without affecting siblings.

**Auth:** bearer + `X-Organization-Id` + role(owner/admin) (or the Account that created the Link)

**Path params**
- `id` — `share_link.id`, NOT `share.id`. The owning share is resolved server-side.

**Request body** (optional)
```json
{ "reason": "leaked-on-twitter" }
```

**Response 200**
```json
{
  "data": {
    "link_id": "01J...",
    "share_id": "01J...",
    "slug": "my-gear-marketing",
    "revoked_at": "2026-04-20T08:30:00Z",
    "siblings_remaining": 2
  }
}
```

**Side effects**
- Link's slug returns `410 GONE` to viewers.
- Cookie sessions tied to that slug invalidated.
- Audit event `share.link.revoked`.
- Sibling links continue working.

**Errors**
- `403 FEATURE_NOT_AVAILABLE` — v2 multi-link not yet shipped.
- `404 NOT_FOUND` — link does not exist or not visible to active Org.
- `409 CONFLICT` — link already revoked.

