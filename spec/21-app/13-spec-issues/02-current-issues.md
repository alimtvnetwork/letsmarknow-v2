# 02 — Current Issues (Open)

> **Purpose.** Every open spec defect, with stable ID, severity, evidence, and the file(s) that own the fix. Append-only. Move closed rows to `04-closed-issues.md`.

**Severity legend:** `S0` blocks AI codegen · `S1` causes wrong output · `S2` causes ambiguity · `S3` cosmetic.

**Discovered:** 2026-04-19 (post 100/100 claim).
**Last updated:** 2026-04-29 Session 39 (SI-026 partial drain: 6 entries closed — 3 phase-roadmap forward-refs requalified to `20-roadmap/`-prefixed paths in `00-overview/05-browser-scope.md` §2.7, plus 3 release-ops stubs authored in `04-extension/` slots 17/18/19. SI-026 remaining = 15 entries. Open count = 1; SI-026 stays open until backlog hits 0).

---

## Open issues

| ID | Sev | Title | Evidence | Owning file(s) for fix | Rule violated (`01-naming-conventions.md` §) |
|---|---|---|---|---|---|
| SI-001 | S3 | ✅ closed Phase 9 — see `04-closed-issues.md` | (moved) | (moved) | (moved) |
| SI-020a | S2 | ✅ closed Phase 13.5 — see `04-closed-issues.md` | (moved) | (moved) | (moved) |
| SI-020b | S2 | ✅ closed Phase 13.6 — see `04-closed-issues.md` | (moved) | (moved) | (moved) |
| SI-020c | S1 | ✅ closed Phase 13.7g — see `04-closed-issues.md` | (moved) | (moved) | (moved) |
| SI-021 | S1 | ✅ closed 2026-04-29 — see `04-closed-issues.md` and `23-audits/audit-2026-04-29-toby-parity-delta.md` | (moved) | (moved) | (moved) |
| SI-022 | S2 | ✅ closed 2026-04-29 — see `04-closed-issues.md` and `23-audits/audit-2026-04-29-orphan-endpoint-sweep.md`. Final inventory: 157 declared, 0 undeclared (verified). | (moved) | (moved) | (moved) |
| SI-023 | S2 | ✅ closed 2026-04-29 — see `04-closed-issues.md`. `Collection.kind` enum + `captured_at` + `source_window_id` added to `02-data-model/03-collection.md` with 3 invariants and 3 events. | (moved) | (moved) | (moved) |
| SI-024 | S2 | ✅ closed 2026-04-29 — see `04-closed-issues.md`. Toast placement locked: bottom-right desktop / top-center mobile, max 3 stacked, no per-surface overrides. Save Session v1's bottom-left request rejected; refs in `07-features/02-save-session.md §14.4` and `04-extension/09-save-session.md §11` updated to point at `06-ui-ux/11-feedback.md §2.1`. | (moved) | (moved) | (moved) |
| SI-025 | S2 | ✅ closed Session 18 — see `04-closed-issues.md`. §7 rebased from 183/182 → 171/171 via `npx tsx scripts/lint/endpoint-counts.ts --write`. 5 real undeclared endpoints found and added; remaining 12-row gap was §7 over-count from prior hand-rebases. Linter now exits 0. | (moved) | (moved) | (moved) |
| SI-026 | S3 | 🟡 open 2026-04-29 Session 38 — Forward-ref backlog: 15 backticked-path refs (was 21 at S38 open; S39 closed 6: 3 phase-roadmap requalified, 3 release-ops authored as `04-extension/17-store-listing.md`, `18-firefox-port.md`, `19-staging-seed.md`). Remaining planned files: `19-security-privacy/extension-privacy.md`, `19-security-privacy/privacy-policy.md`, `06-ui-ux/options-page.md`, `06-ui-ux/keyboard-cheatsheet.md`, `17-i18n-a11y/extension-strings.md`, `08-sharing-collab/share-model.md` (v2), `08-sharing-collab/url-normalization.md`, `07-features/add-item-hover-button.md`, `10-licensing-billing/07-billing-emails.md`, `payments-integration.md`, plus duplicates from different citing files. All allowlisted in `scripts/lint/backticked-path-resolution.allowlist.txt` with `PR:#0 reason:SI-026 — ...`. Closure = author each planned file (or convert refs to `(planned)` prose). | `scripts/lint/backticked-path-resolution.allowlist.txt` | `scripts/lint/backticked-path-resolution.ts` registered in `22-infrastructure/09-ci-cd.md §2.1.1` | n/a (forward-ref pattern) |

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

- Per-file content drift (does `../04-extension/10-sync-and-offline.md` actually reference `../08-sharing-collab/14-realtime-transport.md` after the W-2 closure?).
- Full endpoint parity: 150 declared routes vs 195 referenced — 45-route gap suggests either (a) routes referenced but not declared, or (b) variant URLs (`/v1/foo` vs `/v1/foo/:id`). Needs targeted comparison sweep.
- Glossary term coverage: does every term used in a feature file appear in `00-overview/02-glossary.md`?
- `04-extension/14-analytics-telemetry.md §3` exists per ref check, but parity with `18-analytics-telemetry/03-events.md` event catalog not verified.

> Each subsequent "next" from the user adds another batch of findings here, then groups them into a phase in `03-phase-plan.md`.
