# Audit-146 — UI/UX Sweep

**Date:** 2026-05-03 (Session 146)
**Scope:** `spec/21-app/06-ui-ux/` — 23 files + `wireframes/` + `flow-diagram.mmd`.
**Trigger:** User `next`; folder only partially audited to date.

## Method

- `rg` for `workspace`, `ULID`, hard-coded hex, non-`/v1/` paths.
- Manual scan of `14-copy-voice.md` terminology lock + `17-copy-strings.md` for drift against locked Toby split (workspace = Space; admin/billing/members surface = Organization).

## Findings

| # | Sev | File | Issue | Action |
|---|---|---|---|---|
| F1 | S2 | `17-copy-strings.md:93` | `auth.signin.subtitle` said "Sign in to your workspace." → `account` (auth flow is account-scoped, not Org/Space). | Patched |
| F2 | S2 | `17-copy-strings.md:212` | `search.placeholder` said "Search your workspace…" → "Search your Space…" (search is scoped to current Space per `14-search/03-workspace-search.md`). | Patched |
| F3 | S2 | `17-copy-strings.md:276` | Billing cancel body referenced "workspace becomes read-only" → "organization" (billing surface = Org). | Patched |
| F4 | S2 | `17-copy-strings.md:298` | Member-remove body said "items stay in the workspace" → "organization". | Patched |
| F5 | S2 | `17-copy-strings.md:371-372` | Two perm toasts referenced "different workspace" / "not a member of this workspace" → "organization" (membership = Org). | Patched |
| F6 | S2 | `17-copy-strings.md` (multiple) | `{workspace_name}` and `{workspace}` placeholders used in 6 email/notif strings (invite, payment_failed, import_complete, invite.lead, notif.invite_received, notif.member_joined). All denote the Org context (billing/membership). | Bulk-renamed to `{org_name}` |
| F7 | — | `14-copy-voice.md:24` | "workspace" listed under **Don't use** for Organization. | Already correct — kept as-is. |

## Verifications (no defect)

- ✅ Zero ULIDs.
- ✅ Hex colors only inside `01-design-tokens.md` and `--color-label-*` token defs (allowed per Core memory).
- ✅ Zero non-`/v1/` API paths.
- ✅ Brand primary `#EC4868` only declared once in `01-design-tokens.md §1.1` (matches Core).

## Result

11 S2 string patches applied across `17-copy-strings.md`. Folder clean.

## Files changed

- `spec/21-app/06-ui-ux/17-copy-strings.md`
- `spec/21-app/00-conversation-log.md`
- `spec/21-app/23-audits/audit-2026-05-03-ui-ux-sweep-146.md` (new)
