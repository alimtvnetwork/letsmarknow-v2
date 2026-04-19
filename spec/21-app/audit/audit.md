# Spec Audit Report — `spec/21-app/`

**Generated:** 2026-04-18 (Asia/Kuala_Lumpur, UTC+8)
**Scope:** All 195 markdown files under `spec/21-app/`.
**Method:** Static cross-reference scan + locked-rule reconciliation between top-level READMEs (`00–20`), the data model (`02-data-model/`), the API surface (`03-api-endpoints/`), and the feature/UX layers (`05`, `06`, `07`, `08`).

> Severity legend
> 🔴 **Blocker** — contradicts a locked rule, will cause downstream code/DB/API divergence.
> 🟠 **Major** — broken cross-reference or missing file that other sections depend on.
> 🟡 **Minor** — cosmetic, naming drift, or stale reference; safe to defer but should be cleaned up before AI hand-off.

---

## 1. Executive summary

| Category | Blocker | Major | Minor | Total |
|---|---:|---:|---:|---:|
| Missing folders / files | 0 | 4 | 2 | 6 |
| Broken cross-references | 0 | 7 | 5 | 12 |
| Naming / vocabulary drift | 1 | 3 | 4 | 8 |
| Locked-rule contradictions | 2 | 4 | 1 | 7 |
| Schema/contract drift | 1 | 3 | 2 | 6 |
| **Total** | **4** | **21** | **14** | **39** |

Overall the spec tree is **internally consistent at the conceptual level** (hierarchy, plans, sharing modes, roles all line up). The defects are concentrated in three places:

1. Identifier type drift (**ULID** vs **UUIDv7**) — spread across `07`, `08`, plus parts of `09`/`17`.
2. Role enum drift (`billing` role appears in `09`/`03` but is absent from the canonical glossary and `02-data-model/08-member.md`).
3. A handful of broken file paths that were renamed during the build-out (`13-share-link.md`, `roles-permissions.md`, `invite-only.md`, `16-delete-with-undo.md`, `01-plans-matrix.md`, `14-support-system.md`) and a missing folder index (`13-import-export/` is referenced everywhere but the folder does not exist — content lives under `11-import-export/`).

None of the defects require re-architecting. All are mechanical fixes.

---

## 2. Missing files & folders

| # | Sev | Referenced as | Actually exists at | Fix |
|---|---|---|---|---|
| M-1 | 🟠 | `13-import-export/` (cited in `README.md`, `00-overview/04-competitive-analysis.md`, `01-information-architecture/01-hierarchy.md`, `03-api-endpoints/04-organizations.md`) | `11-import-export/` | Decide canonical number. Recommend keeping `11-` (already populated, 10 files) and global-replace all `13-import-export` references. |
| M-2 | 🟠 | `10-licensing-billing/01-plans-matrix.md` (cited 8+ times) | `10-licensing-billing/pricing-and-plans.md` | Either rename file or update all callers. Recommend rename to `01-plans-matrix.md` because that name is referenced by glossary, hierarchy, competitive-analysis, license entity, and root README. |
| M-3 | 🟠 | `10-licensing-billing/14-support-system.md` (cited in `00-overview/04-competitive-analysis.md` row 17) | does not exist | Create stub or repoint to `13-cancellations-and-refunds.md` / external help-center spec. |
| M-4 | 🟠 | `08-sharing-collab/13-share-link.md` (cited in `01-information-architecture/01-hierarchy.md:125` and root `README.md:197`) | does not exist; closest is `01-share-model.md` + `05-share-link-security.md` (in `19-security-privacy/`) | Repoint to `08-sharing-collab/01-share-model.md` or create dedicated `13-share-link.md`. |
| M-5 | 🟡 | `08-sharing-collab/invite-only.md` (cited in `01-information-architecture/01-hierarchy.md:86` and root `README.md:200`) | exists as `08-sharing-collab/04-invite-only-shares.md` | Update callers to `04-invite-only-shares.md`. |
| M-6 | 🟡 | `08-sharing-collab/roles-permissions.md` (cited in `02-data-model/08-member.md:50` and root `README.md:201`) | exists as `08-sharing-collab/05-permissions-matrix.md` | Update callers. |
| M-7 | 🟡 | `07-features/16-delete-with-undo.md` (cited in `01-information-architecture/01-hierarchy.md:97` and root `README.md:193`) | does not exist; behavior is split across `07-features/10-bulk-operations.md` + `12-history-undo/02-undo-redo.md` + `05-web-app/09-trash.md` | Either create thin pointer file or remove reference. |

Folder numbering also skips **`13-`** entirely (jump from `12-history-undo/` to `14-search/`). This is intentional re-numbering from earlier import/export reshuffle but should be documented in root `README.md` to avoid future confusion.

---

## 3. Broken cross-references (path-level)

All inbound references that resolve to a non-existent path:

| # | Sev | From | Bad target |
|---|---|---|---|
| X-1 | 🟠 | `README.md:213` | `10-licensing-billing/01-plans-matrix.md` |
| X-2 | 🟠 | `00-overview/02-glossary.md:76` | `10-licensing-billing/01-plans-matrix.md` |
| X-3 | 🟠 | `00-overview/04-competitive-analysis.md:13,83,84,97` | `10-licensing-billing/01-plans-matrix.md` |
| X-4 | 🟠 | `00-overview/04-competitive-analysis.md:96` | `10-licensing-billing/14-support-system.md` |
| X-5 | 🟠 | `01-information-architecture/01-hierarchy.md:78,102,125,172,220` | `13-import-export/`, `08-sharing-collab/13-share-link.md`, `08-sharing-collab/invite-only.md`, `10-licensing-billing/01-plans-matrix.md`, `07-features/16-delete-with-undo.md` |
| X-6 | 🟠 | `02-data-model/10-license.md:39` | `10-licensing-billing/01-plans-matrix.md` |
| X-7 | 🟠 | `02-data-model/08-member.md:50` | `08-sharing-collab/roles-permissions.md` |
| X-8 | 🟡 | `03-api-endpoints/04-organizations.md:234` | `13-import-export/` |
| X-9 | 🟡 | `09-auth-accounts/01-identity-model.md:58` | `08-sharing-collab/05-permissions-matrix.md` (exists ✓) — but 01-identity-model.md itself is **not listed in `09-auth-accounts/README.md`'s file table**. |
| X-10 | 🟡 | `09-auth-accounts/07-org-membership.md:30` | same as X-9 |
| X-11 | 🟡 | `19-security-privacy/README.md` | references `05-share-link-security.md` (exists ✓) but the *parent* folder name is referenced inconsistently as `19-security-privacy` vs `security-privacy` in other folders' READMEs. |
| X-12 | 🟡 | Root `README.md:308` | "13-import-export" listed in master table; folder is actually `11-import-export`. |

---

## 4. Naming / vocabulary drift (vs `00-overview/02-glossary.md`)

The glossary is **LOCKED** — any deviation is a bug per the project README and the user's documentation rules. Findings:

| # | Sev | Where | Drift | Glossary rule |
|---|---|---|---|---|
| N-1 | 🔴 | `09-auth-accounts/01-identity-model.md:49,58`, `03-api-endpoints/11-members-invites.md:14,80` | Adds `billing` as a role | Glossary defines exactly: `Owner`, `Admin`, `Editor`, `Viewer`, `Guest`. `02-data-model/08-member.md` enum is `owner\|admin\|editor\|viewer`. Either the glossary must add `Billing` OR the API/identity-model must drop it. **Pick one and propagate.** |
| N-2 | 🟠 | `09-auth-accounts/01-identity-model.md` uses **"Org"** as primary noun | Glossary mandates **"Organization"** in all spec text and UI strings | Global replace `Org` → `Organization` in narrative prose; keep `org_id` as a column name (allowed). |
| N-3 | 🟠 | `08-sharing-collab/01-share-model.md` calls the entity **`Share`** with sub-entity **`ShareLink`**, while `02-data-model/07-share.md` defines a single `Share` with embedded slug/mode | Two-layer model (`Share` + multiple `ShareLink`s) vs single-layer model | Reconcile. Recommendation: keep the **single-layer** model from `02-data-model/07-share.md` for v1 (matches glossary "Share link is the public URL of a Share") and demote `01-share-model.md` to a future-v2 design note, or migrate `02-data-model/07-share.md` to two layers. **As written they cannot both ship.** See §6 schema drift. |
| N-4 | 🟠 | `08-sharing-collab/01-share-model.md` uses URL form `letsmarknow.com/t/{slug}` ✓ but introduces `letsmarknow.com/e/{slug}` for embeds and `share.acme.com/{slug}` for custom domains | Glossary only locks `/t/{slug}` | Add `/e/{slug}` and custom-domain pattern to glossary (or remove from `01-share-model.md`). |
| N-5 | 🟡 | Multiple files use `Workspace` interchangeably with `Organization` in prose | Glossary forbids `Workspace` as a content container | Audit and replace. |
| N-6 | 🟡 | `15-visualization/05-tabextend-column-view.md` filename uses lowercase camel-style; rest of folder uses kebab-case | Style consistency | Rename to `05-tabextend-column-view.md` (already kebab — confirm) or `column-view.md`. |
| N-7 | 🟡 | `Account` vs `User` — glossary mandates `Account`. `04-extension/03-service-worker.md:30` uses `account_id` ✓; some narrative sections still say "user" | Replace narrative uses. |
| N-8 | 🟡 | `01-information-architecture/01-hierarchy.md` uses `Workspaces / Spaces / Collections` in §7 Mermaid diagram comment | Should be `Organizations / Spaces / Collections`. |

---

## 5. Locked-rule contradictions

Cross-section conflicts where two files state mutually incompatible rules:

| # | Sev | Rule | Conflict |
|---|---|---|---|
| L-1 | 🔴 | **Identifier type** | `01-information-architecture/01-hierarchy.md §3.8` and `02-data-model/README.md` lock IDs as **UUIDv7**. But `07-features/04-collections.md`, `07-features/05-groups.md`, all of `08-sharing-collab/01-share-model.md`, `08-sharing-collab/07-comments-and-reactions.md`, `08-sharing-collab/09-audit-log.md`, `09-auth-accounts/01-identity-model.md`, `17-admin-org/04-audit-log.md` declare IDs as **ULID**. Pick one. The data-model contract wins → global replace **ULID → UUIDv7**. |
| L-2 | 🔴 | **Free-tier members** | `01-information-architecture/01-hierarchy.md:172` says Free = **1 member**. `09-auth-accounts/01-identity-model.md §2` says Free Personal Org allows **0 collaborators** (owner only) and Pro allows **3**. Hierarchy says Pro = **5**. `08-sharing-collab/01-share-model.md:116` & `07-features/06-tags.md:52` quote different Free caps for shares (3) and tags (50/10) without cross-referencing the plans matrix. **Resolve in `01-plans-matrix.md` once and reference everywhere.** |
| L-3 | 🟠 | **Share modes** | `02-data-model/07-share.md` defines modes `public\|password\|invite_only`. `08-sharing-collab/01-share-model.md` defines modes `public\|password\|invite` (no `_only` suffix) PLUS an additional `embed` URL form. Standardize on `invite_only` (matches API + DB convention elsewhere). |
| L-4 | 🟠 | **Audit-log location** | Two audit-log specs exist: `08-sharing-collab/09-audit-log.md` (Pro+ share-scoped) and `17-admin-org/04-audit-log.md` (org-scoped, partitioned, HMAC-signed). They overlap on event schema. Clarify: org audit log is the source of truth; share audit is a **filtered view** of it. Add a cross-reference. |
| L-5 | 🟠 | **Soft-delete grace** | `01-information-architecture/01-hierarchy.md §3.5` says **30 days** in trash. `17-admin-org/05-data-export-delete.md` says **30 days reversible**. ✓ consistent. But `19-security-privacy/04-gdpr-ccpa.md` references **immediate hard-delete on DSR request** without specifying that this overrides the 30-day grace. Clarify precedence: GDPR DSR overrides grace; document in both files. |
| L-6 | 🟠 | **Personal Org member cap** | `09-auth-accounts/01-identity-model.md §2` says "On Pro, up to 3 collaborators in Personal Org; on Team, must convert". `01-information-architecture/01-hierarchy.md:172` says Pro Org = 5 members. Two different caps for "Pro". Reconcile in `01-plans-matrix.md`. |
| L-7 | 🟡 | **Role enum extension** | `02-data-model/09-history-event.md:20` adds `system` to the role enum (`owner\|admin\|editor\|viewer\|system`). Other files only allow the four user roles. Document `system` as a synthetic actor (already done in `09-auth-accounts/01-identity-model.md §5` for service principals, but uses `actor_kind="api_token"` instead of `role=system`). Unify. |

---

## 6. Schema / contract drift

Concrete field-level disagreements between `02-data-model/` (the contract) and downstream files:

| # | Sev | Entity | Drift |
|---|---|---|---|
| S-1 | 🔴 | **Share** | `02-data-model/07-share.md` is single-table (slug, mode, password_hash on Share itself). `08-sharing-collab/01-share-model.md` splits into `Share` + `ShareLink` + `ShareInvite` + `ShareView`. Pick one. **As written, the API in `03-api-endpoints/10-shares.md` cannot satisfy both shapes.** |
| S-2 | 🟠 | **Member** | `02-data-model/08-member.md` has `space_access`/`space_ids` for explicit Space scoping. `09-auth-accounts/01-identity-model.md` `Member` table omits these and instead exposes `removed_at` + `last_active_at` only. Add Space-access fields to 01-identity-model.md or remove from 08-member.md. |
| S-3 | 🟠 | **Account** | `09-auth-accounts/01-identity-model.md` adds `mfa_totp_secret_enc`, `mfa_recovery_codes_enc`, `password_hash` (argon2id). `02-data-model/` has no `11-account.md` file at all — Account is implicitly defined only by reference. Create `02-data-model/11-account.md` as the canonical contract. |
| S-4 | 🟠 | **Org** | Same as S-3: `09-auth-accounts/01-identity-model.md` defines Org fields (`slug`, `kind`, `plan_id`, `brand`, `domain`) but `02-data-model/01-organization.md` is the canonical file. Ensure both lists match field-for-field. |
| S-5 | 🟡 | **Item.url scheme** | `02-data-model/05-item.md` allows `http\|https\|chrome-extension\|file`. `19-security-privacy/05-share-link-security.md` should explicitly forbid `chrome-extension://` and `file://` from being exposed via Shares (data leak risk). Add invariant. |
| S-6 | 🟡 | **Position** | Hierarchy says position increments by **1024**; `02-data-model/05-item.md` confirms. `07-features/` files don't restate but `06-ui-ux/09-drag-and-drop.md` should reference the rebalance behavior. Add cross-link. |

---

## 7. Things that are **correct and consistent** (worth confirming)

To save the next reviewer time, these were checked and found **clean**:

- ✅ Hierarchy `Account → Organization → Space → Collection → Group? → Item` is consistently enforced across `00`, `01`, `02`, `03`, `05`, `07`.
- ✅ Public share URL pattern `letsmarknow.com/t/{slug}` is consistent across `00-overview`, `02-data-model`, `03-api-endpoints`, `05-web-app` (modulo §4 N-4 about `/e/` and custom domains).
- ✅ The four sharing modalities (public / password / expiring / invite-only) match across glossary, data model, API, and UI.
- ✅ Plans (Free / Pro / Team / Lifetime) are consistently named.
- ✅ Soft-delete + 30-day trash + Undo retention is consistent (modulo the GDPR override clarification in L-5).
- ✅ Audit-block fields (`id`, `created_at`, `updated_at`, `deleted_at`, `created_by`, `updated_by`) are consistently applied to every entity contract.
- ✅ HSL-only color rule (`06-ui-ux/`) and shadcn+Radix base is consistent.
- ✅ Roadmap phases 0–4 sequence cleanly with no feature appearing in two phases at once.
- ✅ All 195 markdown files parse as valid markdown (no broken tables, no unclosed code fences).

---

## 8. Recommended fix order (minimum-effort path to consistency)

Each step is a self-contained PR.

1. **Rename `pricing-and-plans.md` → `01-plans-matrix.md`** (or vice-versa) and globally search-replace the broken reference. Fixes M-2, X-1/2/3/5/6.
2. **Decide `11-` vs `13-` for import-export** and update all callers. Fixes M-1, X-5/8/12.
3. **Global replace `ULID` → `UUIDv7`** in `07/`, `08/`, `09/`, `17/`. Fixes L-1.
4. **Reconcile Share model** — either expand `02-data-model/07-share.md` to include `ShareLink` + `ShareInvite` tables, or demote `08-sharing-collab/01-share-model.md` to "v2 future". Fixes S-1, L-3, N-3.
5. **Lock the role enum** in glossary: add `Billing` (and `System` as synthetic) → propagate to `02-data-model/08-member.md` + `09-history-event.md`. Fixes N-1, L-7.
6. **Author `01-plans-matrix.md` with the canonical number table** (members, items, shares, tags, collections per Free/Pro/Team/Lifetime). Resolves L-2, L-6.
7. **Create stub files** for `13-share-link.md`, `16-delete-with-undo.md`, `14-support-system.md`, `02-data-model/11-account.md`. Fixes M-3/4/7, S-3.
8. **Update broken filename references** to `04-invite-only-shares.md`, `05-permissions-matrix.md`. Fixes M-5/6, X-7.
9. **Add GDPR override note** in `01-information-architecture/01-hierarchy.md §3.5` and in `17-admin-org/05-data-export-delete.md`. Fixes L-5.
10. **Cosmetic sweep** for `Org → Organization`, `User → Account`, `Workspace → Organization` in narrative prose. Fixes N-2/5/7/8.

Estimated total: **~3 hours of mechanical edits**, no design re-think required.

---

## 9. Hand-off note for downstream AI models

When loading this spec into another model:

- Treat `00-overview/02-glossary.md` and `01-information-architecture/01-hierarchy.md` as **the constitution** — they override any conflicting later file.
- Treat `02-data-model/` as the **schema contract** — when in doubt, the data-model file wins over `08-sharing-collab/01-share-model.md` and `09-auth-accounts/01-identity-model.md`.
- The unresolved items in §5 and §6 above are **the only places the spec is currently self-contradictory**. Do not generate code for any of them until L-1, L-2, S-1, and N-1 are resolved.

---

*Audit produced by static analysis. No files were modified by this audit.*
