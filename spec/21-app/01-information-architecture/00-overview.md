# 00 — Information Architecture Folder Overview

> **Purpose.** Define the **logical containment hierarchy** of the product (Org → Space → Collection → Group → Item) so every other folder — data model, API, UI, sharing, permissions, search — agrees on *what contains what*. If two folders disagree on hierarchy, this folder wins.

---

## 1. Responsibilities

1. **Lock the containment tree.** One canonical hierarchy. No alternate trees, no shortcuts.
2. **Define traversal rules.** How parents are discovered from a child, how a child enumerates its descendants, what "ancestor of" means in queries.
3. **Define naming and slug rules** at each level (Org slug, Space slug, share-link slug — though share-link slugs are owned by `08-sharing-collab/13-share-link.md`).
4. **Define the rules for movement.** What can be moved into what, what cannot. (E.g., a Group cannot become a Space; an Item can be in many Groups but exactly one Collection.)
5. **Be the upstream contract** for: data model, API path shapes, permission inheritance, breadcrumbs, search filters, trash restoration paths.

---

## 2. File-by-file behaviour

| File | What it does |
|---|---|
| `01-hierarchy.md` | The canonical Org → Space → Collection → Group → Item tree. Cardinality at each edge, allowed parent transitions, slug rules per level, breadcrumb rendering rules. |
| `readme.md` | Reading order + locked rules summary (cardinalities, single-parent constraint for Items inside a Collection, multi-Group membership). |

---

## 3. Tasks performed by this folder

- **State the hierarchy once.** Org → Space → Collection → Group → Item.
- **Lock multiplicities.** Org has many Spaces; Space has many Collections; Collection has many Groups; Group has many Items; an Item belongs to exactly one Collection but may appear in many Groups within that Collection.
- **Define what crosses scope boundaries** (Tags are org-scoped; Shares can target any node from Space down).
- **Define where Trash lives** (per-Org, mirrors source path so restore is unambiguous — referenced by `05-web-app/09-trash.md` and `12-history-undo/01-event-log.md`).
- **Source for the entire URL path strategy** in `05-web-app/01-routes.md` (`/o/:org/s/:space/c/:collection/...`).

---

## 4. What this folder is NOT

- **Not the data model.** Column-level schema lives in `02-data-model/`.
- **Not permissions.** Inheritance rules and role checks live in `08-sharing-collab/05-permissions-matrix.md` (which *consumes* this hierarchy).
- **Not sharing.** Share-target eligibility is here ("any node Space-down"); the share row format is in `02-data-model/07-share.md`.

---

## 5. Cross-references

- Tables built from this tree: `02-data-model/01-organization.md` … `02-data-model/05-item.md`.
- API paths derived from this tree: `03-api-endpoints/01-conventions.md` §URL shape; `03-api-endpoints/05-spaces.md`, `03-api-endpoints/06-collections.md`, `03-api-endpoints/07-groups.md`, `03-api-endpoints/08-items.md`.
- UI breadcrumbs: `05-web-app/02-shell.md`, `06-ui-ux/13-navigation-patterns.md`.
- Permission inheritance: `08-sharing-collab/05-permissions-matrix.md`.
- Search scoping: `14-search/03-workspace-search.md`, `14-search/04-filters.md`.
