import { pgTable, uuid, text, timestamp, boolean, doublePrecision, index } from "drizzle-orm/pg-core";
import { uuidv7 } from "../utils/uuidv7.js";
import { accounts } from "./accounts.js";
import { collections } from "./collections.js";
import { items } from "./items.js";

/**
 * Next Items table - Personal "Read-it-Later" queue
 * Spec: 02-spec/21-app/02-data-model/12-next-item.md
 */
export const nextItems = pgTable(
  "next_items",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    nextCollectionId: uuid("next_collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    itemId: uuid("item_id").references(() => items.id, {
      onDelete: "set null",
    }),
    sourceCollectionId: uuid("source_collection_id").references(
      () => collections.id,
      { onDelete: "set null" }
    ),
    titleSnapshot: text("title_snapshot").notNull(),
    urlSnapshot: text("url_snapshot").notNull(),
    faviconUrlSnapshot: text("favicon_url_snapshot"),
    position: doublePrecision("position").default(0).notNull(),
    isDone: boolean("is_done").default(false).notNull(),
    isTombstone: boolean("is_tombstone").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("next_items_account_idx").on(table.accountId, table.isDone),
    index("next_items_position_idx").on(table.accountId, table.position),
    index("next_items_item_id_idx").on(table.itemId),
  ]
);
