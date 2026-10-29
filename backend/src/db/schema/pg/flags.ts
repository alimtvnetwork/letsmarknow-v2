import { pgTable, uuid, varchar, integer, jsonb, timestamp, text, boolean, index } from "drizzle-orm/pg-core";
import { uuidv7 } from "../../utils/uuidv7.js";

/**
 * Feature Flags table
 * Spec: 02-spec/21-app/03-api-endpoints/21-flags.md
 * 07-features/15-feature-flags-and-rollouts.md
 */
export const featureFlags = pgTable(
  "feature_flags",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    key: varchar("key", { length: 128 }).notNull().unique(),
    description: text("description"),
    type: varchar("type", { length: 32 }).notNull().default("boolean"),
    defaultValue: varchar("default_value", { length: 64 }).notNull().default("off"),
    rolloutPct: integer("rollout_pct").default(100),
    variants: jsonb("variants"),
    targeting: jsonb("targeting"),
    isKillswitch: boolean("is_killswitch").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("flags_key_idx").on(table.key),
    index("flags_type_idx").on(table.type),
  ]
);
