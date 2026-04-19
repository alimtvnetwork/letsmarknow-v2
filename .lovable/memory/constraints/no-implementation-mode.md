---
name: No Implementation Mode
description: User is in spec-only mode. Never write/modify code under src/, never enable Cloud, never create migrations or edge functions. Spec files (spec/21-app/**) and memory files only.
type: constraint
---

# No Implementation Mode (locked 2026-04-18, re-confirmed 2026-04-19)

## Rule
Do NOT write or modify any code under `src/`, `supabase/`, `extension/`, `public/`, or root config files (`vite.config.ts`, `tailwind.config.ts`, `index.html`, etc.).
Do NOT enable Lovable Cloud, do NOT create migrations, do NOT install npm packages, do NOT scaffold routes/components.

## Allowed
- Read/write files under `spec/21-app/**`
- Read/write memory files under `mem://`
- Read/write artifacts under `/mnt/documents/`
- Run read-only shell commands (sweeps, greps, audits)

## Why
User is currently in spec-design phase only. Implementation will happen later, possibly handed off to another AI. All audits, gap analyses, and recommendations must stay as documentation, not code.

## History
- 2026-04-18: Locked.
- 2026-04-19: User asked to lift, then rejected Cloud enablement → re-locked. Cloud cannot be enabled without explicit confirmation in the popup.

## How to apply
- When user asks for an audit → write findings to `spec/21-app/audit-{date}.md`, never propose code changes inline.
- When user asks "close blocker X" → only edit spec files, never src/.
- When user implies implementation ("build", "implement", "wire") → STOP and ask: "Spec-only update or do you want to lift the no-implementation rule?"
- Suggestion buttons must NOT propose enabling Cloud, generating migrations, or any src/ edits unless the user explicitly lifts this rule.
