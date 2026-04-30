<!--
audit-date: 2026-04-30
next-audit-by: 2026-10-27
audit-type: post-fix
status: closed
opened-on: 2026-04-30
closed-on: 2026-04-30
closed-because: All 17 lint sub-checks now pass after 5 batched fixes (audit-cadence header normalization, link-check + naming-convention + sku-naming + backticked-path allowlist additions, folder-overview restructure of 24-i18n-a11y/00-overview.md, 17/17 folder collision resolved by renaming 17-i18n-a11y → 24-i18n-a11y).
scope: All `scripts/lint/*.ts` sub-checks against `spec/21-app/**/*.md` after recent data-model + realtime + roadmap edits in sessions 99-104.
-->

# Audit: Cross-Cutting Linter Sweep (Session 105)

**Date:** 2026-04-30 (MYT)
**Scope:** Run every CI sub-check in `scripts/lint/` against the spec corpus to catch any drift introduced by data-model + realtime + roadmap work in sessions 99–104.
**Verdict:** 17/17 linters clean after 5 fixes.

---

## Findings

| ID | Sub-check | Sev | Title | Status |
|---|---|---|---|---|
| LS1 | audit-cadence | S2 | 14 audit headers used non-enum `audit-type: gap-sweep` and freeform `status:` strings (e.g. `closed (10 of 10 closed: ...)`); audit-104 missing the metadata block entirely | **CLOSED** |
| LS2 | link-check | S2 | 3 broken `"url"` placeholder targets in `08-sharing-collab/07-comments-and-reactions.md` and audit-83 — all documentation examples of unsupported markdown link syntax | **CLOSED** |
| LS3 | folder-overview | S2 | `17-i18n-a11y/00-overview.md` missing all 5 required canonical headings | **CLOSED** |
| LS4 | naming-convention | S2 | **17/17 folder-prefix collision** — both `17-admin-org/` and `17-i18n-a11y/` exist | **CLOSED** |
| LS5 | naming-convention | S3 | 13 audit filenames + `08-sharing-collab/url-normalization.md` not matching `^\d{2}-...` pattern | **CLOSED** |
| LS6 | backticked-path-resolution | S3 | 6 unresolved paths after rename (3 forward `17-i18n-a11y/...` + 3 entity-rls template bare-name refs + 1 audit pointer) | **CLOSED** |
| LS7 | sku-naming | S3 | `audit-74` quotes the forbidden `_annual` suffix while documenting W-6 closure | **CLOSED** |

## Resolutions

- **LS1:** Normalized 14 audit headers — `audit-type: gap-sweep` → `audit-type: ad-hoc` (the closest enum match for folder-scoped sweeps); freeform `status:` strings → bare `status: closed` with detail moved to a new `closed-because:` line. Added complete metadata block to `audit-2026-04-30-next-queue-readiness.md`.
- **LS2:** Appended 2 entries to `scripts/lint/link-check.allowlist.txt` (comments-and-reactions doc + audit-83) — both legitimately quote `[label](url)` as documentation examples of unsupported v1 markdown.
- **LS3:** Restructured `24-i18n-a11y/00-overview.md` to canonical 5-section header layout (Responsibilities, File-by-file behaviour, Tasks performed, What this folder is NOT, Cross-references); preserved Shared principles + Locale support as §6/§7.
- **LS4:** Renamed `spec/21-app/17-i18n-a11y/` → `spec/21-app/24-i18n-a11y/`. i18n-a11y was added more recently (per file mtime) and is referenced in 8 spec files (all rewritten in same session). 17-admin-org keeps its slot. New 24- slot extends max contiguous range; 21- gap remains exempt per existing dirgap allowlist.
- **LS5:** Appended 16 entries to `scripts/lint/naming-convention.allowlist.txt` (13 audit filenames per audit-cadence-owned scheme + `url-normalization.md` reference doc + 2 newly-renamed audit-104/audit-99 entries). Total non-comment lines: 37 (under the 50 cap).
- **LS6:** Bulk-rewrote 8 files' references from `17-i18n-a11y` → `24-i18n-a11y` (extension context-menu, store-listing, billing-emails, account-settings, keyboard-cheatsheet, si-026-closure audit, closed-issues, the i18n folder's own extension-strings file). Conversation log left untouched per append-only rule. Allowlisted 3 unrelated bare-filename refs in `02-data-model/templates/entity-rls.md` and `02-data-model/00-overview.md` audit pointer.
- **LS7:** Appended 1 entry to `scripts/lint/sku-naming.allowlist.txt` for audit-74's W-6 closure narrative.

## Verified clean (post-fix)

```
✓ allowlist-discipline   ✓ audit-cadence            ✓ backticked-path-resolution
✓ endpoint-counts        ✓ env-var-naming           ✓ error-code-casing
✓ folder-overview        ✓ link-check               ✓ money-units
✓ naming-convention      ✓ next-singleton-invariants ✓ pagination-param
✓ pricing-source         ✓ realtime-channel-syntax  ✓ role-enum
✓ sku-naming             ✓ storage-path
```

17 of 17 sub-checks pass. CI is green.

## Spec issues opened

None — all 7 findings closed in-session.

## Outcome

CI sub-check suite is green. No new spec issues opened. The 17/17 folder collision is permanently resolved (i18n is now at slot 24).
