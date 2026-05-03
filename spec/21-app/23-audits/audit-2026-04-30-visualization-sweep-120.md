<!--
audit-date: 2026-04-30
next-audit-by: 2027-04-30
audit-type: ad-hoc
status: closed
closed-on: 2026-04-30
closed-because: Full-folder gap-sweep of 15-visualization/ — clean.
-->
# Audit — 15-visualization/ broad sweep (Session 120)

**Date:** 2026-04-30
**Scope:** All 8 files in `spec/21-app/15-visualization/` (1,245 lines). Checks: (a) endpoint canonicality, (b) ULID/UUIDv7 placeholder shape, (c) role-enum + Workspace-split drift, (d) realtime SoT conformance, (e) color-label / token discipline, (f) copy-string key + a11y coverage.

---

## 1. Findings

| # | Sev | File | Issue | Resolution |
|---|---|---|---|---|
| F1 | none | `04-mindmap-view.md §10` | `"id": "01J..."` placeholder initially flagged as ULID. **Verified false positive** — `01J...` is the documented UUIDv7-shorthand convention used spec-wide (per S2440 of `00-conversation-log.md` and AO2 closure: `01H...`→`01J...` is *adoption* of UUIDv7). 200+ occurrences across `03-api-endpoints/`. No change. |
| F2 | none | All view files | All endpoint references (`GET/PATCH/POST /v1/items`, `/v1/groups`, `/v1/collections`, `/v1/mindmap-layouts`, `/v1/account/preferences`, `/v1/bulk/items`) are canonical and declared in `03-api-endpoints/00-overview.md`. No bare paths. No change. |
| F3 | none | All files | `grep -nE 'team owner\|team admin\|team member\|Workspace'` → 0 matches. Locked enum + Workspace-split rule holding. No change. |
| F4 | none | `readme.md §C5`, `01-list-view.md`, `05-tabextend-column-view.md`, `06-resizable-sections.md` | All realtime references correctly route to `08-sharing-collab/14-realtime-transport.md` SoT and gate behind `realtime.enabled` flag. P0/P2 split documented. No drift. |
| F5 | none | `04-mindmap-view.md §2.1` | Tag color hashing uses runtime HSL formula (not `--color-label-*` tokens). **Verified intentional** — Item `color_label` enum is for explicit user labels; tag colors are auto-derived from hash. No conflict with locked Item enum. No change. |
| F6 | none | All files | Only one color reference (`--muted-foreground` in `01-list-view.md §3`) and it uses a semantic token correctly. No hard-coded hex. No change. |
| F7 | none | All files | Copy-string keys consistently namespaced (`view.list.*`, `view.compact.*`, `view.mindmap.*`, `upgrade.modal.*`); a11y coverage solid (24 WCAG/aria/role/reduced-motion mentions). No change. |
| F8 | none | `05-tabextend-column-view.md §1` | Explicit "Card IDs are UUIDv7 per `mem://index.md` Core rule (NOT ULID — corrected from earlier draft)" — Core rule explicitly cited. No change. |

---

## 2. Verification

- `grep -rnE 'team owner|team admin|team member|Workspace|/auth/[^v]' spec/21-app/15-visualization/` → 0 matches.
- `grep -rnE '#[0-9a-fA-F]{6}' spec/21-app/15-visualization/` → 0 hard-coded colors.
- All 23 `/v1/...` endpoint references cross-checked against `03-api-endpoints/00-overview.md` declaration table.

## 3. Outcome

**Zero drift fixes required.** Folder is in excellent state — clear P0/P2 split, all SoT references resolved, no enum/role/transport drift. Audit recorded for cadence tracking.

## 4. Suggested next sweeps

1. `06-ui-ux/22-share-modals.md` — codify Share modal + toast-duration tokens from Toby reference (`25-references/toby-invite-share-v1.md`).
2. `04-extension/` second-pass post-audit-108 (large folder, only partially touched).
3. Decide whether `/v1/auth/apple/notifications` (S118 F5) should be declared as inbound webhook in `03-api-endpoints/03-auth.md` or kept infra-only.
4. SI-029 still blocked on legal counsel.
