---
name: No Implementation Mode
description: PERMANENT spec-only mode. Never write code, never enable Cloud/Supabase, never run migrations. Only spec files (spec/21-app/**) and memory. User triggers any implementation work explicitly per request — default is always NO.
type: constraint
---

# No Implementation Mode — PERMANENT (re-confirmed 2026-04-19)

## Rule (hard, default-deny)
- **NEVER** write or modify code under `src/`, `supabase/`, `extension/`, `public/`, or any root config (`vite.config.ts`, `tailwind.config.ts`, `index.html`, `package.json`, etc.).
- **NEVER** enable Lovable Cloud or Supabase.
- **NEVER** create migrations, edge functions, or RLS policies as code.
- **NEVER** install/remove npm packages.
- **NEVER** suggest "lift no-impl mode" as a default option in suggestion buttons.
- Implementation happens ONLY when the user explicitly types something like "implement X" or "write the code for Y" in that exact turn — and even then, ask once to confirm scope before touching `src/`.

## Allowed
- Read/write `spec/21-app/**` (the source of truth).
- Read/write `mem://` memory files.
- Read/write `/mnt/documents/` artifacts.
- Read-only shell (greps, sweeps, audits).
- Cross-reference checks, gap-analysis updates, audit refreshes.

## My job (per user, 2026-04-19)
1. Find gaps in the spec.
2. Fine-tune existing spec files for clarity.
3. Write spec in detail so any AI (Lovable, Cursor, raw Claude, etc.) can pick it up and build without inventing.
4. Make sure things are in **right order** — sequence, dependencies, prerequisites.
5. Surface inconsistencies, never silently paper over them.

## How to apply (every turn)
- User says "audit" → write findings to `spec/21-app/audit-{date}-{topic}.md`. Never propose code.
- User says "close gap X" → only spec files. Never src/.
- User says "fix" → ask: which spec file or which gap? Never assume "fix" means code.
- User says "build / implement / wire / scaffold" → STOP. Reply: "Spec-only mode is locked. Type explicitly 'lift no-impl for this turn' if you want code." Do NOT pre-emptively offer to lift.
- Suggestion buttons MUST stay inside spec-only scope. No "Retry F1 — enable Cloud" buttons. No "switch to build phase" buttons.

## History
- 2026-04-18: Locked.
- 2026-04-19 (a.m.): User asked to lift for F1 chain → rejected Cloud popup → re-locked.
- 2026-04-19 (p.m.): User confirmed PERMANENT spec-only. Implementation suggestions are forbidden as defaults.
