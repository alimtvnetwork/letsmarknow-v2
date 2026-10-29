import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { uuidv7 } from "../../utils/uuidv7.js";
import { accounts } from "./accounts.js";
import { organizations } from "./organizations.js";

/**
 * History Events table - Append-only audit and undo/redo event log (SQLite)
 * Spec: 02-spec/21-app/02-data-model/09-history-event.md
 */
export const historyEvents = sqliteTable(
  "history_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    accountId: text("account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    action: text("action").notNull(),
    forwardPatch: text("forward_patch", { mode: "json" }),
    reversePatch: text("reverse_patch", { mode: "json" }),
    batchId: text("batch_id"),
    client: text("client"),
    isUndoable: integer("is_undoable", { mode: "boolean" }).default(true).notNull(),
    undoneAt: integer("undone_at", { mode: "timestamp" }),
    undoneByEventId: text("undone_by_event_id"),
    redoneAt: integer("redone_at", { mode: "timestamp" }),
    undoExpiresAt: integer("undo_expires_at", { mode: "timestamp" }),
    metadata: text("metadata", { mode: "json" }).default({}).notNull(),
    entitySnapshot: text("entity_snapshot", { mode: "json" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("history_org_created_idx").on(table.organizationId, table.createdAt),
    index("history_entity_idx").on(table.entityType, table.entityId),
    index("history_account_id_idx").on(table.accountId),
    index("history_batch_id_idx").on(table.batchId),
  ]
);
