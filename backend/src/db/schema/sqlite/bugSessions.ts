import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { uuidv7 } from "../../utils/uuidv7.js";

/**
 * Bug Sessions table (SQLite) — persistence backing the frontend bug-session recorder.
 * Stores one row per recorder session: metadata, the full event log as a JSON
 * array (v1 simplification), and denormalized counts. Screenshots live in the
 * companion bug_screenshots table.
 *
 * NOTE on foreign keys: the split-DB architecture keeps accounts in auth.db while
 * this table lives in history.db, so the account_id reference cannot be a real
 * cross-file SQLite FOREIGN KEY. Ownership is enforced in the API layer
 * (every query filters by account_id), matching the convention used elsewhere
 * in SPLIT_DDL.
 */
export const bugSessions = sqliteTable(
  "bug_sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    accountId: text("account_id").notNull(),
    title: text("title").notNull(),
    category: text("category").notNull(),
    description: text("description"),
    expectedBehavior: text("expected_behavior"),
    actualBehavior: text("actual_behavior"),
    initialRoute: text("initial_route").notNull(),
    finalRoute: text("final_route"),
    durationMs: integer("duration_ms"),
    eventsJson: text("events_json", { mode: "json" })
      .$type<unknown[]>()
      .default([])
      .notNull(),
    eventCount: integer("event_count").default(0).notNull(),
    screenshotCount: integer("screenshot_count").default(0).notNull(),
    errorCount: integer("error_count").default(0).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("bug_sessions_account_id_idx").on(table.accountId),
    index("bug_sessions_account_created_idx").on(
      table.accountId,
      table.createdAt
    ),
  ]
);

/**
 * Bug Screenshots table (SQLite) — screenshots captured during a bug session.
 * data_url holds the full data: URL (PNG/JPEG). v1 simplification: no separate
 * blob store, no thumbnails.
 */
export const bugScreenshots = sqliteTable(
  "bug_screenshots",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    sessionId: text("session_id")
      .notNull()
      .references(() => bugSessions.id, { onDelete: "cascade" }),
    seqNumber: integer("seq_number"),
    title: text("title"),
    dataUrl: text("data_url").notNull(),
    source: text("source"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [index("bug_screenshots_session_id_idx").on(table.sessionId)]
);
