import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { uuidv7 } from "../../utils/uuidv7.js";
import { accounts } from "./accounts.js";
import { organizations } from "./organizations.js";

/**
 * Spaces table - Container for Collections within an Organization (SQLite)
 * Spec: 02-spec/21-app/02-data-model/02-space.md
 */
export const spaces = sqliteTable(
  "spaces",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    icon: text("icon"),
    color: text("color"),
    position: real("position").default(0).notNull(),
    isPrivate: integer("is_private", { mode: "boolean" }).default(false).notNull(),
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
    index("spaces_org_id_idx").on(table.organizationId),
    index("spaces_org_slug_idx").on(table.organizationId, table.slug),
    index("spaces_position_idx").on(table.organizationId, table.position),
    index("spaces_deleted_at_idx").on(table.deletedAt),
  ]
);
