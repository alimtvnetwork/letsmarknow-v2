import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { uuidv7 } from "../../utils/uuidv7.js";
import { accounts } from "./accounts.js";
import { collections } from "./collections.js";
import { organizations } from "./organizations.js";
import { spaces } from "./spaces.js";

/**
 * Groups table - Sub-sections within a Collection (SQLite)
 * Spec: 02-spec/21-app/02-data-model/04-group.md
 */
export const groups = sqliteTable(
  "groups",
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
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: real("position").default(0).notNull(),
    color: text("color").default("none").notNull(),
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
    index("groups_org_id_idx").on(table.organizationId),
    index("groups_collection_id_idx").on(table.collectionId),
    index("groups_position_idx").on(table.collectionId, table.position),
    index("groups_deleted_at_idx").on(table.deletedAt),
  ]
);

/**
 * Group Items table - Ordering items within groups
 */
export const groupItems = sqliteTable(
  "group_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    itemId: text("item_id").notNull(),
    position: real("position").default(0).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("group_items_group_id_idx").on(table.groupId),
    index("group_items_item_id_idx").on(table.itemId),
  ]
);
