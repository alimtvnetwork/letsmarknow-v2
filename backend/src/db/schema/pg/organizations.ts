import { pgTable, uuid, varchar, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { uuidv7 } from "../../utils/uuidv7.js";
import { accounts } from "./accounts.js";
import { orgRoleEnum } from "./enums.js";

/**
 * Organizations table - Multi-tenant root entity
 * Spec: 02-spec/21-app/02-data-model/01-organization.md
 */
export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 63 }).notNull().unique(),
    logoUrl: text("logo_url"),
    brandColor: varchar("brand_color", { length: 7 }),
    plan: varchar("plan", { length: 32 }).default("free").notNull(),
    ownerAccountId: uuid("owner_account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    defaultSpaceId: uuid("default_space_id"),
    subscriptionId: uuid("subscription_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("orgs_slug_idx").on(table.slug),
    index("orgs_owner_id_idx").on(table.ownerAccountId),
    index("orgs_deleted_at_idx").on(table.deletedAt),
  ]
);

/**
 * Organization Members table - Accounts belonging to an Organization with 7-role RBAC
 * Spec: 02-spec/21-app/02-data-model/08-member.md
 */
export const orgMembers = pgTable(
  "org_members",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    accountId: uuid("account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    role: orgRoleEnum("role").default("viewer").notNull(),
    status: varchar("status", { length: 32 }).default("active").notNull(),
    invitedBy: uuid("invited_by").references(() => accounts.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("org_members_org_account_uidx").on(
      table.organizationId,
      table.accountId
    ),
    index("org_members_account_id_idx").on(table.accountId),
    index("org_members_org_role_idx").on(table.organizationId, table.role),
  ]
);

/**
 * Organization Invites table - Pending invitations
 */
export const orgInvites = pgTable(
  "org_invites",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    role: orgRoleEnum("role").default("viewer").notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    invitedBy: uuid("invited_by").references(() => accounts.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("org_invites_org_email_idx").on(table.organizationId, table.email),
    index("org_invites_token_idx").on(table.token),
  ]
);
