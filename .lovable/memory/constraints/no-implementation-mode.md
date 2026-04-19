---
name: No Implementation Mode
description: LIFTED 2026-04-19. Implementation work in src/, supabase/, migrations, and Cloud is now allowed. Kept here as a historical record.
type: constraint
---

# No Implementation Mode — LIFTED 2026-04-19

## Status: INACTIVE

User explicitly lifted this constraint on 2026-04-19 to begin executing the audit fix plan (F1 → F3 → F2 → F10) from `spec/21-app/audit-2026-04-18.md`.

## Current rules
- Implementation in `src/`, `supabase/`, migrations, edge functions: **ALLOWED**
- Lovable Cloud enablement: **ALLOWED**
- npm dependency installs: **ALLOWED**
- Spec files in `spec/21-app/**` remain the source of truth — code must conform to spec, not the other way around.

## Historical rule (locked 2026-04-18, lifted 2026-04-19)
Originally forbade all code changes; only spec + memory files could be edited. Lifted because user reached the build phase.

## How to apply now
- Code changes must reference the spec section they implement (e.g. "implements `02-data-model/05-item.md`").
- When spec and code disagree, surface the conflict and ask the user — do not silently diverge.
- Each meaningful code change should bump at least minor version (per user-preferences).
