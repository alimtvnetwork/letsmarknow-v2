import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { uuidv7 } from "../../utils/uuidv7.js";
import { accounts } from "./accounts.js";

/**
 * Organizations table - Multi-tenant root entity (SQLite)
 * Spec: 02-spec/21-app/02-data-model/01-organization.md
 */
export const organizations = sqliteTable(
  "organizations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logoUrl: text("logo_url"),
    brandColor: text("brand_color"),
    plan: text("plan").default("free").notNull(),
    ownerAccountId: text("owner_account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    defaultSpaceId: text("default_space_id"),
    subscriptionId: text("subscription_id"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    deletedAt: integer("deleted_at", { mode: "timestamp" }),
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
export const orgMembers = sqliteTable(
  "org_members",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    accountId: text("account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    role: text("role").default("viewer").notNull(),
    status: text("status").default("active").notNull(),
    invitedBy: text("invited_by").references(() => accounts.id, {
      onDelete: "set null",
    }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
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
export const orgInvites = sqliteTable(
  "org_invites",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role").default("viewer").notNull(),
    token: text("token").notNull().unique(),
    invitedBy: text("invited_by").references(() => accounts.id, {
      onDelete: "set null",
    }),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("org_invites_org_email_idx").on(table.organizationId, table.email),
    index("org_invites_token_idx").on(table.token),
  ]
);
