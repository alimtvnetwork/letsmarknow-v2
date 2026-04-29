# 02 — Current Issues (Open)

> **Purpose.** Every open spec defect, with stable ID, severity, evidence, and the file(s) that own the fix. Append-only. Move closed rows to `04-closed-issues.md`.

**Severity legend:** `S0` blocks AI codegen · `S1` causes wrong output · `S2` causes ambiguity · `S3` cosmetic.

**Discovered:** 2026-04-19 (post 100/100 claim).
**Last updated:** 2026-04-29 (Save Session v1 reconciliation — SI-023 + SI-024 opened at S2; open count = 2).

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
| SI-023 | S2 | `Collection.kind` discriminator (`manual`\|`session`) introduced by Save Session v1 spec but not yet present in `02-data-model/03-collection.md`. Sessions currently distinguished only by presence of `capturedAt`. Adding `kind` clarifies queries, list-view filtering, and 3-dot menu wiring (`Restore session` only for `kind=session`). | Save Session v1 paste (conv log 2026-04-29 §4 entry); `02-data-model/03-collection.md` lacks the field. | `02-data-model/03-collection.md` (add field), `07-features/02-save-session.md` §14.1 (already references it), `02-data-model/00-overview.md` (enum table) | §4 (enum locking) |
| SI-024 | S2 | Toast placement convention undefined. Save Session v1 spec asks bottom-left max-3-stacked; sonner default in current `src/main.tsx` is top-right. Need a global decision in `06-ui-ux/` so all features stay consistent. | Save Session v1 §8; `src/main.tsx` Toaster config | `06-ui-ux/12-empty-error-loading.md` or new `06-ui-ux/13-toasts.md`; downstream code in `src/main.tsx` | n/a (UX convention, not naming) |

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
