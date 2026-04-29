# Glossary

> 🔒 **These names are LOCKED.** Every other file in this spec, every UI string, every API field, and every database column MUST use these exact terms. Synonyms from Toby, Tab Extend, or other tools are listed for reference only.

## Core hierarchy

| Term | Definition | Toby equivalent | Tab Extend equivalent |
|---|---|---|---|
| **Account** | A single human user authenticated by email + password / OAuth / SSO. Owns Organizations or is a Member of them. | "User" | "User" |
| **Organization** | The top-level container, a.k.a. the "workspace bubble" shown as a colored avatar (PE / AU / XL …) in the left rail. Holds members, billing, and Spaces. One Account can own/belong to many Organizations. | "Workspace" | "Workspace" |
| **Space** | A logical grouping inside an Organization (e.g. "Personal", "Evatix", "Gaming PC"). Contains Collections. Sharable as a unit. | "Space" | "Workspace" (they use the same word for two levels — we do not) |
| **Collection** | The primary container of saved tabs inside a Space (e.g. "Marketing Improvements", "Quick Tools"). Has color, icon, tags, notes, description. Sharable as a unit. | "Collection" | "Category" / "Group" |
| **Group** | An OPTIONAL sub-container inside a Collection (e.g. "Atto Property" inside "Atto Quick"). Same capabilities as a Collection except cannot contain another Group (max 1 level of nesting in v1). Sharable as a unit. | — (Toby has no sub-groups) | "Group inside group" |
| **Item** | A single saved tab: URL + title + favicon (+ description, tags, notes, position, timestamps). Lives directly inside a Collection or a Group. Sharable as a single-item link. | "Card" / "Tab" | "Site" / "Tab" |

> 📌 **Nesting rule v1:** `Organization → Space → Collection → Group? → Item`. Maximum 1 level of Group inside Collection. No Group-inside-Group.

## Membership & roles

| Term | Definition |
|---|---|
| **Member** | An Account that belongs to an Organization with a specific Role. |
| **Owner** | Created the Organization. Exactly one per Organization. Full control including delete and ownership transfer. |
| **Admin** | Full control except delete-organization and transfer-ownership. |
| **Editor** | Can create/update/delete Spaces, Collections, Groups, Items they have access to. |
| **Viewer** | Read-only across the Organization or a specific Space they were invited to. |
| **Billing** | Access only to billing, invoices, and seat management. No content access. Counts as a Member but does not consume a content seat. |
| **Guest** | A non-Member who accesses content via a Share link (may be authenticated or anonymous). NOT stored as a Member. |
| **System** | Synthetic actor used in audit/history logs for cron jobs, webhooks, and API tokens. Never a Member. |

## Sharing

| Term | Definition |
|---|---|
| **Share** | A configuration that exposes a Space, Collection, Group, or Item to people outside the Organization. |
| **Share link** | The public URL of a Share, format `letsmarknow.com/t/{slug}`. |
| **Slug** | The unique identifier in a Share link. Auto-generated random by default; custom in Pro+. |
| **Public Share** | Anyone with the link can view. No auth required. |
| **Password Share** | Anyone with the link AND the password can view. |
| **Expiring Share** | Stops working after a chosen date/time. |
| **Invite-only Share** | Only specific email addresses can view (after authenticating). |
| **Share role** | Per-share permission for invited emails: `viewer` or `editor`. |

## Tabs & windows

| Term | Definition |
|---|---|
| **Open Tab** | A tab currently open in any Chrome window controlled by the user, surfaced in the right-hand "Open Tabs" panel, grouped by **Window**. |
| **Window** | A Chrome browser window. Numbered Window 1, Window 2, … in the Open Tabs panel in the order they were opened. |
| **Save Session** | The action of saving all tabs in the current window (or all windows) into a Collection in one click, optionally closing them. |
| **Jump to Tab** | If an Item's URL matches an Open Tab, focus that tab; otherwise open the URL in a new tab. |
| **Close on Save** | A Save-Session option: after saving, close the saved tabs. |

## Actions & history

| Term | Definition |
|---|---|
| **Action** | Any user-initiated mutation (create, update, delete, move, drag, drop, save-session, share, …). |
| **History Event** | A record of an Action stored in the user's history log. |
| **Undo** | Revert the most recent History Event for the current Account in the current Organization. |
| **Redo** | Re-apply the most recently undone History Event. |
| **History Window** | The retention period in which Undo/Redo works (default: 30 days; configurable per tier). |

## Views

| Term | Definition |
|---|---|
| **List View** | One Item per row, vertical stack. |
| **Grid View** | Items as cards in a responsive grid. |
| **Compact View** | Favicon-only, dense icon grid (Tab Extend "Quick Tools" style). |
| **Mind-map View** | Bubbles representing Workspaces / Spaces / Collections, optionally connected. |
| **Column View** | Tab Extend-style horizontal columns of Collections side by side, scrollable horizontally. |

## Licensing

| Term | Definition |
|---|---|
| **Free** | Default tier. Limited (see `10-licensing-billing/01-plans-matrix.md`). |
| **Pro** | Paid individual tier. No content limits. |
| **Team** | Paid multi-seat tier. Includes SSO, audit log, seat management. |
| **Lifetime** | One-time payment, behaves like Pro forever for one Account. |
| **License Key** | The string that identifies a paid entitlement. Validated by the License Manager. |
| **Seat** | One paid slot in a Team subscription. |
| **Entitlement** | The set of features unlocked by an Account's current license. |

## Misc

| Term | Definition |
|---|---|
| **Tag** | A short label attached to a Collection, Group, or Item. Supports filtering and search. |
| **Star** | A boolean "favorite" flag on a Collection, Group, or Item. |
| **Note** | A short rich-text annotation attached to a Collection, Group, or Item. Plain text + basic formatting. |
| **Description** | A longer free-text field on a Collection, Group, or Item. |
| **Favicon** | The 16×16 / 32×32 site icon associated with an Item. Cached server-side. |
| **Position** | Integer used to order siblings inside a parent. Higher = later. Re-balanced periodically. |
| **Command Palette** | The Ctrl+K dialog for fuzzy-finding actions and content. |

## Forbidden synonyms

Do **not** use these in code or UI:

- ❌ "Folder" → use **Collection** or **Group**.
- ❌ "Bookmark" → use **Item**.
- ❌ "Category" → use **Collection**.
- ❌ "Project" → use **Space**.
- ❌ "Team" (as a content container) → use **Organization**.
- ❌ "Tab group" (Chrome's native feature) → use **Collection** or **Group**.

## External-product mappings

When porting concepts from other bookmark/tab managers, translate their container term using this table. The target term is the canonical one used in our spec.

| External term | Source product | Maps to (ours) | Notes |
|---|---|---|---|
| **Workspace** | Toby | **split** — see below | Toby's "Workspace" plays two roles in their model. We split them: |
| ↳ Workspace (as Collection container) | Toby | **Space** | The grouping that holds Collections. URL paths, hierarchy, and `space_id` foreign keys all use Space. |
| ↳ Workspace (as members/billing/admin scope) | Toby | **Organization** | Member invites, role assignment, billing, audit log, SSO. Surfaced in `17-admin-org/`. |
| **Collection** | Toby | **Collection** | 1:1 mapping. Toby's pinned/starred Collections → our `is_starred` + `starred_pin_position` (see `02-data-model/03-collection.md`). |
| **Tab** (saved) | Toby | **Item** | 1:1. Toby's per-tab color label → our `color_label` enum on Item. |
| **Tab group** (within a Collection) | Toby | **Group** | 1:1 mapping. |
| **Open Tabs panel** | Toby | extension surface | See `04-extension/16-open-tabs-panel.md`. Not a data-model entity. |

**Rationale for the Toby Workspace split:** Toby conflates "container of Collections" and "billing/members boundary" into a single Workspace concept. Our locked hierarchy `Organization → Space → Collection → (Group\|Item)` separates those concerns. Mapping Workspace → Organization alone would invalidate ~200 spec files and the 145-endpoint inventory; mapping to Space alone would lose the admin/billing surface. Split mapping preserves both. Tracked in SI-021 (`13-spec-issues/02-current-issues.md`).
