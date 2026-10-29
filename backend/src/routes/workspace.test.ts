import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";

describe("Workspace Tree Routes (Spaces, Collections, Groups)", () => {
  let app: FastifyInstance;
  let token = "";
  let orgId = "";
  let spaceId = "";
  let secondSpaceId = "";
  let collectionId = "";
  let groupId = "";

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Register test user
    const signupRes = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: {
        email: `tree_owner_${Date.now()}@example.com`,
        password: "Password123!",
        name: "Tree Owner",
      },
    });

    const body = signupRes.json();
    token = body.data.access_token;
    orgId = body.data.default_organization_id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ===================== SPACES =====================
  it("POST /v1/spaces - creates a new space in active org", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/spaces",
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
      payload: {
        name: "Project Alpha",
        description: "Primary engineering space",
        color: "#6366f1",
        icon: "folder",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.data.name).toBe("Project Alpha");
    expect(body.data.organization_id).toBe(orgId);
    spaceId = body.data.id;

    // Create a second space for testing collection moves
    const secondRes = await app.inject({
      method: "POST",
      url: "/v1/spaces",
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
      payload: {
        name: "Archive Space",
      },
    });
    secondSpaceId = secondRes.json().data.id;
  });

  it("GET /v1/spaces - lists spaces in organization", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/spaces",
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(2);
    const found = body.data.find((s: { id: string }) => s.id === spaceId);
    expect(found).toBeDefined();
    expect(found.name).toBe("Project Alpha");
  });

  it("PATCH /v1/spaces/:id - updates space metadata", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/v1/spaces/${spaceId}`,
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
      payload: {
        name: "Project Alpha Updated",
        color: "#10b981",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.name).toBe("Project Alpha Updated");
    expect(body.data.color).toBe("#10b981");
  });

  // ===================== COLLECTIONS =====================
  it("POST /v1/collections - creates a collection within a space", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/collections",
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
      payload: {
        space_id: spaceId,
        name: "Architecture Specs",
        color: "#f59e0b",
        view_mode: "grid",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.data.name).toBe("Architecture Specs");
    expect(body.data.space_id).toBe(spaceId);
    collectionId = body.data.id;
  });

  it("GET /v1/collections - lists collections filtered by space_id", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/v1/collections?space_id=${spaceId}`,
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data[0].id).toBe(collectionId);
  });

  it("PATCH /v1/collections/:id - updates collection (starring and view_mode)", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/v1/collections/${collectionId}`,
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
      payload: {
        is_starred: true,
        view_mode: "compact",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.is_starred).toBe(true);
    expect(body.data.default_view_mode).toBe("compact");
  });

  it("POST /v1/collections/:id/move - moves collection across spaces", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/v1/collections/${collectionId}/move`,
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
      payload: {
        to_space_id: secondSpaceId,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.space_id).toBe(secondSpaceId);

    // Move back to spaceId
    await app.inject({
      method: "POST",
      url: `/v1/collections/${collectionId}/move`,
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
      payload: {
        to_space_id: spaceId,
      },
    });
  });

  // ===================== GROUPS =====================
  it("POST /v1/groups - creates a group in a collection", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/groups",
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
      payload: {
        collection_id: collectionId,
        name: "Backend Endpoints",
        color: "#ec4899",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.data.name).toBe("Backend Endpoints");
    expect(body.data.collection_id).toBe(collectionId);
    groupId = body.data.id;
  });

  it("GET /v1/groups - lists groups in collection", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/v1/groups?collection_id=${collectionId}`,
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data[0].id).toBe(groupId);
  });

  it("PATCH /v1/groups/:id - updates group name and color", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/v1/groups/${groupId}`,
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
      payload: {
        name: "API Spec & Endpoints",
        color: "#8b5cf6",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.name).toBe("API Spec & Endpoints");
    expect(body.data.color).toBe("#8b5cf6");
  });

  it("DELETE /v1/groups/:id - soft-deletes group", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/v1/groups/${groupId}`,
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.deleted_at).toBeDefined();
  });

  it("DELETE /v1/spaces/:id - soft-deletes space and cascades to collections", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/v1/spaces/${spaceId}`,
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
    });

    expect(res.statusCode).toBe(200);

    // Collection inside should now be soft-deleted
    const colRes = await app.inject({
      method: "GET",
      url: `/v1/collections/${collectionId}`,
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
    });
    expect(colRes.statusCode).toBe(404);
  });
});
