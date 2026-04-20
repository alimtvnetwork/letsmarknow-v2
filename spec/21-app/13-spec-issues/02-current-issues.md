# 02 — Current Issues (Open)

> **Purpose.** Every open spec defect, with stable ID, severity, evidence, and the file(s) that own the fix. Append-only. Move closed rows to `04-closed-issues.md`.

**Severity legend:** `S0` blocks AI codegen · `S1` causes wrong output · `S2` causes ambiguity · `S3` cosmetic.

**Discovered:** 2026-04-19 (post 100/100 claim).
**Last updated:** 2026-04-20 (after Phase 5 re-audit sweep).

---

## Open issues

| ID | Sev | Title | Evidence | Owning file(s) for fix | Rule violated (`01-naming-conventions.md` §) |
|---|---|---|---|---|---|
| SI-001 | S1 | Folder slot `21` is empty (gap in numeric sequence) | `ls spec/21-app/` shows `…20, 22, 23`. Slot `13` filled by this folder. Slot `21` now documented as Reserved in `01-naming-conventions.md §2`. | Either fill slot `21` with a future cross-cutting domain OR keep the Reserved note. Re-evaluate at next major spec revision. | §2 |
| SI-010 | S2 | `15-feature-flags-and-rollouts.md` placement contradicts no-impl mode | Spec-only mode bans feature-flag implementation work, but `07-features/15-feature-flags-and-rollouts.md` is marked P0 in `07-features/readme.md` | `07-features/readme.md` (clarify: spec lives at P0, implementation deferred) | §7 |

| SI-012 | S2 | Mermaid arrow operator `->` used inside node labels (parsed by Mermaid) | `01-information-architecture/flow-diagram.mmd` lines 7-8: `IT1[Click Item -> opens URL...]`. Same pattern in `04-extension/`, `07-features/`, `09-auth-accounts/`, `10-licensing-billing/`, `11-import-export/`, `14-search/`, `17-admin-org/`, `19-security-privacy/`, `22-infrastructure/` flow diagrams. `->` inside `[...]` should be wrapped in quotes or replaced with `→` (em-dash arrow) to avoid parser ambiguity. | All 10 affected `flow-diagram.mmd` files | §6 |
| SI-013 | S2 | Mermaid label contains `:` without quoting in 5 diagrams | `04-extension/flow-diagram.mmd:5` `CTX[Context menu: Save to Collection]`, `07-features/:20` `VIEW[Switch view: list/grid/...]`, `08-sharing-collab/:19` `GONE[Viewer sees: share removed]`, `11-import-export/:13` `DONE[Toast: imported N items...]`, `14-search/:14` `RES[Ranked results: items · collections · tags]`. Per `01-naming-conventions.md §6`, labels containing `:` MUST be quoted. | The 5 affected `flow-diagram.mmd` files | §6 |
| SI-014 | S3 | Hierarchy §3.5 reference is valid (verification artifact, not a defect) | `01-hierarchy.md` line 94 has `### 3.5 Soft delete` — the reference from `07-features/16-delete-with-undo.md` resolves correctly. No fix required; recording here so the discovery method is reproducible. | none — close as verification | n/a |

---

## Discovery method

- `find spec/21-app -type d` and `ls` for sequence/file presence.
- `grep -rEho` for naming pattern violations.
- `grep -nE '\[[^"]*[<>():][^"]*\]'` across all 23 `flow-diagram.mmd` files for unquoted reserved chars.
- `grep -rn "§[0-9]"` for all section cross-references; spot-checked targets exist.
- `python3 -c "json.load(...)"` on `permissions-matrix.json` to enumerate roles vs locked enum.
- Cross-read with `23-audits/audit-2026-04-19-ai-readiness-score.md` Live Issue Tracker.

## What this list does NOT yet cover (will be added in next audit pass)

- Per-file content drift (does `04-extension/10-sync-and-offline.md` actually reference `14-realtime-transport.md` after the W-2 closure?).
- Full cross-reference target verification (only spot-checked; need exhaustive `§N.N` → section existence sweep across all 80+ refs).
- `06-ui-ux/wireframes/` sub-folder overview rule compliance (already exempted in `01-naming-conventions.md §3` — verify exemption matches reality).
- API endpoint parity: do all routes in `03-api-endpoints/` appear in at least one feature spec?
- Glossary term coverage: does every term used in a feature file appear in `00-overview/02-glossary.md`?

> Each subsequent "next" from the user adds another batch of findings here, then groups them into a phase in `03-phase-plan.md`.
