# Toby — Invite & Share v1.0 (verbatim reference snapshot)

> **Source:** User-pasted, Session 117 (2026-04-30 UTC+8). Toby is gettoby.com's tab-management product. This file is a verbatim reference snapshot for parity comparison — see `25-references/readme.md` for rules. Do not link from runtime spec; do not edit.

---

# Invite & Share — AI-Readable Feature Specification

**Version:** 1.0
**Status:** Authoritative spec (Toby's, not ours).
**Scope:** Per-Collection sharing (custom Toby Link + Public Share URL + recipient public view), per-Collection invite to specific members, Workspace/Organization-level member management (Add Members modal, Members settings tab, roles), and toolbar entry points (`SHARE` link icon, members icon).
**Out of scope:** Auth/sign-up, billing/subscription internals, Collections CRUD itself, notification/email delivery infrastructure, SSO provisioning.

(Full text preserved as supplied by user. See chat log Session 117 for original. Key points captured:

- Roles: Owner / Full Member / Limited Member / Viewer (single-Owner per Workspace).
- Toby Link slug: 2–32 chars `[a-z0-9-_]`, unique per Workspace, reserved words `api app p public share admin settings`.
- Public Share toggle on Collection; URL `gettoby.com/p/{slug-or-id}`.
- Public View page: tab grid, "Open N Tabs" pill, "Open Toby" deep-link, `noindex` if workspace setting enabled.
- Add Members modal: chips for emails (max 50), default role Full Member, optional Spaces multi-select.
- Members panel in Settings: search, role popover, 3-dot menu (Change role / Resend invite / Remove).
- Invite link expires 14 days (default; 1–30 configurable).
- Workspace setting `Allow Public Share on Collections` acts as a kill switch.
- Ownership transfer requires password re-entry.
- Slug change keeps old URL 301→new for 30 days, then 404.
- Bulk invite > 50 emails rejected inline.
- Public View on mobile: 1-col grid; tabs opened sequentially with delay to defeat popup blockers.

Parity mapping and gap-fixes recorded in `23-audits/audit-2026-04-30-toby-invite-share-parity-117.md`.)
