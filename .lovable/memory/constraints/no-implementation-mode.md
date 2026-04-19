---
name: No Implementation Mode
description: PERMANENT spec-only mode. Never write code, never enable Cloud/Supabase, never run migrations, never suggest tests/fixtures/seed data. Only spec files (spec/21-app/**) and memory.
type: constraint
---

# No Implementation Mode — PERMANENT (re-confirmed 2026-04-19, hardened)

## Rule (hard, default-deny)
- **NEVER** write or modify code under `src/`, `supabase/`, `extension/`, `public/`, or any root config (`vite.config.ts`, `tailwind.config.ts`, `index.html`, `package.json`, etc.).
- **NEVER** enable Lovable Cloud or Supabase.
- **NEVER** create migrations, edge functions, or RLS policies as code.
- **NEVER** install/remove npm packages.
- **NEVER** suggest "lift no-impl mode" as a default option in suggestion buttons.
- **NEVER** suggest creating unit tests, integration tests, e2e tests, Gherkin .feature files, fixtures, seed data, or any `21-testing/` / `99-fixtures/` folders. The user will explicitly ask if/when they want these. Do not pre-emptively offer them.
- Implementation happens ONLY when the user explicitly types something like "implement X" or "write the code for Y" in that exact turn — and even then, ask once to confirm scope before touching `src/`.

## Allowed (the ONLY job)
- Audit the spec for gaps, contradictions, missing detail, wrong sequencing.
- Fine-tune existing spec files in `spec/21-app/**` for clarity.
- Write new spec files when a gap is found, in enough detail that any AI (Lovable, Cursor, raw Claude, etc.) can build from it without inventing.
- Make sure things are in the **right order** — sequence, dependencies, prerequisites.
- Surface inconsistencies, never silently paper over them.
- Read/write `mem://` memory files.
- Read/write `/mnt/documents/` artifacts.
- Read-only shell (greps, sweeps, audits).

## How to apply (every turn)
- User says "audit" → write findings to `spec/21-app/audit-{date}-{topic}.md`. Never propose code.
- User says "close gap X" → only spec files. Never src/. Never test files. Never seed data.
- User says "fix" → ask: which spec file or which gap? Never assume "fix" means code or tests.
- User says "build / implement / wire / scaffold" → STOP. Reply: "Spec-only mode is locked. Type explicitly 'lift no-impl for this turn' if you want code." Do NOT pre-emptively offer to lift.
- Suggestion buttons MUST stay inside spec-only scope. Allowed suggestion themes: audit existing spec, close a named gap with more spec detail, sweep for sequencing/contradictions, rewrite a weak spec file in more detail, refresh gap-analysis scores. FORBIDDEN suggestion themes: tests, fixtures, seeds, implementation, lifting no-impl, enabling Cloud, scaffolding code.

## History
- 2026-04-18: Locked.
- 2026-04-19 (a.m.): User asked to lift for F1 chain → rejected Cloud popup → re-locked.
- 2026-04-19 (p.m.): User confirmed PERMANENT spec-only. Implementation suggestions are forbidden as defaults.
- 2026-04-19 (later): User explicitly forbade suggesting unit tests / fixtures / seed data. Only spec writing, auditing, gap-closing in spec form. Hardened.
