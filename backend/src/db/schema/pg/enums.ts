import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Canonical 7-value role enum pinned by SQL CHECK constraint.
 * Spec: 02-spec/21-app/02-data-model/08-member.md & 00-overview.md §1.4
 */
export const orgRoleEnum = pgEnum("org_role", [
  "owner",
  "admin",
  "editor",
  "viewer",
  "billing",
  "guest",
  "system",
]);

/**
 * Collection kinds: manual, session (tab saver), next (read-it-later queue)
 */
export const collectionKindEnum = pgEnum("collection_kind", [
  "manual",
  "session",
  "next",
]);

/**
 * Collection layout visualization modes
 */
export const viewModeEnum = pgEnum("view_mode", [
  "list",
  "grid",
  "compact",
  "mindmap",
  "column",
]);

/**
 * Share target entity types (polymorphic)
 */
export const shareTargetTypeEnum = pgEnum("share_target_type", [
  "workspace",
  "space",
  "collection",
  "group",
  "item",
]);

/**
 * Share access modes
 */
export const shareModeEnum = pgEnum("share_mode", [
  "public",
  "password",
  "invite_only",
]);

/**
 * Share permissions
 */
export const sharePermissionEnum = pgEnum("share_permission", [
  "view",
  "organize",
]);
