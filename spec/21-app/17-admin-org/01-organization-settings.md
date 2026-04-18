# Organization Settings

Owner / Admin surface for configuring Org-wide behavior.

---

## 1. Surface

- Route: `/o/{org_slug}/settings`.
- Tabs: General · Branding · Security · Defaults · Integrations · Billing · Danger Zone.
- Only visible to roles ≥ Admin (Billing tab: Owner only; Danger Zone: Owner only).

## 2. General

| Field | Validation |
|---|---|
| Org name | 1-80 chars |
| Org slug | 3-32 chars, `[a-z0-9-]`, unique globally; rename = redirect old slug for 30 days |
| Logo / icon | PNG/JPG/SVG, ≤ 1 MB, square recommended |
| Description | ≤ 280 chars |
| Default timezone | IANA |
| Default language | ISO 639-1; fallback English |

## 3. Branding (Pro+)

- Custom logo on share viewer pages.
- Brand color (single hex; auto-derives accent palette via HSL shifts).
- Favicon override for `letsmarknow.com/o/{slug}/` and shared content viewer.
- Custom subdomain CNAME (Team+): `links.acme.com` → handled per `19-security-privacy/`.

## 4. Security

- **Allowed sign-in methods**: email+password, Google, Apple, SSO (Team+).
- **Require MFA for all members** (Team+).
- **Session timeout**: 1d / 7d / 30d / never (per device).
- **Domain-restricted invites** (Team+): only `@acme.com` emails can join.
- **Restrict to stable channel** (per `03-release-channels.md`).
- **IP allowlist** (Enterprise): CIDR list; outside requests get `403`.
- **Public sharing**: enabled / disabled / Owner-approval-required.
- **Member-created shares default expiry**: never / 7 d / 30 d.
- **Embed widget allowed origins**: domain list.

## 5. Defaults

Per-Org defaults applied to new content:
- New Collection visibility: Private / Org / Public (Org default).
- New Item save target: Inbox / specific Collection / "Last used".
- Tag color palette (palette of 8 colors).
- Default view mode (List / Grid / Compact / Column).
- "Auto-archive after N days" (off by default).

Members can override personally; Org defaults apply when no preference exists.

## 6. Integrations

- Slack: post share/save events to channel (Team+).
- Webhook outbox: HTTPS endpoint + secret for events (per `08-sharing-collab/09-audit-log.md`).
- API tokens: list / revoke (Pro+ for unlimited; Free = 1 token).
- Zapier / Make / n8n: discovery panel only (auth happens at provider).

## 7. Billing tab

- Owner-only.
- Shows current plan, seats used / available, next invoice date, payment method.
- "Upgrade / downgrade" → `/billing/plans`.
- "View invoices" → `/billing/invoices`.
- Detailed spec in `10-licensing-billing/`.

## 8. Danger Zone

- "Transfer ownership" → opens flow (per `02-members-management.md` § 7).
- "Export all Org data" → `05-data-export-delete.md`.
- "Delete this Org" → `05-data-export-delete.md`.

Confirmation requires typing the Org name + Owner password re-entry.

## 9. Save & validation

- Each tab saves independently with optimistic UI.
- Server validates; reverts UI + shows error toast on rejection.
- All changes emit audit log entries (per `04-audit-log.md`).
- Slug rename triggers 301 redirects for old slug; cached 30 days.

## 10. Telemetry

- `org.settings.opened` `{ tab }`
- `org.settings.changed` `{ field }` (value not logged for privacy)
- `org.security.mfa_enforced`
- `org.security.ip_allowlist_changed` `{ entry_count }`
- `org.danger_zone.opened`

## 11. Edge cases

| Case | Behavior |
|---|---|
| Slug taken at submit time | 409 with suggested alternatives |
| Logo > 1 MB | Client-side compress; reject if still over after 80% quality |
| MFA enforcement when some members lack MFA | Grace period 7 days; emails + in-app reminders; then sign-out enforced |
| IP allowlist locks out current admin | "Your current IP is not in this list — add it before saving?" guard |
| Custom domain CNAME not propagated | Setup screen polls every 30 s; "Verify DNS" button |

## 12. Tests

- Slug rename redirects old URL.
- MFA enforcement grace + cutover.
- IP allowlist self-lockout guard.
- Danger Zone confirmation correctness.
- Audit log entry per setting change.
- Branding cascade to share viewer.
