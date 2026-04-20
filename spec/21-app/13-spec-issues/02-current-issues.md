# 02 — Current Issues (Open)

> **Purpose.** Every open spec defect, with stable ID, severity, evidence, and the file(s) that own the fix. Append-only. Move closed rows to `04-closed-issues.md`.

**Severity legend:** `S0` blocks AI codegen · `S1` causes wrong output · `S2` causes ambiguity · `S3` cosmetic.

**Discovered:** 2026-04-19 (post 100/100 claim).
**Last updated:** 2026-04-20 (after Phase 10 deep re-audit).

---

## Open issues

| ID | Sev | Title | Evidence | Owning file(s) for fix | Rule violated (`01-naming-conventions.md` §) |
|---|---|---|---|---|---|
| SI-001 | S1 | Folder slot `21` is empty (gap in numeric sequence) | `ls spec/21-app/` shows `…20, 22, 23`. Slot `13` filled by this folder. Slot `21` now documented as Reserved in `01-naming-conventions.md §2`. | Either fill slot `21` with a future cross-cutting domain OR keep the Reserved note. Re-evaluate at next major spec revision. **Decision required from user.** | §2 |
| SI-015 | S2 | `15-sku-map.md` contains 7 `_TBD` SKU placeholders for Paddle product IDs | `10-licensing-billing/15-sku-map.md` lines 42-48: `pro_paddle_TBD`, `team_paddle_TBD`, etc. These are real spec values awaiting Paddle account provisioning, not formatting violations. Per `01-naming-conventions.md §7`, unknown values should use `(unresolved — see SI-NNN)` form. | `10-licensing-billing/15-sku-map.md` (replace `_TBD` suffix with `(unresolved — see SI-015)` OR add `_TBD` Paddle SKU to allowed-TBD table in `01-naming-conventions.md §7`) | §7 |


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
