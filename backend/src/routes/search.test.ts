import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";

describe("Search Engine Routes (Global, Quick Find, Suggest, Recent)", () => {
  let app: FastifyInstance;
  let token = "";
  let orgId = "";
  let spaceId = "";
  let collectionId = "";
  let tagId = "";
  let itemId = "";

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Signup test user
    const signupRes = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: {
        email: `search_owner_${Date.now()}@example.com`,
        password: "Password123!",
        name: "Search Owner",
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
      payload: { name: "Engineering Space" },
    });
    spaceId = spaceRes.json().data.id;

    // Create a Collection
    const colRes = await app.inject({
      method: "POST",
      url: "/v1/collections",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: { space_id: spaceId, name: "Web Dev Tools", description: "Useful web libraries" },
    });
    collectionId = colRes.json().data.id;

    // Create a Tag
    const tagRes = await app.inject({
      method: "POST",
      url: "/v1/tags",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: { name: "bundler", color: "#6366f1" },
    });
    tagId = tagRes.json().data.id;

    // Create an Item
    const itemRes = await app.inject({
      method: "POST",
      url: "/v1/items",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        collection_id: collectionId,
        url: "https://vitejs.dev",
        title: "Vite Next Generation Frontend Tooling",
        description: "Fast development server and optimized build",
      },
    });
    itemId = itemRes.json().data.id;

    // Tag the item
    await app.inject({
      method: "POST",
      url: `/v1/items/${itemId}/tags`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: { add: [tagId] },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  // ===================== GLOBAL SEARCH =====================
  it("GET /v1/search - performs full-text search across items and collections", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/search?q=Vite",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].type).toBe("item");
    expect(body.data[0].title).toBe("Vite Next Generation Frontend Tooling");
    expect(body.data[0].highlight.title).toContain("<em>Vite</em>");
    expect(body.meta.took_ms).toBeDefined();
    expect(body.meta.parsed_query.terms).toEqual(["Vite"]);
  });

  it("GET /v1/search - filters by tag and domain", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/search?q=tag:bundler domain:vitejs.dev",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBe(1);
    expect(body.data[0].id).toBe(itemId);
  });

  it("GET /v1/search - returns 400 for empty query", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/search",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("VALIDATION_FAILED");
  });

  // ===================== OMNIBOX QUICK-FIND =====================
  it("GET /v1/search/quick - returns fast ranked items for omnibox & command palette", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/search/quick?q=vite",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(1);
    expect(body.data[0].id).toBe(itemId);
    expect(body.data[0].collection_name).toBe("Web Dev Tools");
    expect(body.data[0].score).toBeGreaterThan(0);
  });

  // ===================== SUGGESTIONS =====================
  it("GET /v1/search/suggest - returns search autocomplete suggestions", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/search/suggest?q=vite",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.queries).toContain("vite");
    expect(body.data.domains).toContain("vitejs.dev");
  });

  // ===================== RECENT SEARCHES =====================
  it("GET /v1/search/recent and DELETE /v1/search/recent", async () => {
    const recentRes = await app.inject({
      method: "GET",
      url: "/v1/search/recent",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(recentRes.statusCode).toBe(200);
    const recentBody = recentRes.json();
    expect(recentBody.data.length).toBeGreaterThan(0);
    expect(recentBody.data.some((r: { q: string }) => r.q === "Vite")).toBe(true);

    // Delete single query
    const delSingleRes = await app.inject({
      method: "DELETE",
      url: "/v1/search/recent?q=Vite",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });
    expect(delSingleRes.statusCode).toBe(204);

    // Clear all queries
    const delAllRes = await app.inject({
      method: "DELETE",
      url: "/v1/search/recent",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });
    expect(delAllRes.statusCode).toBe(204);

    const emptyRes = await app.inject({
      method: "GET",
      url: "/v1/search/recent",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });
    expect(emptyRes.json().data).toHaveLength(0);
  });
});
