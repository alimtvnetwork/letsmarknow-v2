# Permissions Matrix

Single source of truth for what every role can do across every entity.

Server enforces; client mirrors for UX. Drift = bug.

> 🤖 **Machine-readable mirror:** [`permissions-matrix.json`](./permissions-matrix.json) ships the same matrix as a typed JSON document. RLS policies, server middleware checks, and client guards SHOULD be code-generated from the JSON, not transcribed from this prose. If the two ever disagree, the JSON wins and this file is the bug.

---

## 1. Roles

| Role | Where granted | Notes |
|---|---|---|
| **Owner** | Org-level | Full control + billing; one minimum per Org |
| **Admin** | Org-level | Full control except billing & ownership transfer |
| **Editor** | Org-level | Read/write content; cannot manage members |
| **Viewer** | Org-level | Read-only |
| **Billing** | Org-level | Billing + invoices only; no content access |
| **Share viewer** | Per-share | Read-only (or comment/react if enabled) |

## 2. Org-level actions

| Action | Owner | Admin | Editor | Viewer | Billing |
|---|:---:|:---:|:---:|:---:|:---:|
| View Org dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit Org name/logo | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete Org | ✅ | ❌ | ❌ | ❌ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage members (invite/remove/role) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage SSO/SAML (Team) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage billing / view invoices | ✅ | ❌ | ❌ | ❌ | ✅ |
| Configure brand (Pro+) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Configure webhooks (Team) | ✅ | ✅ | ❌ | ❌ | ❌ |
| View audit log (Team) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Configure feature flags / rollouts | ❌ | ❌ | ❌ | ❌ | ❌ |

## 3. Space-level actions

| Action | Owner | Admin | Editor | Viewer |
|---|:---:|:---:|:---:|:---:|
| Create Space | ✅ | ✅ | ✅ (within Org) | ❌ |
| Rename / recolor / re-icon | ✅ | ✅ | ✅ (own) | ❌ |
| Delete / restore Space | ✅ | ✅ | ✅ (own) | ❌ |
| Set Space-level visibility | ✅ | ✅ | ✅ (own) | ❌ |
| Manage Space members (Pro+) | ✅ | ✅ | ❌ | ❌ |

## 4. Collection / Group / Item actions

| Action | Owner | Admin | Editor | Viewer |
|---|:---:|:---:|:---:|:---:|
| Create / edit / delete | ✅ | ✅ | ✅ | ❌ |
| Move across Spaces | ✅ | ✅ | ✅ | ❌ |
| Star (private) | ✅ | ✅ | ✅ | ✅ |
| Pin (collaborative) | ✅ | ✅ | ✅ | ❌ |
| Add tags | ✅ | ✅ | ✅ | ❌ |
| Add notes / descriptions | ✅ | ✅ | ✅ | ❌ |
| Restore from Trash | ✅ | ✅ | ✅ (own) | ❌ |
| Permanent purge | ✅ | ✅ | ❌ | ❌ |

## 5. Sharing actions

| Action | Owner | Admin | Editor | Viewer |
|---|:---:|:---:|:---:|:---:|
| Create Share (any scope) | ✅ | ✅ | ✅ | ❌ |
| Modify Share settings | ✅ | ✅ | ✅ (own) | ❌ |
| Set / change memorable `lmk/` slug | ✅ | ✅ | ✅ (own) | ❌ |
| Repoint orphaned Share to new target | ✅ | ✅ | ✅ (own) | ❌ |
| Revoke any Share | ✅ | ✅ | ✅ (own) | ❌ |
| Revoke another member's Share | ✅ | ✅ | ❌ | ❌ |
| Handle access requests (approve/decline) | ✅ | ✅ | ❌ | ❌ |
| Configure custom domain | ✅ | ✅ | ❌ | ❌ |

**Notes.**
- "Create Share" and "Modify Share settings" both cover **either** URL surface (the random `/t/{slug}` and the optional memorable `lmk/{...}`) — they are the same Share row per `02-data-model/07-share.md`. No separate permission for the memorable surface itself; the row above ("Set / change memorable `lmk/` slug") exists only to surface the `custom_share_slug` entitlement requirement (Pro+).
- "Repoint orphaned Share" is the recovery action defined in `08-sharing-collab/13-share-link.md` §7 and invariant §10 of `02-data-model/07-share.md`. The new target must belong to the same Org and have the same `target_type`. Editors may only repoint Shares they originally created.
- "Handle access requests" covers responding to `share.access_requested` events emitted by the request-access page (`08-sharing-collab/13-share-link.md` §8).


## 6. Comments / reactions (Pro+)

| Action | Owner | Admin | Editor | Viewer | Share viewer |
|---|:---:|:---:|:---:|:---:|:---:|
| Read comments | ✅ | ✅ | ✅ | ✅ | ✅ if enabled |
| Add comment | ✅ | ✅ | ✅ | ❌ | ✅ if enabled |
| Edit own comment | ✅ | ✅ | ✅ | ❌ | ✅ |
| Delete own comment | ✅ | ✅ | ✅ | ❌ | ✅ |
| Delete any comment | ✅ | ✅ | ❌ | ❌ | ❌ |
| React (emoji) | ✅ | ✅ | ✅ | ✅ | ✅ if enabled |

## 7. Personal Org

The default Personal Org has only the Account holder as Owner; cannot add members on Free. Pro grants up to 3 collaborators; Team requires Team plan and uses a normal Org.

## 8. Custom Permissions (Team-tier, future)

- v1: hard-coded role bundles above.
- v2: custom roles with capability flags. Out of scope for v1; placeholder column reserved in schema.

## 9. Edge cases

| Case | Behavior |
|---|---|
| Last Owner tries to leave Org | Blocked; must transfer ownership first |
| Member demoted while editing | Save fails with 403; UI shows banner with explanation |
| Editor creates share, later demoted to Viewer | Share remains active; only Owner/Admin can revoke |
| Org plan downgraded removing role (e.g., no Billing role on Free) | Billing role users converted to Viewer; notified |
| Member removed mid-session | All requests return 401; client signs out gracefully |

## 10. Enforcement layers

1. **JWT claims** — role per Org embedded; refreshed on change.
2. **Server middleware** — checks role + ownership per route.
3. **Database RLS (Lovable Cloud)** — secondary defense via `auth.uid()` + role check function.
4. **Client guards** — disable buttons + tooltips ("Editors can't manage members").

Any action MUST pass all three (1–3); client guard alone never sufficient.

## 11. Audit (Team)

Every permission-affecting action emits a `member.role_changed` / `share.created` / `space.acl_changed` etc. event in `09-audit-log.md`.

## 12. Telemetry

- `permission.denied_client` `{ action, role }` (UX hint blocked it)
- `permission.denied_server` `{ action, role }` (defense-in-depth)
- `permission.role_changed` `{ from, to }`

## 13. Tests

- Matrix table → generated test cases (every cell asserted via API call).
- RLS regression tests on Lovable Cloud.
- Demotion-mid-session E2E.
- Last-Owner-leave guard.
