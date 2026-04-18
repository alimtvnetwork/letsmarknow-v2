# Shares Endpoints (Management)

Create/edit/revoke shares for Space, Collection, Group, or Item. Public viewer endpoints live in `public-share-viewer.md`.

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
