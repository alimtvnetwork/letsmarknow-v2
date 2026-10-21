import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { uuidv7 } from "../../utils/uuidv7.js";

/**
 * Accounts table - User identity and profile (SQLite)
 * Spec: 02-spec/21-app/02-data-model/11-account.md
 */
export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash"),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    emailVerifiedAt: integer("email_verified_at", { mode: "timestamp" }),
    status: text("status").default("active").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    deletedAt: integer("deleted_at", { mode: "timestamp" }),
  },
  (table) => [
    index("accounts_email_idx").on(table.email),
    index("accounts_deleted_at_idx").on(table.deletedAt),
  ]
);

/**
 * Auth Identities table - Third-party OAuth links (Google, GitHub)
 */
export const authIdentities = sqliteTable(
  "auth_identities",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerUserId: text("provider_user_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("auth_identities_account_id_idx").on(table.accountId),
    index("auth_identities_provider_idx").on(table.provider, table.providerUserId),
  ]
);

/**
 * Sessions table - Refresh token sessions
 */
export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    refreshTokenHash: text("refresh_token_hash").notNull(),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    lastActiveAt: integer("last_active_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    revokedAt: integer("revoked_at", { mode: "timestamp" }),
  },
  (table) => [
    index("sessions_account_id_idx").on(table.accountId),
    index("sessions_token_hash_idx").on(table.refreshTokenHash),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ]
);

/**
 * MFA Factors table - Multi-factor authentication secrets
 */
export const mfaFactors = sqliteTable(
  "mfa_factors",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    factorType: text("factor_type").notNull(),
    secretEncrypted: text("secret_encrypted").notNull(),
    verifiedAt: integer("verified_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("mfa_factors_account_id_idx").on(table.accountId),
  ]
);
