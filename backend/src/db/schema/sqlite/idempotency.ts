import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { uuidv7 } from "../../utils/uuidv7.js";
import { accounts } from "./accounts.js";

/**
 * Idempotency Keys table - 24-hour request response caching for mutating POSTs (SQLite)
 * Spec: 02-spec/21-app/03-api-endpoints/01-conventions.md §6
 */
export const idempotencyKeys = sqliteTable(
  "idempotency_keys",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    accountId: text("account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    key: text("key").notNull().unique(),
    statusCode: integer("status_code").notNull(),
    responseHeaders: text("response_headers", { mode: "json" }),
    responseBody: text("response_body", { mode: "json" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("idempotency_key_idx").on(table.key),
    index("idempotency_expires_at_idx").on(table.expiresAt),
  ]
);
