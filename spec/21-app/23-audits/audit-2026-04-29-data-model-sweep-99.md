<!--
audit-date: 2026-04-29
next-audit-by: 2026-10-26
audit-type: gap-sweep
status: in_progress (1 of 4 closed)
opened-on: 2026-04-29
scope: 02-data-model/ folder — RLS coverage, has_role() SoT pin, FK on-delete clauses, per-entity permissions-matrix cross-ref
-->

# Audit — Data Model Sweep (Session 99)

**Date:** 2026-04-29 (Session 99, Malaysia time UTC+8)
**Author:** Lovable agent
**Scope:** 14 markdown files (~1,118 lines) in `spec/21-app/02-data-model/`. Cross-checked against Core memory ("UUIDv7 everywhere", "Role enum locked"), `<user-roles>` directive (separate `user_roles` table + SECURITY DEFINER `has_role()` pattern), `08-sharing-collab/05-permissions-matrix.md` (matrix SoT), `19-security-privacy/01-threat-model.md` "Elevation of privilege" row (role-enforcement pattern, established Session 90).
**Reason:** Foundational folder; never deep-audited end-to-end. Drift here cascades everywhere.

> **Open audit.** Drain in subsequent sessions.

---

## 1. Baseline strengths (no findings — verified clean)

- ✅ **UUIDv7 discipline**: every entity declares `uuid` PK + FKs; `00-overview.md §10` locks the rule. Repo `rg ulid` clean (per Session 92 sweep).
- ✅ **Role enum lock**: `08-member.md §15` enumerates the canonical 7-value `org_role` (`owner|admin|editor|viewer|billing|guest|system`); `system` server-issued only, enforced via SQL CHECK in `17-admin-org/03-roles.md §2`.
- ✅ **Soft-delete uniformity**: `deleted_at` (`timestamptz UTC`) declared in `00-overview.md §11`; `01-organization.md`, `02-space.md`, `03-collection.md`, `04-group.md`, `05-item.md` all carry the partial index `(organization_id, deleted_at)` and a 30-day Trash window per `00-overview.md §3`.
- ✅ **Color-label enum lock**: `05-item.md §26` carries the 9-value `color_label` enum with hex resolution explicitly delegated to `06-ui-ux/01-design-tokens.md` `--color-label-*` (matches Core memory).
- ✅ **Permissions matrix exists**: `08-sharing-collab/05-permissions-matrix.md` is present (cross-ref from `00-overview.md §44 + §61` and `08-member.md §50` resolves correctly; the older spec-internal audit S19 worry that it was unindexed is partially closed by `00-overview.md`, but per-entity drift remains — see DM4).

---

## 2. Headline findings

| # | Severity | Title | Owning file(s) for fix |
|---|---|---|---|
| DM1 | **S2** | **RLS-section coverage gap: `00-overview.md §15` declares "the schema is the law; functions only translate intent" and §44 promises an "RLS hook surface" per entity, but only `12-next-item.md` carries an explicit `## RLS` section.** Entity files `01-organization.md` … `11-account.md` describe lifecycle, indexes, invariants, but contain no per-table RLS-policy intent (`SELECT WHERE has_role(...)`, `INSERT WITH CHECK`, etc.). The matrix at `08-sharing-collab/05-permissions-matrix.md` covers role × action but does not substitute for per-table policy declarations a hand-off AI needs to write the `CREATE POLICY` SQL. Fix: add a uniform `## RLS` section to each of the 11 entity files (Organization, Space, Collection, Group, Item, Tag, Share, Member, HistoryEvent, License, Account) declaring policy intent: `enable row level security`, the four CRUD policies, the `has_role(_user_id, _role)` predicate from the role-enforcement SoT, and `share_grants_access(_share_id, _account_id)` (or analogous) for share-mediated reads. Bulk template can be added to `02-data-model/templates/entity-rls.md` and referenced. | `02-data-model/01-organization.md … 11-account.md` (11 files) |
| DM2 | ✅ **CLOSED** (Session 100) | **Role-enforcement pattern not pinned to SoT in `08-member.md`.** Closed by appending `## Role-enforcement contract` section to `02-data-model/08-member.md` citing `19-security-privacy/01-threat-model.md` "Elevation of privilege" row + reaffirming `system` role server-issued-only constraint pinned to `17-admin-org/03-roles.md §2`. Original finding: `08-member.md` IS the canonical `user_roles` table per the `<user-roles>` directive (membership is the only place where `(account_id, organization_id) → role` lives), but the file never says so explicitly and never cites the SECURITY DEFINER `has_role(_user_id, _role)` function pattern that all RLS policies must call. A new AI reading this file in isolation could plausibly build a `profile.role` shortcut — the exact vulnerability the directive forbids. Fix: append a `## Role-enforcement contract` section pointing at `19-security-privacy/01-threat-model.md` "Elevation of privilege" row (canonical pattern citation, Session 90) and stating: "This table is the **sole** source of `(account_id, organization_id) → role`. Never store `role` on `accounts` or any profile table. Server-side checks always go through the `has_role(_user_id, _role)` SECURITY DEFINER function defined in `19-security-privacy/01-threat-model.md`." | `02-data-model/08-member.md` |
| DM3 | **S3** | **FK `on delete` clauses missing across all entity files.** Older spec-internal audit S3 (2026-04-19) declared a Locked rule "FKs `on delete cascade` per file" for `02-data-model/`. Repo `grep -i "on delete"` against `02-data-model/*.md` returns **zero hits**. Each entity file declares `uuid (Parent.id)` typed FKs in the field table but never specifies `on delete cascade` / `set null` / `restrict` / `no action`. The "soft-delete cascade" prose in §Lifecycle covers application-level intent, but the SQL-level FK action is undeclared — implementer AI will pick one arbitrarily per table. Fix: append a `## Foreign keys` mini-section per entity file enumerating each FK with its `on delete` action, OR (preferred, less duplication) extend `00-overview.md` with a master FK table mapping every `(child.field) → (parent.id) :: on delete <action>` and require each entity file to point at that row. | `02-data-model/00-overview.md` (master table) + 11 entity files |
| DM4 | **S3** | **Per-entity Permissions-matrix cross-ref drift (carries S19 from `audit-2026-04-19-spec-internal.md`).** Only `08-member.md §50` and `00-overview.md §44 + §61` link to `08-sharing-collab/05-permissions-matrix.md`. The other 10 entity files (Organization, Space, Collection, Group, Item, Tag, Share, HistoryEvent, License, Account) have no per-entity link to their row in the matrix. S19 was filed against the JSON file (`permissions-matrix.json`); this audit re-files against the canonical Markdown matrix (`05-permissions-matrix.md`). Fix: append a one-line `## Permissions` block to each entity file pointing at the relevant row in `08-sharing-collab/05-permissions-matrix.md`. | `02-data-model/{01-organization,02-space,03-collection,04-group,05-item,06-tag,07-share,09-history-event,10-license,11-account}.md` |

---

## 3. Recommended drain plan

| Session | Findings | Notes |
|---|---|---|
| Next | DM2 | Single **S2** with the highest cascade risk (role-storage hygiene). One-section addition to one file. Easy, isolated. |
| Following | DM1 | The big one: 11-file uniform `## RLS` section addition. Use a template-write approach (one canonical template + per-entity specifics). Likely 2 sessions. |
| Following | DM3 | Master FK table in `00-overview.md` + per-entity pointers. One coherent session. |
| Following | DM4 | One-line cross-ref appended to 10 entity files. Mechanical. |

Total estimated: 4-5 sessions to fully drain.

**Scorecard impact NOW (audit-opening only):** No F-class findings. DM1 + DM2 are **S2 functional gaps** (RLS surface declared but not specified per-table; role-enforcement pattern not pinned). Cursor/Claude-Code pass docks 1 point because the spec promises RLS coverage that an implementer can't generate from per-entity files. Lovable and Raw-LLM passes hold (they evaluate prose intent, not per-table SQL synthesizability).

| Pass | Lovable | Cursor/Claude-Code | Raw-LLM |
|---|---:|---:|---:|
| Pre-audit | 100 | 100 | 100 |
| Audit-99 opening | **100** | **99** | **100** |
| After DM1 + DM2 drain | **100** | **100** | **100** |

---

## 4. Files NOT deeply audited (spot-checked only)

`flow-diagram.mmd`, `readme.md`, `00-overview.md` (read fully for headline rules; no further drift detected beyond the four findings above).

## 5. Cross-references

- `<user-roles>` directive (system-prompt level): canonical pattern for `user_roles` table + SECURITY DEFINER `has_role()`.
- Role-enforcement-pattern citation SoT: `19-security-privacy/01-threat-model.md` "Elevation of privilege" (per Session 90).
- Permissions matrix SoT: `08-sharing-collab/05-permissions-matrix.md` (Markdown SoT) + `08-sharing-collab/permissions-matrix.json` (machine-readable mirror).
- Identifier rule SoT: Core memory + `00-overview.md §10` ("UUIDv7 everywhere. Never ULID.").
- Color-label SoT: `06-ui-ux/01-design-tokens.md §1.6` `--color-label-*` tokens.
- Older spec-internal audit (carries S19 + S3): `audit-2026-04-19-spec-internal.md`.
- Last closed audit: `audit-2026-04-29-extension-sweep-95.md` (4/4).
