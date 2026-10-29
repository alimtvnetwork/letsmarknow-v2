import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { uuidv7 } from "../../utils/uuidv7.js";
import { accounts } from "./accounts.js";
import { organizations } from "./organizations.js";

/**
 * Background Jobs table (SQLite)
 * Spec: 02-spec/21-app/03-api-endpoints/20-jobs.md
 */
export const jobs = sqliteTable(
  "jobs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    createdByAccountId: text("created_by_account_id").references(
      () => accounts.id,
      { onDelete: "set null" }
    ),
    kind: text("kind").notNull(),
    status: text("status").notNull().default("queued"),
    phase: text("phase"),
    progress: text("progress", { mode: "json" }).default({ processed: 0, total: 0, percent: 0 }),
    etaSeconds: integer("eta_seconds"),
    resultUrl: text("result_url"),
    resultSummary: text("result_summary", { mode: "json" }),
    error: text("error", { mode: "json" }),
    metadata: text("metadata", { mode: "json" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    finishedAt: integer("finished_at", { mode: "timestamp" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("jobs_org_idx").on(table.organizationId),
    index("jobs_status_idx").on(table.status),
    index("jobs_kind_idx").on(table.kind),
    index("jobs_expires_at_idx").on(table.expiresAt),
  ]
);
