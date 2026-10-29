import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { DbRegistry } from "./registry.js";
import { SPLIT_DB_FILES, TABLE_TO_DOMAIN, type DbDomain } from "./splitSchemas.js";
import * as schema from "./schema/index.js";
import { uuidv7 } from "./utils/uuidv7.js";

describe("Split-DB Architecture & DbRegistry", () => {
  let registry: DbRegistry;

  beforeAll(async () => {
    registry = new DbRegistry();
    const ok = await registry.checkConnection();
    expect(ok).toBe(true);
  });

  afterAll(async () => {
    await registry.close();
  });

  it("should initialize all 5 canonical domain databases", () => {
    const domains: DbDomain[] = ["auth", "workspace", "bookmarks", "shares", "history"];
    expect(registry.getDomains()).toEqual(domains);

    for (const domain of domains) {
      const db = registry.get(domain);
      expect(db).toBeDefined();
      const client = registry.getClient(domain);
      expect(client).toBeDefined();
    }
  });

  it("should verify correct table-to-domain mapping", () => {
    expect(registry.getDomainForTable(schema.accounts)).toBe("auth");
    expect(registry.getDomainForTable(schema.authIdentities)).toBe("auth");
    expect(registry.getDomainForTable(schema.sessions)).toBe("auth");

    expect(registry.getDomainForTable(schema.organizations)).toBe("workspace");
    expect(registry.getDomainForTable(schema.orgMembers)).toBe("workspace");
    expect(registry.getDomainForTable(schema.licenses)).toBe("workspace");

    expect(registry.getDomainForTable(schema.spaces)).toBe("bookmarks");
    expect(registry.getDomainForTable(schema.collections)).toBe("bookmarks");
    expect(registry.getDomainForTable(schema.items)).toBe("bookmarks");
    expect(registry.getDomainForTable(schema.tags)).toBe("bookmarks");

    expect(registry.getDomainForTable(schema.shares)).toBe("shares");

    expect(registry.getDomainForTable(schema.historyEvents)).toBe("history");
    expect(registry.getDomainForTable(schema.jobs)).toBe("history");
  });

  it("should verify transparent routing proxy dispatches inserts and selects to correct domain DBs", async () => {
    const proxy = registry.createRoutingProxy();

    // 1. Insert and query auth domain (auth.db)
    const testAccountId = uuidv7();
    await proxy.insert(schema.accounts).values({
      id: testAccountId,
      email: `split_test_${Date.now()}@example.com`,
      displayName: "Split DB Tester",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const accounts = await proxy.select().from(schema.accounts);
    expect(accounts.some((a: any) => a.id === testAccountId)).toBe(true);

    // 2. Insert and query bookmarks domain (bookmarks.db)
    const testSpaceId = uuidv7();
    await proxy.insert(schema.spaces).values({
      id: testSpaceId,
      organizationId: uuidv7(),
      name: "Split DB Bookmarks Space",
      slug: `split-space-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const spaces = await proxy.select().from(schema.spaces);
    expect(spaces.some((s: any) => s.id === testSpaceId)).toBe(true);

    // 3. Insert and query shares domain (shares.db)
    const testShareId = uuidv7();
    await proxy.insert(schema.shares).values({
      id: testShareId,
      organizationId: uuidv7(),
      targetType: "collection",
      targetId: uuidv7(),
      slug: `split-share-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const shares = await proxy.select().from(schema.shares);
    expect(shares.some((s: any) => s.id === testShareId)).toBe(true);
  });
});
