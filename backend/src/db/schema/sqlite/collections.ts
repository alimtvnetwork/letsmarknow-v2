import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { uuidv7 } from "../../utils/uuidv7.js";
import { accounts } from "./accounts.js";
import { organizations } from "./organizations.js";
import { spaces } from "./spaces.js";

/**
 * Collections table - Groups of bookmarks/tabs within a Space (SQLite)
 * Spec: 02-spec/21-app/02-data-model/03-collection.md
 */
export const collections = sqliteTable(
  "collections",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    spaceId: text("space_id").references(() => spaces.id, {
      onDelete: "cascade",
    }),
    accountId: text("account_id").references(() => accounts.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    slug: text("slug"),
    description: text("description"),
    kind: text("kind").default("manual").notNull(),
    color: text("color").default("none").notNull(),
    isStarred: integer("is_starred", { mode: "boolean" }).default(false).notNull(),
    position: real("position").default(0).notNull(),
    viewMode: text("view_mode").default("grid").notNull(),
    createdBy: text("created_by").references(() => accounts.id, {
      onDelete: "set null",
    }),
    updatedBy: text("updated_by").references(() => accounts.id, {
      onDelete: "set null",
    }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    deletedAt: integer("deleted_at", { mode: "timestamp" }),
  },
  (table) => [
    index("collections_org_id_idx").on(table.organizationId),
    index("collections_space_id_idx").on(table.spaceId),
    index("collections_account_kind_idx").on(table.accountId, table.kind),
    index("collections_starred_idx").on(table.organizationId, table.isStarred),
    index("collections_position_idx").on(table.spaceId, table.position),
    index("collections_deleted_at_idx").on(table.deletedAt),
  ]
);
