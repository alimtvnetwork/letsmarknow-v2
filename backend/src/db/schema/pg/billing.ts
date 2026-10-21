import { pgTable, uuid, varchar, integer, timestamp, index } from "drizzle-orm/pg-core";
import { uuidv7 } from "../../utils/uuidv7.js";
import { accounts } from "./accounts.js";
import { organizations } from "./organizations.js";

/**
 * Licenses table - SKUs, lifetime keys, and entitlements
 * Spec: 02-spec/21-app/02-data-model/10-license.md
 * Master Cascade: restrict on delete (Org and Account cannot be deleted while active license exists)
 */
export const licenses = pgTable(
  "licenses",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "restrict",
    }),
    accountId: uuid("account_id").references(() => accounts.id, {
      onDelete: "restrict",
    }),
    key: varchar("key", { length: 64 }).unique(),
    plan: varchar("plan", { length: 32 }).default("pro").notNull(),
    status: varchar("status", { length: 32 }).default("active").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
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
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 32 }).notNull(),
    providerSubscriptionId: varchar("provider_subscription_id", {
      length: 255,
    })
      .notNull()
      .unique(),
    status: varchar("status", { length: 32 }).notNull(),
    plan: varchar("plan", { length: 32 }).notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: varchar("currency", { length: 3 }).default("USD").notNull(),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("subscriptions_org_id_idx").on(table.organizationId),
    index("subscriptions_provider_id_idx").on(
      table.provider,
      table.providerSubscriptionId
    ),
  ]
);
