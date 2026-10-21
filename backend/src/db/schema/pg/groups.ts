import { pgTable, uuid, varchar, timestamp, doublePrecision, index } from "drizzle-orm/pg-core";
import { uuidv7 } from "../../utils/uuidv7.js";
import { accounts } from "./accounts.js";
import { collections } from "./collections.js";
import { organizations } from "./organizations.js";
import { spaces } from "./spaces.js";

/**
 * Groups table - Sub-sections within a Collection (e.g. columns in TabExtend mode)
 * Spec: 02-spec/21-app/02-data-model/04-group.md
 */
export const groups = pgTable(
  "groups",
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
    name: varchar("name", { length: 120 }).notNull(),
    position: doublePrecision("position").default(0).notNull(),
    color: varchar("color", { length: 32 }).default("none").notNull(),
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
    index("groups_org_id_idx").on(table.organizationId),
    index("groups_collection_id_idx").on(table.collectionId),
    index("groups_position_idx").on(table.collectionId, table.position),
    index("groups_deleted_at_idx").on(table.deletedAt),
  ]
);
