import { pgTable, uuid, varchar, text, timestamp, boolean, doublePrecision, index } from "drizzle-orm/pg-core";
import { uuidv7 } from "../utils/uuidv7.js";
import { accounts } from "./accounts.js";
import { organizations } from "./organizations.js";
import { spaces } from "./spaces.js";
import { collectionKindEnum, viewModeEnum } from "./enums.js";

/**
 * Collections table - Groups of bookmarks/tabs within a Space
 * Spec: 02-spec/21-app/02-data-model/03-collection.md
 */
export const collections = pgTable(
  "collections",
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
    accountId: uuid("account_id").references(() => accounts.id, {
      onDelete: "cascade",
    }),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 63 }),
    description: text("description"),
    kind: collectionKindEnum("kind").default("manual").notNull(),
    color: varchar("color", { length: 32 }).default("none").notNull(),
    isStarred: boolean("is_starred").default(false).notNull(),
    position: doublePrecision("position").default(0).notNull(),
    viewMode: viewModeEnum("view_mode").default("grid").notNull(),
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
    index("collections_org_id_idx").on(table.organizationId),
    index("collections_space_id_idx").on(table.spaceId),
    index("collections_account_kind_idx").on(table.accountId, table.kind),
    index("collections_starred_idx").on(table.organizationId, table.isStarred),
    index("collections_position_idx").on(table.spaceId, table.position),
    index("collections_deleted_at_idx").on(table.deletedAt),
  ]
);
