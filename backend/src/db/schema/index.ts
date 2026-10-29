import { env } from "../../config/env.js";
import * as pgSchema from "./pg/index.js";
import * as sqliteSchema from "./sqlite/index.js";

export * from "./enums.js";

// Active tables (default: SQLite, easily switchable to Postgres via DB_DRIVER=postgres)
const isPg = env.DB_DRIVER === "postgres";
const activeSchema: typeof sqliteSchema = (isPg ? pgSchema : sqliteSchema) as any;

export const accounts = activeSchema.accounts;
export const authIdentities = activeSchema.authIdentities;
export const sessions = activeSchema.sessions;
export const mfaFactors = activeSchema.mfaFactors;
export const organizations = activeSchema.organizations;
export const orgMembers = activeSchema.orgMembers;
export const orgInvites = activeSchema.orgInvites;
export const spaces = activeSchema.spaces;
export const collections = activeSchema.collections;
export const groups = activeSchema.groups;
export const groupItems = activeSchema.groupItems;
export const items = activeSchema.items;
export const tags = activeSchema.tags;
export const itemTags = activeSchema.itemTags;
export const shares = activeSchema.shares;
export const nextItems = activeSchema.nextItems;
export const mindmapLayouts = activeSchema.mindmapLayouts;
export const historyEvents = activeSchema.historyEvents;
export const licenses = activeSchema.licenses;
export const subscriptions = activeSchema.subscriptions;
export const idempotencyKeys = activeSchema.idempotencyKeys;
export const jobs = activeSchema.jobs;
export const featureFlags = activeSchema.featureFlags;
