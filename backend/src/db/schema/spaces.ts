import { pgTable, uuid, varchar, text, timestamp, boolean, doublePrecision, index } from "drizzle-orm/pg-core";
import { uuidv7 } from "../utils/uuidv7.js";
import { accounts } from "./accounts.js";
import { organizations } from "./organizations.js";

/**
 * Spaces table - Container for Collections within an Organization
 * Spec: 02-spec/21-app/02-data-model/02-space.md
 */
export const spaces = pgTable(
  "spaces",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 63 }).notNull(),
    description: text("description"),
    icon: varchar("icon", { length: 64 }),
    color: varchar("color", { length: 32 }),
    position: doublePrecision("position").default(0).notNull(),
    isPrivate: boolean("is_private").default(false).notNull(),
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
    index("spaces_org_id_idx").on(table.organizationId),
    index("spaces_org_slug_idx").on(table.organizationId, table.slug),
    index("spaces_position_idx").on(table.organizationId, table.position),
    index("spaces_deleted_at_idx").on(table.deletedAt),
  ]
);
