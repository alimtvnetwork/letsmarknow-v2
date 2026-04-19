# Templates

Canonical authoring templates referenced by the spec corpus and enforced by the `spec-drift-linter` (`22-infrastructure/09-ci-cd.md` §2.1.1).

| File | Purpose | Enforced by |
|---|---|---|
| `folder-overview.md` | Required structure for every `00-overview.md` in `spec/21-app/**`. | `folder-overview` sub-check (presence + min length + 5 required headings). |

## Locked rules

- Adding a new template requires a matching linter sub-check and an entry in this README.
- Templates are **read-only references**, not active spec content. Do not link to them from feature specs as if they were truth — link to the actual feature file instead.
- When a template changes (e.g. new required section), bump the linter assertion and the audit tracker (`23-audits/audit-2026-04-19-ai-readiness-score.md`) in the same PR.
