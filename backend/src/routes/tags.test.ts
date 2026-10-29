import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";

describe("Tags, Filtering, & Bulk Operations Routes", () => {
  let app: FastifyInstance;
  let token = "";
  let orgId = "";
  let spaceId = "";
  let collectionId = "";
  let secondCollectionId = "";
  let itemId1 = "";
  let itemId2 = "";
  let tagId1 = "";
  let tagId2 = "";

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Signup test user
    const signupRes = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: {
        email: `tags_owner_${Date.now()}@example.com`,
        password: "Password123!",
        name: "Tags Owner",
      },
    });

    const body = signupRes.json();
    token = body.data.access_token;
    orgId = body.data.default_organization_id;

    // Create a Space
    const spaceRes = await app.inject({
      method: "POST",
      url: "/v1/spaces",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: { name: "Tag Space" },
    });
    spaceId = spaceRes.json().data.id;

    // Create Collections
    const colRes1 = await app.inject({
      method: "POST",
      url: "/v1/collections",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: { space_id: spaceId, name: "Col 1" },
    });
    collectionId = colRes1.json().data.id;

    const colRes2 = await app.inject({
      method: "POST",
      url: "/v1/collections",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: { space_id: spaceId, name: "Col 2" },
    });
    secondCollectionId = colRes2.json().data.id;

    // Create 2 test items
    const itemRes1 = await app.inject({
      method: "POST",
      url: "/v1/items",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        collection_id: collectionId,
        url: "https://react.dev",
        title: "React Docs",
      },
    });
    itemId1 = itemRes1.json().data.id;

    const itemRes2 = await app.inject({
      method: "POST",
      url: "/v1/items",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        collection_id: collectionId,
        url: "https://vuejs.org",
        title: "Vue.js",
      },
    });
    itemId2 = itemRes2.json().data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ===================== TAG CRUD =====================
  it("POST /v1/tags - creates a new tag", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/tags",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        name: "frontend",
        color: "#6366f1",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.data.name).toBe("frontend");
    expect(body.data.color).toBe("#6366f1");
    expect(body.data.slug).toBe("frontend");
    tagId1 = body.data.id;
  });

  it("POST /v1/tags - rejects duplicate name with 409 CONFLICT", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/tags",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        name: "Frontend", // case-insensitive duplicate
        color: "#10b981",
      },
    });

    expect(res.statusCode).toBe(409);
    const body = res.json();
    expect(body.error.code).toBe("CONFLICT");
  });

  it("POST /v1/tags - creates second tag", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/tags",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        name: "documentation",
        color: "#3b82f6",
      },
    });

    expect(res.statusCode).toBe(201);
    tagId2 = res.json().data.id;
  });

  it("GET /v1/tags - lists organization tags", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/tags",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(2);
  });

  it("GET /v1/tags/suggest - provides autocomplete with create_new match", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/tags/suggest?q=front",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.some((s: { match: string; name: string }) => s.match === "prefix" && s.name === "frontend")).toBe(true);
    expect(body.data.some((s: { match: string; name: string }) => s.match === "create_new")).toBe(true);
  });

  it("PATCH /v1/tags/:id - updates tag metadata", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/v1/tags/${tagId1}`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        name: "client-dev",
        color: "#ec4899",
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.name).toBe("client-dev");
  });

  // ===================== ITEM TAG ATTACHMENT & FILTERING =====================
  it("POST /v1/items/:id/tags - attaches tags and creates tag on-the-fly", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/v1/items/${itemId1}/tags`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        add: [tagId1],
        create: [{ name: "javascript", color: "#f59e0b" }],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.tag_ids.includes(tagId1)).toBe(true);
    expect(body.data.tag_ids.length).toBe(2); // tagId1 + newly created javascript tag
  });

  it("GET /v1/items - filters items by tag name", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/v1/items?collection_id=${collectionId}&tag=client-dev`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBe(1);
    expect(body.data[0].id).toBe(itemId1);
  });

  it("GET /v1/items - filters items by tag_id", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/v1/items?collection_id=${collectionId}&tag_id=${tagId1}`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBe(1);
    expect(body.data[0].id).toBe(itemId1);
  });

  // ===================== STARRED FILTERING =====================
  it("GET /v1/items?is_starred=true - filters starred items across collection/org", async () => {
    // Star itemId2
    await app.inject({
      method: "POST",
      url: `/v1/items/${itemId2}/star`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    const res = await app.inject({
      method: "GET",
      url: `/v1/items?collection_id=${collectionId}&is_starred=true`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBe(1);
    expect(body.data[0].id).toBe(itemId2);
  });

  // ===================== BULK OPERATIONS (207 MULTI-STATUS) =====================
  it("POST /v1/bulk/items - executes multiple actions and returns 207 Multi-Status", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/bulk/items",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        all_or_nothing: false,
        operations: [
          {
            op: "create",
            data: {
              collection_id: secondCollectionId,
              url: "https://angular.dev",
              title: "Angular",
            },
          },
          {
            op: "star",
            id: itemId1,
            data: { is_starred: true },
          },
          {
            op: "move",
            id: itemId2,
            data: { to_collection_id: secondCollectionId },
          },
        ],
      },
    });

    expect(res.statusCode).toBe(207);
    const body = res.json();
    expect(body.data.results.length).toBe(3);
    expect(body.data.results[0].status).toBe(201);
    expect(body.data.results[1].status).toBe(200);
    expect(body.data.results[2].status).toBe(200);

    // Verify move took effect
    const movedItemRes = await app.inject({
      method: "GET",
      url: `/v1/items/${itemId2}`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });
    expect(movedItemRes.json().data.collection_id).toBe(secondCollectionId);
  });

  it("POST /v1/bulk/items - all_or_nothing: true fails atomically when an operation is invalid", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/bulk/items",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        all_or_nothing: true,
        operations: [
          {
            op: "update",
            id: itemId1,
            data: { title: "Valid Title" },
          },
          {
            op: "update",
            id: "00000000-0000-0000-0000-000000000000", // Nonexistent item
            data: { title: "Invalid" },
          },
        ],
      },
    });

    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.message).toContain("Bulk operation failed");
  });

  // ===================== DELETE TAG =====================
  it("DELETE /v1/tags/:id - deletes tag and cascades from item tag_ids", async () => {
    const delRes = await app.inject({
      method: "DELETE",
      url: `/v1/tags/${tagId1}`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });
    expect(delRes.statusCode).toBe(204);

    // Verify item1 no longer has tagId1
    const itemRes = await app.inject({
      method: "GET",
      url: `/v1/items/${itemId1}`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });
    expect(itemRes.json().data.tag_ids.includes(tagId1)).toBe(false);
  });
});
