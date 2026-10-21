import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { uuidv7 } from "../../utils/uuidv7.js";
import { accounts } from "./accounts.js";
import { organizations } from "./organizations.js";

/**
 * Licenses table - SKUs, lifetime keys, and entitlements (SQLite)
 * Spec: 02-spec/21-app/02-data-model/10-license.md
 */
export const licenses = sqliteTable(
  "licenses",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "restrict",
    }),
    accountId: text("account_id").references(() => accounts.id, {
      onDelete: "restrict",
    }),
    key: text("key").unique(),
    plan: text("plan").default("pro").notNull(),
    status: text("status").default("active").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("licenses_org_id_idx").on(table.organizationId),
    index("licenses_account_id_idx").on(table.accountId),
    index("licenses_key_idx").on(table.key),
  ]
);

/**
 * Subscriptions table - Recurring billing via Stripe/Paddle
 */
export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerSubscriptionId: text("provider_subscription_id").notNull().unique(),
    status: text("status").default("active").notNull(),
    plan: text("plan").notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").default("USD").notNull(),
    currentPeriodEnd: integer("current_period_end", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("subscriptions_org_id_idx").on(table.organizationId),
    index("subscriptions_provider_sub_idx").on(
      table.provider,
      table.providerSubscriptionId
    ),
  ]
);
