# 01 — Information Architecture

This folder defines the **exact 5-level hierarchy** of Lets Mark Now and the rules that govern parent/child relationships, sharing scope, ownership, and counting toward plan limits.

Every other folder (data model, API, extension, UI) MUST conform to this structure. If anything in another file contradicts this folder, this folder wins.

## Files

| File | Purpose |
|---|---|
| `hierarchy.md` | The full hierarchy with rules, diagrams, sharing-scope table, counting rules, and edge cases. |

## Quick reference

```
Account
└── Organization (workspace bubble)
    ├── Members (Owner/Admin/Editor/Viewer)
    ├── Subscription
    └── Space
        ├── Sharing settings
        └── Collection
            ├── (color, icon, tags, notes, description, star)
            └── Group?              ← optional, max 1 level
                └── Item            ← also lives directly in Collection
```

> 📌 An **Item** can live either directly inside a **Collection** OR inside a **Group** that lives inside a **Collection**. No deeper nesting in v1.
