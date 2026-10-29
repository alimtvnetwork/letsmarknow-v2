import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { uuidv7 } from "../../utils/uuidv7.js";
import { accounts } from "./accounts.js";
import { collections } from "./collections.js";
import { items } from "./items.js";

/**
 * Next Items table - Personal "Read-it-Later" queue (SQLite)
 * Spec: 02-spec/21-app/02-data-model/12-next-item.md
 */
export const nextItems = sqliteTable(
  "next_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    nextCollectionId: text("next_collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    itemId: text("item_id").references(() => items.id, {
      onDelete: "set null",
    }),
    sourceCollectionId: text("source_collection_id").references(
      () => collections.id,
      { onDelete: "set null" }
    ),
    titleSnapshot: text("title_snapshot").notNull(),
    urlSnapshot: text("url_snapshot").notNull(),
    faviconUrlSnapshot: text("favicon_url_snapshot"),
    position: real("position").default(0).notNull(),
    isDone: integer("is_done", { mode: "boolean" }).default(false).notNull(),
    isTombstone: integer("is_tombstone", { mode: "boolean" }).default(false).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("next_items_account_idx").on(table.accountId, table.isDone),
    index("next_items_position_idx").on(table.accountId, table.position),
    index("next_items_item_id_idx").on(table.itemId),
  ]
);
