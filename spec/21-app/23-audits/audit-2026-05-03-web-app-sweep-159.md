# Audit-159 — `05-web-app/` broad sweep

- **Date:** 2026-05-03 (Malaysia, UTC+8)
- **Scope:** `spec/21-app/05-web-app/` (17 files + `readme.md` + `flow-diagram.mmd`)
- **Driver:** `next` rotation; folder previously never broadly audited.

## Method

`rg` sweep for `workspace`, `ULID`, hex colors, non-`/v1/` API paths.

## Findings

| # | Hit | Verdict |
|---|-----|---------|
| 1 | `15-pwa.md:9, 21, 22` — `#0F172A` in W3C Web App Manifest | **Legit, documented exception** — Manifest is static JSON per W3C spec, cannot use CSS custom properties. Exception block already explicitly mirrors the `--background` token and warns to update both surfaces together. |

Zero ULID, zero "workspace" hits, zero non-`/v1/` API paths.

## Outcome

Zero patches. Score 100/100.
