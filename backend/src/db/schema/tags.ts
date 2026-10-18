import { pgTable, uuid, varchar, integer, timestamp, index, uniqueIndex, primaryKey } from "drizzle-orm/pg-core";
import { uuidv7 } from "../utils/uuidv7.js";
import { accounts } from "./accounts.js";
import { items } from "./items.js";
import { organizations } from "./organizations.js";

/**
 * Tags table - Organization-scoped labels
 * Spec: 02-spec/21-app/02-data-model/06-tag.md
 */
export const tags = pgTable(
  "tags",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 64 }).notNull(),
    color: varchar("color", { length: 32 }).default("none").notNull(),
    usageCountCache: integer("usage_count_cache").default(0).notNull(),
    createdBy: uuid("created_by").references(() => accounts.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("tags_org_name_uidx").on(table.organizationId, table.name),
    index("tags_org_id_idx").on(table.organizationId),
  ]
);

/**
 * Item Tags junction table (Many-to-many between Item and Tag)
 */
export const itemTags = pgTable(
  "item_tags",
  {
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.itemId, table.tagId] }),
    index("item_tags_tag_id_idx").on(table.tagId),
  ]
);
