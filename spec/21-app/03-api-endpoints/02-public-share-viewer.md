# Public Share Viewer Endpoints

Unauthenticated (or share-cookie / OAuth-authenticated) endpoints that power `letsmarknow.com/t/{slug}`. These power Persona 3 (public sharer) flows.

> Read `01-conventions.md` first. These endpoints have a different auth model than the rest of the API.

---

### Resolve share by slug
`GET /v1/public/shares/:slug`

**Auth:** none
**Idempotent:** yes
**Rate limit class:** read

**Path params**
- `slug` (slug) — the share slug

**Response 200**
```json
{
  "data": {
    "slug": "my-gear",
    "mode": "public",
    "target_type": "collection",
    "title": "Marketing Improvements",
    "description": "Curated marketing reads.",
    "owner": {
      "organization_name": "Atto Property",
      "avatar_token": "AP",
      "avatar_color": "#e94560",
      "avatar_image_url": null,
      "show_branding": true
    },
    "expires_at": null,
    "requires_password": false,
    "requires_invite_auth": false,
    "allow_clone_to_my_account": true,
    "analytics_enabled": true,
    "meta": {
      "title": null,
      "description": null,
      "image_url": null
    }
  }
}
```

**Errors**
- `404 NOT_FOUND` — slug doesn't exist
- `410 GONE` — share revoked or target deleted
- `410 GONE` with `details.reason="expired"` — past `expires_at`

---

### Unlock password share
`POST /v1/public/shares/:slug/unlock`

**Auth:** none
**Idempotent:** no
**Rate limit class:** auth (per IP, 10/min, with exponential backoff)

**Request body**
```json
{ "password": "hunter2" }
```

**Response 200**
```json
{ "data": { "unlocked": true, "expires_in": 86400 } }
```
Side effect: sets cookie `lmn_share_<slug>=<signed-token>; Max-Age=86400; Secure; HttpOnly; SameSite=Lax`.

**Errors**
- `400 VALIDATION_FAILED` — empty password
- `401 UNAUTHENTICATED` — wrong password (after 5 failures, 60s lockout per IP+slug)
- `404 NOT_FOUND` / `410 GONE`

---

### Get share contents
`GET /v1/public/shares/:slug/contents`

**Auth:** depends on share `mode`:
- `public` → none
- `password` → cookie `lmn_share_<slug>` required
- `invite_only` → bearer token of an Account whose email is in `allowed_emails`

**Idempotent:** yes
**Rate limit class:** read

**Query params**
- `view` (enum: `list`|`grid`|`compact`, default `grid`)
- `expand` (csv: `groups`,`items`,`tags`)

**Response 200**
```json
{
  "data": {
    "slug": "my-gear",
    "target_type": "collection",
    "target": {
      "id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
      "name": "Marketing Improvements",
      "color": "#e94560",
      "icon_emoji": "📈",
      "description": "...",
      "notes": "..."
    },
    "groups": [
      {
        "id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
        "name": "Quick Tools",
        "icon_emoji": "🐤",
        "items": [
          {
            "id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
            "title": "ChatGPT",
            "url": "https://chatgpt.com/",
            "favicon_url": "https://cdn.letsmarknow.com/favicons/...",
            "description": null
          }
        ]
      }
    ],
    "items": [
      { "id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab", "title": "...", "url": "...", "favicon_url": "..." }
    ]
  },
  "page": { "next_cursor": null, "has_more": false, "limit": 200 }
}
```

When `target_type=item`, `target` is the item itself; `groups` and `items` are empty.

**Errors**
- `401 UNAUTHENTICATED` — password not unlocked or invite not signed in
- `403 FORBIDDEN` — invite-only and email not in list
- `404 NOT_FOUND` / `410 GONE`

---

### Track share view (analytics)
`POST /v1/public/shares/:slug/views`

**Auth:** none (best-effort, may be sent with or without share cookie)
**Idempotent:** no (server dedupes by viewer fingerprint within 30 min)
**Rate limit class:** read

**Request body**
```json
{
  "client_id": "anon-fp-...",
  "referrer": "https://twitter.com/...",
  "viewport": { "w": 1440, "h": 900 }
}
```

**Response 204** No body.

Server increments `view_count` and conditionally `unique_viewer_count`.

**Errors**
- silently ignored if `analytics_enabled=false` (returns 204)

---

### Track item click (analytics)
`POST /v1/public/shares/:slug/items/:item_id/clicks`

**Auth:** none
**Idempotent:** no (deduped per `client_id`+`item_id` per 5 min)
**Rate limit class:** read

**Request body**
```json
{ "client_id": "anon-fp-..." }
```

**Response 204** No body.

**Errors**
- `404 NOT_FOUND` if item not in share
- silently ignored if `analytics_enabled=false`

---

### Get share items (paginated subset)
`GET /v1/public/shares/:slug/items`

**Auth:** depends on share `mode` (same as `GET /v1/public/shares/:slug/contents`).
**Idempotent:** yes
**Rate limit class:** read (120/min per slug per IP)

> **Why this exists.** `GET .../contents` returns the full denormalized payload (groups + items) optimized for first paint. `GET .../items` returns a flat, cursor-paginated item list optimized for infinite scroll, embed widgets, and JSON consumers. They are **not interchangeable**.

**Query params**
- `cursor` (opaque)
- `limit` (default 50, max 200)
- `group_id` (uuid) — filter to one group inside the share
- `tag` (slug, repeatable) — filter by tag (only tags exposed by the share)
- `q` (string) — full-text query over title + description
- `sort` (`position` | `created_at_desc` | `title_asc`, default `position`)

**Response 200**
```json
{
  "data": [
    {
      "id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
      "title": "ChatGPT",
      "url": "https://chatgpt.com/",
      "favicon_url": "https://cdn.letsmarknow.com/favicons/...",
      "description": null,
      "tags": ["ai", "tools"],
      "group": { "id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab", "name": "Quick Tools" },
      "position": 0
    }
  ],
  "page": { "next_cursor": "...", "has_more": true, "limit": 50 }
}
```

**Errors**
- `401 UNAUTHENTICATED` / `403 FORBIDDEN` / `404 NOT_FOUND` / `410 GONE` — same semantics as `/contents`.

---

### Post a comment on a share (Phase 2 — collab)
`POST /v1/public/shares/:slug/comments`

> **Status:** declared in P0 spec for forward-compatibility. **Emitter ships in Phase 2** with the comments-and-reactions feature (`08-sharing-collab/07-comments-and-reactions.md`). Until then, server returns `403 FEATURE_NOT_AVAILABLE`.

**Auth:** depends on share `mode` AND `share.allow_comments`:
- `public` + `allow_comments=true` → none (signed display name required in body)
- `password` → cookie `lmn_share_<slug>` + display name
- `invite_only` → bearer + comment authored as the signed-in Account

**Idempotent:** no
**Rate limit class:** write (10/min per slug per IP)

**Request body**
```json
{
  "body": "Great list, thanks!",
  "display_name": "Alim",
  "in_reply_to": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab"
}
```
- `body` — required, max 4000 chars, Markdown subset
- `display_name` — required for `public` mode; ignored otherwise
- `in_reply_to` — optional comment id for threading

**Response 201**
```json
{
  "data": {
    "id": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
    "share_slug": "my-gear",
    "author": { "display_name": "Alim", "account_id": null },
    "body": "Great list, thanks!",
    "in_reply_to": "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
    "created_at": "2026-04-20T08:30:00Z",
    "moderation_state": "pending"
  }
}
```

**Errors**
- `400 VALIDATION_FAILED` — body too long / empty
- `403 FEATURE_NOT_AVAILABLE` — share has `allow_comments=false` OR Phase 2 not yet shipped
- `404 NOT_FOUND` / `410 GONE`
- `429 RATE_LIMITED`

