# 02 — Current Issues (Open)

> **Purpose.** Every open spec defect, with stable ID, severity, evidence, and the file(s) that own the fix. Append-only. Move closed rows to `04-closed-issues.md`.

**Severity legend:** `S0` blocks AI codegen · `S1` causes wrong output · `S2` causes ambiguity · `S3` cosmetic.

**Discovered:** 2026-04-19 (post 100/100 claim).
**Last updated:** 2026-04-20 (after Phase 13.4 — SI-020d resolved as alias-defects, folded into SI-020b).

---

## Open issues

| ID | Sev | Title | Evidence | Owning file(s) for fix | Rule violated (`01-naming-conventions.md` §) |
|---|---|---|---|---|---|
| SI-001 | S1 | Folder slot `21` is empty (gap in numeric sequence) | `ls spec/21-app/` shows `…20, 22, 23`. Slot `13` filled by this folder. Slot `21` now documented as Reserved in `01-naming-conventions.md §2`. | Either fill slot `21` with a future cross-cutting domain OR keep the Reserved note. Re-evaluate at next major spec revision. **Decision required from user.** | §2 |
| SI-020a | S2 | Withdrawn endpoint still referenced as if active | `POST /v1/realtime/ticket` is documented as **withdrawn** in `04-extension/10-sync-and-offline.md:78` (W-2 closure replaced bespoke WS with Supabase Realtime). The "Phase 12 endpoint sweep" picked it up because the path string still appears. No defect in extension file (correctly marked withdrawn). | Update `13-spec-issues/01-naming-conventions.md §1` (or new §17) with a "Withdrawn endpoint reference rule": withdrawn paths must appear inside a fenced quote/strikethrough OR be wrapped in `~~...~~` so the endpoint-parity grep can exclude them. Alternatively add a `<!-- withdrawn -->` HTML comment marker convention. | §1 |
| SI-020b | S2 | 17 endpoints are aliases of canonical declared paths (extends SI-019, absorbs SI-020d) | Casual references in feature/extension/auth/admin files use shorthand paths whose canonical forms ARE declared. Confirmed mismatches: `POST /v1/auth/forgot` → `POST /v1/auth/password/forgot` (`03-auth.md:192`); `POST /v1/auth/magic/request` → canonical declared path TBD verify; `POST /v1/billing/checkout/session` → `POST /v1/organizations/:id/billing/checkout` (`16-licenses.md:95`); `POST /v1/billing/portal/session` → `POST /v1/organizations/:id/billing/portal`; `POST /v1/items/batch` and `POST /v1/items/bulk` → `POST /v1/items:batch` (which itself was forbidden in §16 — see contradiction); `POST /v1/bulk` → bulk-ops endpoint per `08-items.md:173`; `PATCH /v1/collections/:collection_id` → `PATCH /v1/collections/:id`. **From SI-020d (Phase 13.4):** `POST /v1/organizations/{id}/deletion` → `DELETE /v1/organizations/:id` (`04-organizations.md:163`); `POST /v1/organizations/{id}/exports` → `POST /v1/organizations/:id/data-export` (`04-organizations.md:214`); `POST /v1/organizations/{id}/invites` → `POST /v1/members/invites` (`11-members-invites.md:64`). All 3 from-SI-020d also violate §1.1 `{id}` rule — same sweep fixes both. | (a) Extend §16 alias table in `01-conventions.md` with these 17 mappings, (b) sweep referencing files (`17-admin-org/02-members-management.md`, `17-admin-org/05-data-export-delete.md`, `09-auth-accounts/11-rate-limits-and-abuse.md`, `09-auth-accounts/13-rate-limit-values.md`, `10-licensing-billing/03-stripe-integration.md`, `10-licensing-billing/04-paddle-integration.md`, `06-ui-ux/06-resizable-sections.md`, etc.) to use canonical paths, (c) reconcile the `items:batch` vs `items/batch` contradiction (SI-019 forbade colon-form, but `00-overview.md` declares it). | §1, §1.1, §16 |
| SI-020c | S1 | 17 endpoints genuinely missing — need new declared rows | Truly new endpoints with no declared canonical anywhere: `DELETE /v1/mindmap-layouts/:id`, `GET /v1/auth/verify`, `GET /v1/billing/invoices/:id/pdf`, `GET /v1/exports/lmn-json/:account_token`, `GET /v1/imports/:id/preview`, `GET /v1/imports/:id/status`, `GET /v1/items/:id/history`, `GET /v1/jobs/:job_id`, `GET /v1/organizations/:id/data-export/:export_id`, `GET /v1/share-public/:slug/items`, `PATCH /v1/account/preferences`, `POST /v1/exports/:export_id/refresh-url`, `POST /v1/flags/evaluate`, `POST /v1/imports/:id/commit`, `POST /v1/imports/upload`, `POST /v1/internal/feedback`, `POST /v1/me/gdpr-export`, `POST /v1/mindmap-layouts`, `POST /v1/share-public/:slug/comment`, `POST /v1/shares/:id/purge`, `POST /v1/shares/access`, `POST /v1/shares/links/:id/revoke`, `POST /v1/webhooks/email-in`, `POST /v1/webhooks/inbound/:webhook_token`. | Add a new `### Sub-section` and table row for each in the appropriate per-domain file (`03-auth.md`, `08-items.md`, `10-shares.md`, `15-import-export.md`, `16-licenses.md`, `17-billing-webhooks.md`, plus possibly new files `19-jobs.md`, `20-internal.md`, `21-flags.md`, `22-mindmap-layouts.md`, `23-account.md`). Then surface each in `00-overview.md`. Estimated 24 rows touching 7-12 files. | §1, §3 |


---

## Discovery method

- `find spec/21-app -type d` and `ls` for sequence/file presence.
- `grep -rEho` for naming pattern violations.
- `grep -nE '\[[^"]*( -> |[A-Za-z]+: [A-Z])[^"]*\]'` across all 23 `flow-diagram.mmd` files for unquoted reserved chars.
- Phase 10 sweep: enumerated all 16 unique `folder/file.md §N.N` cross-references and verified each target section exists.
- `python3 -c "json.load(...)"` on `permissions-matrix.json` to enumerate roles vs locked enum.
- Phase 10 endpoint inventory: 150 method+path rows in `03-api-endpoints/00-overview.md`; 195 distinct `/v1/...` paths referenced spec-wide.
- Phase 10 wireframes check: `06-ui-ux/wireframes/` has `readme.md` + `00-overview.md` + 5 numbered files, no `flow-diagram.mmd` (matches exemption in `01-naming-conventions.md §3`). ✅
- Cross-read with `23-audits/audit-2026-04-19-ai-readiness-score.md` Live Issue Tracker.

## Phase 10 verification artifacts (no defect, recorded for reproducibility)

- **Cross-references:** All 16 unique `§N.N` refs resolve to existing sections. Apparent broken `02-data-model/05-item.md §3.1` was a **false positive** — it appears only as a syntax example in `13-spec-issues/01-naming-conventions.md §5`, not an actual cross-reference. (Recorded as SI-016 closed-on-discovery.)
- **`->` arrow in markdown body:** Found in `10-licensing-billing/12-billing-webhooks.md:90` `(event, services) -> Result` — TypeScript-style return-type signature, NOT a Mermaid arrow. Allowed. (Recorded as SI-017 closed-on-discovery.)
- **Wireframes folder:** Compliant with exemption.

## What this list does NOT yet cover (will be added in next audit pass)

- Per-file content drift (does `04-extension/10-sync-and-offline.md` actually reference `14-realtime-transport.md` after the W-2 closure?).
- Full endpoint parity: 150 declared routes vs 195 referenced — 45-route gap suggests either (a) routes referenced but not declared, or (b) variant URLs (`/v1/foo` vs `/v1/foo/:id`). Needs targeted comparison sweep.
- Glossary term coverage: does every term used in a feature file appear in `00-overview/02-glossary.md`?
- `04-extension/14-analytics-telemetry.md §3` exists per ref check, but parity with `18-analytics-telemetry/03-events.md` event catalog not verified.

> Each subsequent "next" from the user adds another batch of findings here, then groups them into a phase in `03-phase-plan.md`.
