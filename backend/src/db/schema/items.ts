import { pgTable, uuid, varchar, text, timestamp, boolean, doublePrecision, index } from "drizzle-orm/pg-core";
import { uuidv7 } from "../utils/uuidv7.js";
import { accounts } from "./accounts.js";
import { collections } from "./collections.js";
import { groups } from "./groups.js";
import { organizations } from "./organizations.js";
import { spaces } from "./spaces.js";

/**
 * Items table - Saved tabs, links, and bookmarks
 * Spec: 02-spec/21-app/02-data-model/05-item.md
 * Master Cascade: group_id ON DELETE SET NULL (Item survives Group deletion)
 */
export const items = pgTable(
  "items",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    spaceId: uuid("space_id").references(() => spaces.id, {
      onDelete: "cascade",
    }),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    groupId: uuid("group_id").references(() => groups.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    url: text("url").notNull(),
    description: text("description"),
    faviconUrl: text("favicon_url"),
    color: varchar("color", { length: 32 }).default("none").notNull(),
    isStarred: boolean("is_starred").default(false).notNull(),
    position: doublePrecision("position").default(0).notNull(),
    source: varchar("source", { length: 32 }).default("manual").notNull(),
    lastVisitedAt: timestamp("last_visited_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => accounts.id, {
      onDelete: "set null",
    }),
    updatedBy: uuid("updated_by").references(() => accounts.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
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
