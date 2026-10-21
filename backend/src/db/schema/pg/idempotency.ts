import { pgTable, uuid, varchar, integer, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { uuidv7 } from "../../utils/uuidv7.js";
import { accounts } from "./accounts.js";

/**
 * Idempotency Keys table - 24-hour request response caching for mutating POSTs
 * Spec: 02-spec/21-app/03-api-endpoints/01-conventions.md §6
 */
export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    accountId: uuid("account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    key: varchar("key", { length: 255 }).notNull().unique(),
    statusCode: integer("status_code").notNull(),
    responseHeaders: jsonb("response_headers"),
    responseBody: jsonb("response_body"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("idempotency_key_idx").on(table.key),
    index("idempotency_expires_at_idx").on(table.expiresAt),
  ]
);
