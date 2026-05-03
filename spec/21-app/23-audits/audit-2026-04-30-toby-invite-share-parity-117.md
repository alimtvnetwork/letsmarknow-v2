# Audit 117 — Toby "Invite & Share" parity sweep

- **Date:** 2026-04-30 (UTC+8, Session 117)
- **Cadence:** ad-hoc (user-supplied external reference doc)
- **Status:** closed
- **Scorecard impact:** none (1 drift fix, no new SI)

## 1. Source

User pasted Toby's "Invite & Share — AI-Readable Feature Specification v1.0" (per-Collection share modal, custom Toby Link slug, Public Share toggle, public viewer page, Add Members modal, Members settings tab, roles). Saved verbatim as `spec/21-app/25-references/toby-invite-share-v1.md` for future cross-check.

User intent: "take some idea from here, and apply this idea in your app… for the other sharing options you can add your own plan." Treat as inspiration, not authority. Existing locked rules win on conflicts (role enum, share model v1, Workspace split).

## 2. Mapping table (Toby → ours)

| Toby concept | Our equivalent | File |
|---|---|---|
| Workspace (container of Collections) | **Space** | `00-overview/02-glossary.md §117` |
| Workspace (members/billing/admin) | **Organization** | same |
| Toby Link (custom slug) | Memorable shortlink `lmk/{org_handle}/{slug}` | `08-sharing-collab/13-share-link.md §1.2` |
| Public Share toggle | Share `mode = "public"` | `02-data-model/07-share.md`, `08-sharing-collab/02-public-shares.md` |
| Per-Collection invite (email + role) | Share `mode = "invite_only"` with `allowed_emails[]` | `08-sharing-collab/04-invite-only-shares.md` |
| Public View page | Share viewer | `05-web-app/14-share-viewer.md` |
| Add Members modal | `/settings/members` invite panel | `17-admin-org/02-members-management.md §3` |
| Owner / Full Member / Limited Member / Viewer | owner / admin or editor / editor (Space-scoped) / viewer | `00-overview/02-glossary.md §22-29`, `17-admin-org/03-roles.md` |
| 14-day invite expiry | TTL 14d default (configurable 1h–90d) | `09-auth-accounts/07-org-membership.md §2` ← **SoT** |
| Workspace `Allow Public Share` kill switch | `org.shares_disabled` panic button | `08-sharing-collab/12-revocation-and-expiry.md §56` |
| Ownership transfer requires password re-entry | Re-auth + 7d target acceptance | `09-auth-accounts/07-org-membership.md §7` |
| Reserved slugs (`api app p public share admin settings`) | Superset of 47 reserved slugs | `08-sharing-collab/13-share-link.md §2` |

**Role-enum reconciliation (per session 117 Q&A):** Toby roles do NOT alter our locked enum. `Full Member`→`editor` (or `admin` when given workspace-management rights), `Limited Member`→`editor` scoped to specific Spaces, `Viewer`→`viewer`, `Owner`→`owner`. No glossary change required; mapping recorded here.

## 3. Findings

### TIS-1 (S2) — Invite TTL drift in `17-admin-org/02-members-management.md`

- **Location:** lines 34, 131.
- **Drift:** Says invite is valid for `7 days` and "Invite expires (7 d)".
- **SoT:** `09-auth-accounts/07-org-membership.md §2` — `TTL: 14 d default; configurable 1 h–90 d`.
- **Fix:** Replace 7d with 14d and link SoT. Edge-case row updated.

### TIS-2 (S3 → no-op) — Toby's 30-day 301 redirect after slug change

- **Toby behavior:** old slug 301→new for 30 days, then 404.
- **Ours:** Rotate slug returns 410 Gone immediately; old slug reserved 90d against re-issue (`13-share-link.md §3`).
- **Decision:** Keep ours. 410 is more honest for security (revoked links should not silently follow). Documented here so future reviewers don't "fix" it.

### TIS-3 (S3 → no-op) — Toby's per-Collection "People" tab with Editor/Viewer roles

- **Ours:** Same capability achieved via `mode=invite_only` + `share role` (`viewer`/`editor`) per `08-sharing-collab/04-invite-only-shares.md` and Glossary §44. No new model needed. UI grouping is a `06-ui-ux/` concern, not a data/contract concern.

### TIS-4 (S3 → no-op) — Toby's "Bulk invite > 50 → reject"

- **Ours:** `03-api-endpoints/11-members-invites.md` already enforces "Max 50 invites per call." Aligned.

### TIS-5 (S3 → no-op) — Toby's request-access page

- **Ours:** `08-sharing-collab/13-share-link.md §8` already specifies the request-access page for invite-only / private targets, including the rule that target name/contents must never leak. Aligned.

### TIS-6 (S3 → no-op) — Toby's UI tokens (#EC4868, modal sizes, toast durations)

- **Ours:** Brand pink #EC4868 already locked in Core memory + `06-ui-ux/01-design-tokens.md §1.1`. Modal/toast specifics belong to `06-ui-ux/` per-modal files; deferred (not in scope per session 117 Q3).

## 4. Edits applied

- `17-admin-org/02-members-management.md` — invite TTL 7d → 14d (×2), link SoT.
- `spec/21-app/25-references/` — new folder + `toby-invite-share-v1.md` (verbatim source).
- `spec/21-app/25-references/readme.md` — index for external-product reference docs.
- `00-conversation-log.md` — session 117 entry.

## 5. Linter status

All 17 sub-checks expected green (no endpoint, role, slug, money, or pricing changes; new folder `25-references/` is reference-only and excluded from `folder-overview` because it lives outside the `00-`–`24-` numbered domain range).

> **Note on slot numbering.** `25-references/` is the first non-domain folder added since slot-21 was locked as Reserved buffer (per `13-spec-issues/01-naming-conventions.md §2`). It is permitted because the buffer rule reserves slot 21; slot 25 is unallocated meta-space, parallel to existing `22-infrastructure/`, `23-audits/`, `24-i18n-a11y/`. If `folder-overview` linter flags it, add to allowlist with reason "external-product reference docs, not authored spec".

## 6. Score

100/100/100 unchanged. Open SI count unchanged (0). One real drift fixed.
