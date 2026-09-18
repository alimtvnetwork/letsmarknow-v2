# 16 — Notifications & Updates

How the app tells users about changes — both product news (release notes, what's new) and software updates (extension version, web app revision).

## Reading order

1. `01-in-app-updates-feed.md` — the "What's new" panel inside the app.
2. `02-app-updater.md` — extension auto-update + manual check.
3. `03-release-channels.md` — stable vs beta opt-in.

## Files

| File | Purpose |
|---|---|
| `01-in-app-updates-feed.md` | News feed UX |
| `02-app-updater.md` | Extension + web update mechanics |
| `03-release-channels.md` | Channel definitions + opt-in |

## Locked rules

- **Updates feed is read-only** for users; published by Lovable team.
- **Extension auto-updates by default** via Chrome Web Store (no custom updater required).
- **Two channels:** `stable` (default) and `beta` (opt-in).
- **Web app updates are seamless**: detect new bundle hash → soft prompt to reload (never force-refresh mid-edit).
- **Release notes versioned** by semver; rendered from Markdown.
- **Notification badges** never desensitize — capped at 1 unread badge max for product news.
- **No marketing in update notifications** — feature news only.
