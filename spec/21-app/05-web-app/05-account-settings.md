# Account Settings (`/me/*`)

Per-Account (cross-Org) preferences and security.

---

## 1. `/me/profile`

Fields:
- Avatar (upload or initials tile)
- Display name (1–80 chars)
- Email (read-only here; change via `/me/security`)
- Locale (en, fr, es, de, ja, zh — see `24-i18n-a11y/`)
- Timezone (auto-detected, overridable)
- Default landing page on sign-in (Dashboard / Last Collection / Specific Collection)
- Theme (System / Light / Dark)
- "Show save toasts" toggle (extension)
- "Hover-to-jump on cards" toggle
- "Restart product tour" button

Saves on blur via PATCH `/v1/me`. Optimistic with rollback on error.

## 2. `/me/security`

### 2.1 Change email
- Two-step: enter new email → click verification link sent to NEW address. Old address gets a heads-up email.
- During pending state, sign-in still uses old email.

### 2.2 Change password
- Requires current password.
- Min 12 chars, must pass zxcvbn score ≥ 3.
- Submitting calls `/v1/auth/password/change` → invalidates all other sessions; current session continues.

### 2.3 Multi-factor auth (TOTP)
- "Enable MFA" → enroll via `/v1/auth/mfa/enroll` → QR code + secret + 10 recovery codes.
- After scan + verify code → MFA active.
- "Regenerate recovery codes" → invalidates old set.
- "Disable MFA" → requires current password + current TOTP code (or recovery code).

### 2.4 Sessions / devices
- Lists active sessions from `/v1/auth/sessions`.
- Each row: device, location (city/country from IP), last active, current badge.
- "Revoke" button per row; "Sign out everywhere" at bottom.

### 2.5 OAuth providers
- Connected providers (Google, Apple, GitHub, Microsoft).
- Connect/disconnect (cannot disconnect last sign-in method without setting a password first).

## 3. `/me/notifications`

Email categories (toggle each):
- Account security alerts (force-on; explained as required)
- Member-invite notifications
- Share-comment notifications
- Trial / billing reminders
- Product updates / changelog summary (monthly)
- Marketing tips (off by default)

Push (browser/extension): mirrors above.

Quiet hours: HH:MM range; no notifications during this window.

## 4. `/me/connected`

Apps & services connected to your account: extension installs (each counted; manage = sign out from device).

Future: Zapier, IFTTT, Slack, Notion, Obsidian — see `14-integrations/`.

## 5. `/me/danger`

### 5.1 Export my data (GDPR)
- "Request export" → kicks off `/v1/me/data-export` (account-wide JSON).
- Email when ready (within 24 h); 7-day download window.

### 5.2 Delete account
- Requires current password + typing email address verbatim.
- If user is sole Owner of any Org, blocked with list of Orgs to either delete or transfer first.
- After confirmation: 30-day grace period (account marked `pending_deletion`); user can sign in to cancel.
- After 30 days: hard delete; all owned Orgs deleted; member rows removed from other Orgs (their Items kept under `created_by_deleted_account` synthetic ID for audit, name redacted).

### 5.3 Disable account temporarily
- Sets `disabled_at`; sign-out everywhere; cannot sign in until re-enabled by support email.

## 6. UX rules

- Each setting has a one-line help text below the label.
- Save buttons appear only when fields are dirty; toolbar slides in from bottom on dirty.
- Destructive sections (Danger zone) have red border + double-confirm.
- Concurrent edit on same field by another session: 3-way merge prompt.

## 7. A11y / responsive

- Single-column layout on mobile.
- Tab navigation between sections (`Tab` cycles section headers; arrow keys within).
- All toggles announced via ARIA `switch` role.
