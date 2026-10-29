import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { uuidv7 } from "../../utils/uuidv7.js";
import { accounts } from "./accounts.js";
import { collections } from "./collections.js";
import { groups } from "./groups.js";
import { organizations } from "./organizations.js";
import { spaces } from "./spaces.js";

/**
 * Items table - Saved tabs, links, and bookmarks (SQLite)
 * Spec: 02-spec/21-app/02-data-model/05-item.md
 */
export const items = sqliteTable(
  "items",
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
    groupId: text("group_id").references(() => groups.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    url: text("url").notNull(),
    description: text("description"),
    faviconUrl: text("favicon_url"),
    color: text("color").default("none").notNull(),
    isStarred: integer("is_starred", { mode: "boolean" }).default(false).notNull(),
    position: real("position").default(0).notNull(),
    source: text("source").default("manual").notNull(),
    lastVisitedAt: integer("last_visited_at", { mode: "timestamp" }),
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
    index("items_org_id_idx").on(table.organizationId),
    index("items_collection_id_idx").on(table.collectionId),
    index("items_group_id_idx").on(table.groupId),
    index("items_starred_idx").on(table.organizationId, table.isStarred),
    index("items_url_idx").on(table.organizationId, table.url),
    index("items_position_idx").on(table.collectionId, table.position),
    index("items_deleted_at_idx").on(table.deletedAt),
  ]
);
