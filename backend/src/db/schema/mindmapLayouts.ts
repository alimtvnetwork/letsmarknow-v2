import { pgTable, uuid, varchar, jsonb, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { uuidv7 } from "../utils/uuidv7.js";
import { accounts } from "./accounts.js";
import { organizations } from "./organizations.js";

/**
 * MindmapLayouts table - Persisted layout snapshots for Mindmap View
 * Spec: 02-spec/21-app/02-data-model/13-mindmap-layout.md
 * API: 02-spec/21-app/03-api-endpoints/23-mindmap-layouts.md
 */
export const mindmapLayouts = pgTable(
  "mindmap_layouts",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    scopeType: varchar("scope_type", { length: 32 }).notNull(),
    scopeId: uuid("scope_id").notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    sharedWithOrg: boolean("shared_with_org").default(false).notNull(),
    viewport: jsonb("viewport")
      .default({ x: 0, y: 0, zoom: 1.0 })
      .notNull(),
    nodes: jsonb("nodes").default([]).notNull(),
    edges: jsonb("edges").default([]).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
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
