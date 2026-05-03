# Audit-154 — `07-features/` broad sweep

- **Date:** 2026-05-03 (Malaysia, UTC+8)
- **Scope:** `spec/21-app/07-features/` (19 files + `readme.md` + `flow-diagram.mmd`)
- **Driver:** `next` rotation; folder previously only partially audited.

## Method

1. `rg` sweep for `workspace`, `ULID`, hard-coded `#RRGGBB`.
2. Cross-checked all surviving hits against locked rules.
3. API-path discipline check (no GET/POST/etc outside `/v1/` or `/t/`).

## Findings

| # | File | Hit | Verdict |
|---|------|-----|---------|
| 1 | `04-collections.md:121` | "Toby Workspace = split: Space + Organization" | **Legit** — explicit SI-021 mapping reference, exactly the form Core memory mandates. |
| 2 | `04-collections.md:216` | `Toby pink (HSL 343 79% 60% ≈ #EC4868)` | **Legit** — mirrors Core memory's own canonical phrasing; hex is shown as a documented equivalence next to the token reference `--primary`, not used as a value. |

## Verification

- ✅ Zero ULID leakage.
- ✅ Zero rogue hex usage (only the one canonical Toby-pink documentation line).
- ✅ Zero non-`/v1/` or non-`/t/` API paths.
- ✅ No SI-021 drift.

## Outcome

Zero patches. Score 100/100. No new spec issues opened.
