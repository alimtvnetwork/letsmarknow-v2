import { pgTable, uuid, varchar, integer, jsonb, timestamp, text, index } from "drizzle-orm/pg-core";
import { uuidv7 } from "../utils/uuidv7.js";
import { accounts } from "./accounts.js";
import { organizations } from "./organizations.js";

/**
 * Background Jobs table
 * Spec: 02-spec/21-app/03-api-endpoints/20-jobs.md
 */
export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    createdByAccountId: uuid("created_by_account_id")
      .references(() => accounts.id, { onDelete: "set null" }),
    kind: varchar("kind", { length: 64 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("queued"),
    phase: varchar("phase", { length: 128 }),
    progress: jsonb("progress").default({ processed: 0, total: 0, percent: 0 }),
    etaSeconds: integer("eta_seconds"),
    resultUrl: text("result_url"),
    resultSummary: jsonb("result_summary"),
    error: jsonb("error"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("jobs_org_idx").on(table.organizationId),
    index("jobs_status_idx").on(table.status),
    index("jobs_kind_idx").on(table.kind),
    index("jobs_expires_at_idx").on(table.expiresAt),
  ]
);
