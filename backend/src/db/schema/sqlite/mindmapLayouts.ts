import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { uuidv7 } from "../../utils/uuidv7.js";
import { accounts } from "./accounts.js";
import { organizations } from "./organizations.js";

/**
 * MindmapLayouts table - Persisted layout snapshots for Mindmap View (SQLite)
 * Spec: 02-spec/21-app/02-data-model/13-mindmap-layout.md
 */
export const mindmapLayouts = sqliteTable(
  "mindmap_layouts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    scopeType: text("scope_type").notNull(),
    scopeId: text("scope_id").notNull(),
    name: text("name").notNull(),
    isDefault: integer("is_default", { mode: "boolean" }).default(false).notNull(),
    sharedWithOrg: integer("shared_with_org", { mode: "boolean" }).default(false).notNull(),
    viewport: text("viewport", { mode: "json" })
      .default({ x: 0, y: 0, zoom: 1.0 })
      .notNull(),
    nodes: text("nodes", { mode: "json" }).default([]).notNull(),
    edges: text("edges", { mode: "json" }).default([]).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    deletedAt: integer("deleted_at", { mode: "timestamp" }),
  },
  (table) => [
    index("mindmap_org_scope_idx").on(
      table.organizationId,
      table.scopeType,
      table.scopeId
    ),
    index("mindmap_account_idx").on(table.accountId),
    index("mindmap_org_created_idx").on(table.organizationId, table.createdAt),
  ]
);
