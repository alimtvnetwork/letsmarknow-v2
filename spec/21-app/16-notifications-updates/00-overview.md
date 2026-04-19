# 00 — Notifications & Updates Folder Overview

> **Purpose.** Define how the product communicates **product updates and version availability** to users — both the in-app changelog/updates feed and the auto-updater for the web app and extension. Channels (stable / beta / canary) and rollout policy are here.

---

## 1. Responsibilities

1. **In-app updates feed.** Changelog surface visible to users; categorised entries; per-Org admin view of operational notices.
2. **App updater.** Web app: SW-driven update prompt. Extension: Chrome Web Store automatic + remote kill switch.
3. **Release channels.** Stable (default), Beta (opt-in), Canary (internal); how a user opts in/out.
4. **Notification cadence.** When to nag, when to badge, when to stay silent.

---

## 2. File-by-file behaviour

| File | Owns |
|---|---|
| `01-in-app-updates-feed.md` | Changelog data model, categories, render rules, per-Org admin notices. |
| `02-app-updater.md` | Web app SW update flow; extension update + kill switch. |
| `03-release-channels.md` | Stable/Beta/Canary definitions; opt-in flow; tag conventions. |

---

## 3. Tasks performed by this folder

- **Publish release notes** to `/changelog` after each prod deploy (referenced by `22-infrastructure/09-ci-cd.md` §2.4).
- **Surface update availability** to users without being annoying (badge + opt-in dismiss).
- **Honor channel choice** when serving updates.
- **Provide the kill-switch path** for in-progress launches via feature flags (`07-features/15-feature-flags-and-rollouts.md`).

---

## 4. What this folder is NOT

- **Not collaboration notifications.** Share invites, comments, mentions live in `08-sharing-collab/08-notifications.md`.
- **Not the email provider.** Provider config is in `22-infrastructure/11-email-provider.md`.

---

## 5. Cross-references

- Deploy → changelog publication: `22-infrastructure/09-ci-cd.md` §2.4.
- Kill switch: `07-features/15-feature-flags-and-rollouts.md`.
- Extension rollout pipeline: `04-extension/13-update-and-rollout.md`.
