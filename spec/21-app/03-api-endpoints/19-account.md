# 19 — Account-scoped endpoints

> **Purpose.** API contracts for endpoints scoped to the **Account** (the human, not the Org). All paths live under `/v1/account/*` or `/v1/me/*` and require a bearer token but **no** `X-Organization-Id` header.
>
> Index parent: `00-overview.md`. Conventions: `01-conventions.md`.

---

## 1. Scope

- `/v1/account/*` — mutations on the Account record itself (preferences, profile fields).
- `/v1/me/*` — read or trigger jobs that aggregate across every Org the Account belongs to (entitlements, GDPR export).

Both are **Account-scoped, not Org-scoped**. The active Org header is *ignored* on these routes.

---

## 2. Endpoints

### Update account preferences
`PATCH /v1/account/preferences`

**Auth:** bearer
**Headers:** `If-Match: <updated_at>` (optimistic concurrency)
**Idempotency-Key:** optional

**Request** (all fields optional; partial-merge semantics)
```json
{
  "default_view": "list" | "grid" | "compact" | "mindmap" | "column",
  "theme": "system" | "light" | "dark",
  "locale": "en-US",
  "timezone": "Asia/Kuala_Lumpur",
  "layout": {
    "sidebar_width_px": 280,
    "right_pane_width_px": 360,
    "section_heights_px": { "starred": 200, "recent": 240 }
  },
  "keyboard_layout": "qwerty" | "dvorak" | "colemak",
  "notifications": {
    "email_digest": "off" | "daily" | "weekly",
    "in_app": true
  },
  "experiments": { "<flag_key>": true | false }
}
```

**Response 200**
```json
{ "data": { "preferences": { ... }, "updated_at": "2026-04-20T08:00:00Z" } }
```

**Errors**
- `409 conflict_optimistic` — `If-Match` mismatch.
- `422 invalid_preference_key` — unknown key (additive: server ignores rather than 422 unless schema-locked).

**Rate limit:** `write` class (200/min).

**Cross-references:**
- `15-visualization/06-resizable-sections.md` — debounced 2s sync of pane widths.
- `15-visualization/readme.md` — `default_view` field.
- `02-data-model/11-account.md §preferences` — schema source-of-truth.

---

### Trigger GDPR export
`POST /v1/me/gdpr-export`

**Auth:** bearer **+ recent re-auth** (password or WebAuthn within 5 min — see `09-auth-accounts/10-device-and-security.md §re-auth`).
**Idempotency-Key:** auto-set server-side to one job per Account per 24 h (prevents abuse).

**Request** (optional)
```json
{
  "destination_email": "alt@example.com",
  "include_orgs": ["uuid-1", "uuid-2"]
}
```
- `destination_email` defaults to the Account's verified primary email.
- `include_orgs` defaults to all Orgs where the Account is Owner. Orgs where the Account is non-Owner can only be exported via the Org-scoped `POST /v1/organizations/:id/data-export`.

**Response 202**
```json
{ "data": { "request_id": "01J...", "eta_hours": 24 } }
```

**Side effects**
- Enqueues background job per `11-import-export/09-gdpr-export.md §4`.
- Audit event `account.gdpr_export.requested`.
- Email confirmation to primary address.

**Errors**
- `409 export_in_progress` — open job within 24 h window; returns existing `request_id`.
- `403 reauth_required` — re-auth older than 5 min.

**Rate limit:** `auth` class (3 / 24h per Account, hard cap).

**Cross-references:**
- `11-import-export/09-gdpr-export.md` — full job spec, packaging, delivery.
- `19-security-privacy/04-gdpr-ccpa.md` — regulatory alignment.

---

## 3. Related (declared elsewhere)

- `GET /v1/me/entitlements` → declared in `16-licenses.md`. Aggregates entitlements across Orgs.
- `GET /v1/auth/sessions` → declared in `03-auth.md §sessions`. Per-Account sessions list.
- `GET /v1/auth/verify` → declared in `03-auth.md`. Email verification.
