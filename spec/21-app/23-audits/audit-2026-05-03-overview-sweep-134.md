# Audit-134 — `00-overview/` broad sweep

**Date:** 2026-05-03 (Session 134)
**Scope:** 6 markdown files + `flow-diagram.mmd` in `spec/21-app/00-overview/`. Critical SoT folder; never broadly audited before.

## Method

1. ULID leakage → **0 hits**.
2. Hard-coded hex → **0 hits**.
3. Bare `Workspace` term used for our concepts (excluding glossary mapping rows, "Google Workspace" proper noun, and competitor-column entries) → **3 real hits**.
4. Non-`/v1/` paths → **0 hits**.

## Findings

### F1 — `01-vision.md:21` hierarchy uses "Workspace"

Line said: `5-level hierarchy: Workspace → Space → Collection → Group → Item`. Conflicts with locked hierarchy `Organization → Space → Collection → Group → Item` (Core memory; `02-glossary.md`). **Fixed.**

### F2 — `03-personas.md:25` "Workspace bubbles"

Bare-term use of "Workspace" for our Organization-avatar UI. Glossary explicitly notes the avatar is a.k.a. the "workspace bubble" (parenthetical rationale only) but the locked term remains **Organization**. **Fixed** to "Organization bubbles" with parenthetical cross-link.

### F3 — `04-competitive-analysis.md:33` "Workspace switch shortcut"

Row describes OUR Ctrl+↑/↓ shortcut (✅ in our column). Should reference Organization. **Fixed.**

### Non-issues (verified, not patched)

- `04-competitive-analysis.md:11, 20, 87` — "Workspace" appears inside Toby/Tab Extend competitor columns describing their hierarchy. Correct usage.
- `03-personas.md:42, 54` — "Google Workspace" proper noun (SSO). Correct.
- `02-glossary.md` — all `Workspace` references are either Toby-equivalent column entries or the explicit External-product mapping table. Correct.
- `readme.md:10` — lists "Workspace" as a glossary term being defined. Correct.

## Spec-issue tracker impact

No new SI opened (drifts were inline-fixable, no broader pattern). Score: **100/100**. Open: **1 / 25** (SI-029 still legal-blocked).

## Suggested next sweeps

- `20-roadmap/` — never audit-targeted.
- `08-sharing-collab/` — folder-wide sweep pending.
- `07-features/` — never broadly audited.
- `02-data-model/` — never broadly audited.
