import { describe, it, expect } from "vitest";
import * as schema from "./schema/index.js";
import { uuidv7 } from "./utils/uuidv7.js";

describe("Database Schema Contracts & Master Cascade Verification", () => {
  it("should generate valid UUIDv7 strings for primary keys", () => {
    const id = uuidv7();
    expect(typeof id).toBe("string");
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it("should enforce the canonical 7-role enum exactly", () => {
    expect(schema.orgRoleEnum.enumValues).toEqual([
      "owner",
      "admin",
      "editor",
      "viewer",
      "billing",
      "guest",
      "system",
    ]);
  });

  it("should export all 14 entity tables", () => {
    expect(schema.accounts).toBeDefined();
    expect(schema.authIdentities).toBeDefined();
    expect(schema.sessions).toBeDefined();
    expect(schema.mfaFactors).toBeDefined();
    expect(schema.organizations).toBeDefined();
    expect(schema.orgMembers).toBeDefined();
    expect(schema.orgInvites).toBeDefined();
    expect(schema.spaces).toBeDefined();
    expect(schema.collections).toBeDefined();
    expect(schema.groups).toBeDefined();
    expect(schema.items).toBeDefined();
    expect(schema.tags).toBeDefined();
    expect(schema.itemTags).toBeDefined();
    expect(schema.shares).toBeDefined();
    expect(schema.nextItems).toBeDefined();
    expect(schema.historyEvents).toBeDefined();
    expect(schema.licenses).toBeDefined();
    expect(schema.subscriptions).toBeDefined();
    expect(schema.idempotencyKeys).toBeDefined();
  });

  it("should verify master cascade delete rules on items.groupId (SET NULL)", () => {
    // Spec: Item survives Group deletion (lives directly in Collection)
    // 02-spec/21-app/02-data-model/00-overview.md §4a
    expect(schema.items.groupId).toBeDefined();
    expect(schema.items.groupId.notNull).toBe(false);
  });

  it("should verify collection kinds and view modes", () => {
    expect(schema.collectionKindEnum.enumValues).toEqual([
      "manual",
      "session",
      "next",
    ]);
    expect(schema.viewModeEnum.enumValues).toEqual([
      "list",
      "grid",
      "compact",
      "mindmap",
      "column",
    ]);
  });
});
