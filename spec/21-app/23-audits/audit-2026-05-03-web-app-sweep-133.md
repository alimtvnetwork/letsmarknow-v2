# Audit-133 — `05-web-app/` broad sweep

**Date:** 2026-05-03 (Session 133)
**Scope:** All 17 files + `flow-diagram.mmd` + `readme.md` in `spec/21-app/05-web-app/`.
**Driver:** User `next` command. Folder never broadly audit-targeted before.

## Method

Drift checks across the folder:
1. `ULID` / `ulid` leakage → **0 hits**.
2. Bare `Workspace` (Toby term collisions, excluding mapping context) → **0 hits**.
3. Hard-coded hex colors outside design-token files → 2 hits in `15-pwa.md` (PWA manifest `background_color` / `theme_color` = `#0F172A`).
4. Non-`/v1/` API paths in body text → **0 hits** (the `/auth/*` and `/v1/auth/*` SW-exclude entries in `15-pwa.md` are correct legacy + canonical paths).
5. Endpoint declarations needing inventory check → folder is UI-spec only; no new endpoints declared.

## Findings

### F1 — PWA manifest hex colors (`15-pwa.md` §1)

`#0F172A` appears twice in the JSON manifest. Web App Manifests (`manifest.webmanifest`) are static JSON and **do not support CSS custom properties** — colors MUST be literal hex/named values per W3C Manifest spec. This is therefore an **allowed exception** to the "no hard-coded hex" rule, but currently undocumented.

**Resolution:** Add an inline comment in `15-pwa.md` §1 noting the manifest exception and pointing at `06-ui-ux/01-design-tokens.md` as the source-of-truth surface color (dark `--background: 222 47% 6%` ≈ `#0E1729`, intentionally close to `#0F172A`). No value change — purely a documentation note to prevent a future linter false-positive.

### F2–F5 — Clean

No further drift detected.

## Patches applied

- `05-web-app/15-pwa.md` §1: prepended a one-line note above the manifest JSON explaining the hex-literal exception and cross-linking design tokens.

## Spec-issue tracker impact

No new SI opened. SI count remains **1 open / 25 closed** (SI-029 still blocked on legal counsel). Score: 100/100.

## Suggested next sweeps

- `00-overview/` (glossary is critical SoT; never broadly audited).
- `20-roadmap/` (never audit-targeted).
- `08-sharing-collab/` (touched in S117 but folder-wide sweep pending).
