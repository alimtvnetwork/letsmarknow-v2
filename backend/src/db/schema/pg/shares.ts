import { pgTable, uuid, varchar, integer, timestamp, boolean, index, uniqueIndex, jsonb } from "drizzle-orm/pg-core";
import { uuidv7 } from "../../utils/uuidv7.js";
import { accounts } from "./accounts.js";
import { organizations } from "./organizations.js";
import { shareModeEnum, sharePermissionEnum, shareTargetTypeEnum } from "./enums.js";

/**
 * Shares table - Single-table polymorphic share links
 * Spec: 02-spec/21-app/02-data-model/07-share.md
 */
export const shares = pgTable(
  "shares",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    targetType: shareTargetTypeEnum("target_type").default("collection").notNull(),
    targetId: uuid("target_id").notNull(),
    mode: shareModeEnum("mode").default("public").notNull(),
    passwordHash: varchar("password_hash", { length: 255 }),
    slug: varchar("slug", { length: 63 }).notNull().unique(),
    memorableSlug: varchar("memorable_slug", { length: 63 }),
    permission: sharePermissionEnum("permission").default("view").notNull(),
    allowCloneToMyAccount: boolean("allow_clone_to_my_account").default(true).notNull(),
    showBranding: boolean("show_branding").default(true).notNull(),
    analyticsEnabled: boolean("analytics_enabled").default(true).notNull(),
    defaultViewMode: varchar("default_view_mode", { length: 32 }).default("grid").notNull(),
    titleOverride: varchar("title_override", { length: 120 }),
    descriptionOverride: varchar("description_override", { length: 500 }),
    allowedEmails: jsonb("allowed_emails").$type<string[]>().default([]).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    viewCount: integer("view_count").default(0).notNull(),
    uniqueViewerCount: integer("unique_viewer_count").default(0).notNull(),
    clickCount: integer("click_count").default(0).notNull(),
    lastViewedAt: timestamp("last_viewed_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => accounts.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("shares_org_id_idx").on(table.organizationId),
    index("shares_slug_idx").on(table.slug),
    uniqueIndex("shares_memorable_slug_uidx").on(table.memorableSlug),
    index("shares_target_idx").on(table.targetType, table.targetId),
    index("shares_active_idx").on(table.revokedAt, table.expiresAt),
  ]
);
