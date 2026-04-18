# Public Share Viewer Endpoints

Unauthenticated (or share-cookie / OAuth-authenticated) endpoints that power `letsmarknow.com/t/{slug}`. These power Persona 3 (public sharer) flows.

> Read `conventions.md` first. These endpoints have a different auth model than the rest of the API.

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
      "id": "01J...",
      "name": "Marketing Improvements",
      "color": "#e94560",
      "icon_emoji": "📈",
      "description": "...",
      "notes": "..."
    },
    "groups": [
      {
        "id": "01J...",
        "name": "Quick Tools",
        "icon_emoji": "🐤",
        "items": [
          {
            "id": "01J...",
            "title": "ChatGPT",
            "url": "https://chatgpt.com/",
            "favicon_url": "https://cdn.letsmarknow.com/favicons/...",
            "description": null
          }
        ]
      }
    ],
    "items": [
      { "id": "01J...", "title": "...", "url": "...", "favicon_url": "..." }
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
