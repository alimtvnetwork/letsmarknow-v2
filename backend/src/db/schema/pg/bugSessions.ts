import { pgTable, uuid, varchar, text, integer, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { uuidv7 } from "../../utils/uuidv7.js";
import { accounts } from "./accounts.js";

/**
 * Bug Sessions table (Postgres) — persistence backing the frontend bug-session
 * recorder. Mirrors the SQLite definition. Note: the Postgres migration SQL is
 * a v2 item; schema definition here only keeps the activeSchema selector from
 * returning undefined when DB_DRIVER=postgres.
 */
export const bugSessions = pgTable(
  "bug_sessions",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    category: varchar("category", { length: 64 }).notNull(),
    description: text("description"),
    expectedBehavior: text("expected_behavior"),
    actualBehavior: text("actual_behavior"),
    initialRoute: varchar("initial_route", { length: 512 }).notNull(),
    finalRoute: varchar("final_route", { length: 512 }),
    durationMs: integer("duration_ms"),
    eventsJson: jsonb("events_json").$type<unknown[]>().default([]).notNull(),
    eventCount: integer("event_count").default(0).notNull(),
    screenshotCount: integer("screenshot_count").default(0).notNull(),
    errorCount: integer("error_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("bug_sessions_account_id_idx").on(table.accountId),
    index("bug_sessions_account_created_idx").on(table.accountId, table.createdAt),
  ]
);

/**
 * Bug Screenshots table (Postgres).
 */
export const bugScreenshots = pgTable(
  "bug_screenshots",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => bugSessions.id, { onDelete: "cascade" }),
    seqNumber: integer("seq_number"),
    title: varchar("title", { length: 255 }),
    dataUrl: text("data_url").notNull(),
    source: varchar("source", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("bug_screenshots_session_id_idx").on(table.sessionId)]
);
