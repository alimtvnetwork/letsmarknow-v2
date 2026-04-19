# 01 — Spec Naming & Style Conventions (Locked)

> **Purpose.** The single objective standard every spec audit compares against. If a file in `spec/21-app/**` violates a rule here, it becomes an issue in `02-current-issues.md`.

---

## 1. File and folder names

| Element | Rule | Example ✅ | Counter-example ❌ |
|---|---|---|---|
| Numbered folder | `NN-kebab-case/` (two-digit zero-padded) | `02-data-model/` | `2-data-model/`, `02_data_model/`, `02-DataModel/` |
| Numbered spec file | `NN-kebab-case.md` | `05-permissions-matrix.md` | `05_permissions_matrix.md`, `05-PermissionsMatrix.md` |
| Folder index | `readme.md` (lowercase) | `readme.md` | `README.md`, `Readme.md` |
| Folder summary | `00-overview.md` (lowercase, kebab) | `00-overview.md` | `overview.md`, `00_overview.md` |
| Diagram | `flow-diagram.mmd` | `flow-diagram.mmd` | `flow_diagram.mmd`, `flowDiagram.mmd` |
| Audit reports (in `23-audits/`) | `audit-YYYY-MM-DD-topic.md` | `audit-2026-04-19-spec-wide.md` | `audit_2026-04-19_spec_wide.md` |
| No underscores anywhere in **filenames or folder names**, ever. |

## 2. Folder sequence integrity

- Numbered folders MUST form a contiguous sequence: `00, 01, 02, …`
- Gaps (e.g. missing `13`, `21`) are a defect — either fill the slot or document the reservation in this file.
- Reserved slots (intentionally empty) MUST be listed below:
  - *(none currently)*

## 3. Intra-folder file sequence

- Files inside a numbered folder MUST also be a contiguous `NN-` sequence.
- A folder MUST contain: `readme.md`, `00-overview.md`, and `flow-diagram.mmd`. Exceptions: `templates/`.

## 4. Identifier casing inside spec content

These rules govern names that appear *inside* a markdown file, not the markdown filename.

| Identifier kind | Rule | Example ✅ | Counter-example ❌ |
|---|---|---|---|
| Database column | `snake_case` | `created_at`, `org_id` | `createdAt`, `OrgId` |
| Database table | `snake_case`, plural | `user_roles`, `share_links` | `UserRoles`, `share-links` |
| TypeScript identifier | `camelCase` (vars/fns), `PascalCase` (types/components) | `useAuth`, `Collection` | `use_auth`, `collection_type` |
| URL path segment | `kebab-case` | `/org/:id/billing-page` | `/org/:id/billing_page` |
| URL query param | `snake_case` allowed (matches DB) | `?sort_by=created_at` | `?sortBy=createdAt` |
| Webhook event name | Provider-native (Stripe `snake_case` is correct) | `checkout.session.completed`, `subscription_updated` | (do not rewrite vendor names) |
| Extension message constant | `SCREAMING_SNAKE` with `LMN_` prefix | `LMN_SAVE_TAB` | `lmn-save-tab`, `lmnSaveTab` |
| Env var | `SCREAMING_SNAKE` | `STRIPE_SECRET_KEY` | `stripe-secret-key` |
| Realtime channel | `entity:{placeholder}` | `collection:{collection_id}` | `collection:<id>`, `collection:$id` |
| Storage path | `kebab-case` segments, `snake_case` filenames OK | `imports/2026-04-19/run_001.json` | `imports/2026_04_19/run-001.json` |

> **Why webhook URLs look snake_case:** they mirror the vendor's event name (e.g. Stripe's `checkout.session.completed`). That is correct, not a violation.

## 5. Cross-reference style

- Always relative from `spec/21-app/` root: `02-data-model/05-item.md §3.1`.
- Section anchor uses `§` + section number (not `#anchor`).
- Backticks around every file path and identifier in prose.

## 6. Mermaid diagram style

- Every numbered folder has exactly one `flow-diagram.mmd`.
- Top-level diagram type: `flowchart TD` (top-down). No `LR`, no `sequenceDiagram` at the folder-flow level.
- Node labels containing `<`, `>`, `(`, `)`, or `:` MUST be wrapped in `"..."` to prevent Mermaid from parsing them as HTML.
  - Example: `EMB["iframe widget on external site"]` ✅
  - Counter-example: `EMB[<iframe> widget on external site]` ❌

## 7. Markdown style

- Every spec file opens with `# <title>` (single `#`) followed by a blockquote `> Purpose.` paragraph.
- Section headers are numbered: `## 1.`, `## 2.`, etc.
- No emoji in headers (allowed in narrative prose for status: ✅ ⚠️ ❌).
- No "TBD" / "TODO" / "FIXME" / "TKTK" left in locked spec files. If a value is genuinely unknown, write `(unresolved — see SI-NNN)`.

## 8. How violations become issues

When an audit finds a violation of any rule above:
1. Append a row to `02-current-issues.md` with the rule number (e.g. "violates §1 row 3").
2. The fix is *not* applied here. It lands in the owning folder once the user approves the phase in `03-phase-plan.md`.
