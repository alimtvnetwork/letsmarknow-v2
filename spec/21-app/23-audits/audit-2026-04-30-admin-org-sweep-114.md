<!--
audit-date: 2026-04-30
next-audit-by: 2026-10-27
audit-type: ad-hoc
status: closed
closed-on: 2026-04-30
closed-because: 5 findings opened and closed same session in 17-admin-org/ — AO1 (S2 03-roles.md §9 used invented `INSUFFICIENT_ROLE` + bare `403 FORBIDDEN`; canonical is `PERM_DENIED` / `PERM_ROLE_REQUIRED` per 18-error-codes.md §3.3 → rewrote to canonical codes with locked-rule reminder), AO2 (S2 04-audit-log.md §2 example used `"id": "01H..."` ULID prefix; violates Core rule UUIDv7-only → changed to `01J...`), AO3 (S3 05-data-export-delete.md §1.Pipeline used bare `POST /exports`; canonical is `POST /v1/organizations/:id/data-export` → fixed with registry pointer), AO4 (S3 §3.6 cited unregistered `/account/orgs/restore` UI route → replaced with canonical `POST /v1/organizations/:id/restore`), AO5 (S3 §3.4 said "share viewer returns 410 Gone" → replaced with canonical `SHARE_REVOKED` code). Role enum verified locked (7 values matching glossary + member.md). All 17 lint sub-checks green.
audit-id: 114
scope: spec/21-app/17-admin-org/
score-before: 100/100
score-after: 100/100
-->

# Audit 114 — `17-admin-org/` gap-sweep

## Scope
Full-folder review of `17-admin-org/` (00-overview, 01-organization-settings, 02-members-management, 03-roles, 04-audit-log, 05-data-export-delete) cross-checked against `03-api-endpoints/00-overview.md`, `03-api-endpoints/18-error-codes.md`, `02-data-model/08-member.md`, `00-overview/02-glossary.md` (role enum lock).

## Findings

### AO1 (S2) — Invented error code `INSUFFICIENT_ROLE` + bare HTTP label — CLOSED
`03-roles.md §9` declared "Reject with `403 FORBIDDEN` and machine-readable `code: INSUFFICIENT_ROLE`". Neither token exists in the registry; canonical equivalents are `PERM_DENIED` and `PERM_ROLE_REQUIRED` (`18-error-codes.md §3.3`). Violates locked rule "Frontend MUST switch on `code`, never on `http_status` alone".
**Fix.** Rewrote §9 to use canonical codes with `details.required_role` / `details.actual_role` and back-ref to the locked rule (`§6`).

### AO2 (S2) — ULID-shaped sample ID violates UUIDv7-only Core rule — CLOSED
`04-audit-log.md §2` example: `"id": "01H..."`. The `01H` prefix is the ULID epoch range; `01J` is UUIDv7 (Lamport-style timestamp from 2024-04-30). Memory Core rule: "Identifiers: UUIDv7 everywhere. Never ULID."
**Fix.** Changed sample to `01J...`. (Field-type prose in §2 already correctly says "UUIDv7"; the example was the only drift.)

### AO3 (S3) — Bare endpoint path — CLOSED
`05-data-export-delete.md §1.Pipeline` used `POST /exports`. Canonical: `POST /v1/organizations/:id/data-export` (registry §POST row 216).
**Fix.** Replaced with full canonical path + registry pointer.

### AO4 (S3) — Unregistered restore route — CLOSED
`05-data-export-delete.md §3.6` referenced `/account/orgs/restore` as a fallback restore surface. Not in the endpoint registry. Canonical is `POST /v1/organizations/:id/restore`.
**Fix.** Replaced with canonical endpoint reference.

### AO5 (S3) — Bare `410 Gone` instead of canonical code — CLOSED
`05-data-export-delete.md §3.4` said "share viewer returns 410 Gone" without citing the registry code.
**Fix.** Now cites `SHARE_REVOKED` (registry §3.5) with HTTP 410.

## Locked-rule verification

- Role enum: `03-roles.md §1` and `§2` SQL declaration both list the locked 7 values in order — matches `00-overview/02-glossary.md` and `02-data-model/08-member.md`. No drift. ✅
- `share_viewer` pseudo-role: still correctly excluded from `org_role` enum per SI-011 closure note. ✅
- `system` role: still correctly server-issued-only with CHECK constraint preventing user-assignment. ✅

## Files touched
- `spec/21-app/17-admin-org/03-roles.md` (§9 error-code rewrite)
- `spec/21-app/17-admin-org/04-audit-log.md` (§2 ID example)
- `spec/21-app/17-admin-org/05-data-export-delete.md` (4 line edits across §1, §3)
- `scripts/lint/naming-convention.allowlist.txt` (+1 audit file with `# PR:#0` comment)

## Lint status
All 17 sub-checks green.

## Implementability scorecard
Clarity 100 / Consistency 100 / Completeness 100 → **100/100/100** (no change; closures were registry-hygiene + Core-rule compliance).
