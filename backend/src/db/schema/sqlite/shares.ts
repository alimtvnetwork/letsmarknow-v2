import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { uuidv7 } from "../../utils/uuidv7.js";
import { accounts } from "./accounts.js";
import { organizations } from "./organizations.js";

/**
 * Shares table - Single-table polymorphic share links (SQLite)
 * Spec: 02-spec/21-app/02-data-model/07-share.md
 */
export const shares = sqliteTable(
  "shares",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    targetType: text("target_type").default("collection").notNull(),
    targetId: text("target_id").notNull(),
    mode: text("mode").default("public").notNull(),
    passwordHash: text("password_hash"),
    slug: text("slug").notNull().unique(),
    memorableSlug: text("memorable_slug"),
    permission: text("permission").default("view").notNull(),
    allowCloneToMyAccount: integer("allow_clone_to_my_account", { mode: "boolean" }).default(true).notNull(),
    showBranding: integer("show_branding", { mode: "boolean" }).default(true).notNull(),
    analyticsEnabled: integer("analytics_enabled", { mode: "boolean" }).default(true).notNull(),
    defaultViewMode: text("default_view_mode").default("grid").notNull(),
    titleOverride: text("title_override"),
    descriptionOverride: text("description_override"),
    allowedEmails: text("allowed_emails", { mode: "json" }).$type<string[]>().default([]).notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    revokedAt: integer("revoked_at", { mode: "timestamp" }),
    viewCount: integer("view_count").default(0).notNull(),
    uniqueViewerCount: integer("unique_viewer_count").default(0).notNull(),
    clickCount: integer("click_count").default(0).notNull(),
    lastViewedAt: integer("last_viewed_at", { mode: "timestamp" }),
    createdBy: text("created_by").references(() => accounts.id, {
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
    index("shares_org_id_idx").on(table.organizationId),
    index("shares_slug_idx").on(table.slug),
    uniqueIndex("shares_memorable_slug_uidx").on(table.memorableSlug),
    index("shares_target_idx").on(table.targetType, table.targetId),
    index("shares_active_idx").on(table.revokedAt, table.expiresAt),
  ]
);
