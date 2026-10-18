import { pgTable, uuid, varchar, jsonb, timestamp, boolean, index, type AnyPgColumn } from "drizzle-orm/pg-core";
import { uuidv7 } from "../utils/uuidv7.js";
import { accounts } from "./accounts.js";
import { organizations } from "./organizations.js";

/**
 * History Events table - Append-only audit and undo/redo event log
 * Spec: 02-spec/21-app/02-data-model/09-history-event.md
 */
export const historyEvents = pgTable(
  "history_events",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    accountId: uuid("account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    entityType: varchar("entity_type", { length: 32 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    action: varchar("action", { length: 64 }).notNull(),
    forwardPatch: jsonb("forward_patch"),
    reversePatch: jsonb("reverse_patch"),
    batchId: uuid("batch_id"),
    client: varchar("client", { length: 120 }),
    isUndoable: boolean("is_undoable").default(true).notNull(),
    undoneAt: timestamp("undone_at", { withTimezone: true }),
    undoneByEventId: uuid("undone_by_event_id").references(
      (): AnyPgColumn => historyEvents.id,
      { onDelete: "set null" }
    ),
    redoneAt: timestamp("redone_at", { withTimezone: true }),
    undoExpiresAt: timestamp("undo_expires_at", { withTimezone: true }),
    metadata: jsonb("metadata").default({}).notNull(),
    entitySnapshot: jsonb("entity_snapshot"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("history_org_created_idx").on(table.organizationId, table.createdAt),
    index("history_entity_idx").on(table.entityType, table.entityId),
    index("history_account_id_idx").on(table.accountId),
    index("history_batch_id_idx").on(table.batchId),
  ]
);
