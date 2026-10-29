import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { uuidv7 } from "../../utils/uuidv7.js";

/**
 * Feature Flags table (SQLite)
 * Spec: 02-spec/21-app/03-api-endpoints/21-flags.md
 */
export const featureFlags = sqliteTable(
  "feature_flags",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    key: text("key").notNull().unique(),
    description: text("description"),
    type: text("type").default("boolean").notNull(),
    defaultValue: text("default_value").default("off").notNull(),
    rolloutPct: integer("rollout_pct").default(100),
    variants: text("variants", { mode: "json" }),
    targeting: text("targeting", { mode: "json" }),
    isKillswitch: integer("is_killswitch", { mode: "boolean" }).default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("flags_key_idx").on(table.key),
    index("flags_type_idx").on(table.type),
  ]
);
