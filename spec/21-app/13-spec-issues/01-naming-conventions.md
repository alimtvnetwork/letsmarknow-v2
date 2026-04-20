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
| Audit reports (in `23-audits/`) | `audit-YYYY-MM-DD-{topic}.md` — **EXEMPT from `NN-` numbered-prefix rule** because audits are append-only history, not a sequenced document set | `audit-2026-04-19-spec-wide.md` | `audit_2026-04-19_spec_wide.md` (underscores), `01-audit-spec-wide.md` (numbered) |
| No underscores anywhere in **filenames or folder names**, ever. |

### Exemptions to the `NN-` numbered prefix rule

The following file classes are exempt — they appear in numbered folders but do not themselves carry an `NN-` prefix:

| Pattern | Lives in | Why exempt |
|---|---|---|
| `audit-YYYY-MM-DD-{topic}.md` | `23-audits/` | Append-only dated history; chronological order is the date itself. |
| `audit.md` | `23-audits/` | Original seed audit — historical baseline filename, predates the convention. |
| `gap-analysis.md` | `23-audits/` | Living closure tracker — singular file, no sibling sequence. |
| `permissions-matrix.json` | `08-sharing-collab/` | Machine-readable artefact, not prose. |
| `flow-diagram.mmd` | every numbered folder | Singular per folder; named by role, not sequence. |
| `readme.md`, `00-overview.md` | every numbered folder | Required-by-name; not part of the user sequence. |

## 2. Folder sequence integrity

- Numbered folders MUST form a contiguous sequence: `00, 01, 02, …`
- Gaps are a defect — either fill the slot or document the reservation in the table below.

### Reserved or intentionally-empty slots

| Slot | Status | Owner / reason |
|---|---|---|
| `13-spec-issues/` | **In use** as of 2026-04-19 | Spec-issues catalogue + phase plan. |
| `21-` | **Permanently reserved (empty) — locked 2026-04-20 (Phase 9)** | Held indefinitely as a buffer between the per-domain folders (`00-`–`20-`) and the meta folders (`22-infrastructure/`, `23-audits/`). The empty slot is **intentional and load-bearing**: it gives auditors and AI codegen tools a deterministic visual break between "what the product is" (`00-`–`20-`) and "how it runs / how we audit it" (`22-`+). Do NOT fill this slot. The folder name `spec/21-app/` is unrelated to this numeric slot and must not be confused with it. SI-001 was closed at S3 cosmetic on 2026-04-20 with this rule. |

## 3. Intra-folder file sequence

- Files inside a numbered folder MUST also be a contiguous `NN-` sequence (excluding the exemptions in §1).
- A folder MUST contain: `readme.md`, `00-overview.md`, and `flow-diagram.mmd`.

### Exempt folders (do NOT need `readme.md` / `00-overview.md` / `flow-diagram.mmd`)

| Folder | Why exempt |
|---|---|
| `templates/` | Holds reusable scaffold files for OTHER folders to copy. Has its own `readme.md` only; no overview or diagram needed because it is process-meta, not a domain. |
| `06-ui-ux/wireframes/` | Sub-folder of `06-ui-ux/`. Inherits parent's overview/diagram. Has its own `readme.md` and `00-overview.md` for navigability but `flow-diagram.mmd` is optional. |

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

### Allowed TBD/TODO (documented intentional cases)

| File | Line(s) | Why permitted |
|---|---|---|
| `22-infrastructure/03-env-vars.md` | ~93 | Describes a linter **pattern** (meta-code), not a missing spec value. |
| `23-audits/*.md` | various | Historical audit prose; append-only archive. TBD marks items that were genuinely unknown at the time of writing. |
| `10-licensing-billing/15-sku-map.md` | 42-48 | Paddle SKU placeholders (`pro_paddle_TBD`, `team_paddle_TBD`, etc.) await Paddle account provisioning. The `_TBD` suffix is the **canonical placeholder format** for unprovisioned external IDs — it is intentional and machine-detectable. Replace with real SKU values when the Paddle account is created. |

## 8. How violations become issues

When an audit finds a violation of any rule above:
1. Append a row to `02-current-issues.md` with the rule number (e.g. "violates §1 row 3").
2. The fix is *not* applied here. It lands in the owning folder once the user approves the phase in `03-phase-plan.md`.

## 9. Withdrawn endpoints (locked)

When a previously-specced endpoint is removed (e.g. replaced by a managed service, deprecated before launch, or design-rejected), the path string often must remain in the spec as historical context — but it must not pollute the endpoint-parity grep that powers `00-overview.md` audits.

### 9.1 Marker convention

Withdrawn endpoint paths in spec text MUST be wrapped in **strikethrough** (`~~...~~`) AND prefixed with the literal token `WITHDRAWN:`. The combination is unambiguous, human-readable, and machine-detectable.

**Format:** `~~WITHDRAWN: METHOD /v1/path~~`

**Example (canonical):**

> The previously-specced ~~WITHDRAWN: POST /v1/realtime/ticket~~ ticket-exchange flow has been replaced by Supabase Realtime per `08-sharing-collab/14-realtime-transport.md`.

### 9.2 Conformance

The endpoint-parity grep used by Phase-12-style sweeps MUST exclude any path inside a `~~WITHDRAWN: ...~~` wrapper:

```
grep -rhoE '`(GET|POST|PUT|PATCH|DELETE) /v1/[^` ?&]+`' spec/21-app/ \
  | tr -d '`' | sort -u
# Then subtract:
grep -rhoE '~~WITHDRAWN: (GET|POST|PUT|PATCH|DELETE) /v1/[^~]+~~' spec/21-app/ \
  | sed -E 's/~~WITHDRAWN: ([^~]+)~~/\1/' | sort -u
```

### 9.3 What does NOT need the marker

- Paths inside fenced code blocks describing protocol history (` ``` ... ``` ` is already excluded by the grep that targets backtick-wrapped inline paths).
- Paths in `23-audits/` files (entire folder is append-only history, exempt per §1 audits exemption).
- Paths in `13-spec-issues/` files (this folder enumerates defects, not active spec).
