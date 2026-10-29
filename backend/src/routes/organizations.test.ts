import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";

describe("Organization Routes & RBAC", () => {
  let app: FastifyInstance;
  let ownerToken = "";
  let ownerAccountId = "";
  let defaultOrgId = "";
  let createdOrgId = "";

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Register a test owner user
    const signupRes = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: {
        email: `org_owner_${Date.now()}@example.com`,
        password: "Password123!",
        name: "Org Owner",
      },
    });

    const body = signupRes.json();
    ownerToken = body.data.access_token;
    ownerAccountId = body.data.account_id;
    defaultOrgId = body.data.default_organization_id;
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /v1/organizations - lists organizations where user is a member", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/organizations",
      headers: {
        authorization: `Bearer ${ownerToken}`,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data[0].id).toBe(defaultOrgId);
    expect(body.data[0].my_role).toBe("owner");
  });

  it("POST /v1/organizations - creates a new organization with owner role", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/organizations",
      headers: {
        authorization: `Bearer ${ownerToken}`,
      },
      payload: {
        name: "Acme Corp",
        brand_color: "#10b981",
        theme: "emerald",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.data.name).toBe("Acme Corp");
    expect(body.data.my_role).toBe("owner");
    expect(body.data.owner_account_id).toBe(ownerAccountId);
    createdOrgId = body.data.id;
  });

  it("GET /v1/organizations/:id - retrieves details for a member", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/v1/organizations/${createdOrgId}`,
      headers: {
        authorization: `Bearer ${ownerToken}`,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.id).toBe(createdOrgId);
    expect(body.data.name).toBe("Acme Corp");
    expect(body.data.subscription).toBeDefined();
    expect(body.data.member_count).toBe(1);
  });

  it("PATCH /v1/organizations/:id - allows owner to update org details", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/v1/organizations/${createdOrgId}`,
      headers: {
        authorization: `Bearer ${ownerToken}`,
        "x-organization-id": createdOrgId,
      },
      payload: {
        name: "Acme International",
        brand_color: "#3b82f6",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.name).toBe("Acme International");
    expect(body.data.avatar_color).toBe("#3b82f6");
  });

  it("GET /v1/organizations/:id - returns 404 for non-members without leaking org existence", async () => {
    // Create an outsider user
    const outsiderSignup = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: {
        email: `outsider_${Date.now()}@example.com`,
        password: "Password123!",
        name: "Outsider",
      },
    });
    const outsiderToken = outsiderSignup.json().data.access_token;

    const res = await app.inject({
      method: "GET",
      url: `/v1/organizations/${createdOrgId}`,
      headers: {
        authorization: `Bearer ${outsiderToken}`,
      },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe("NOT_FOUND");
  });

  it("DELETE /v1/organizations/:id - soft-deletes organization with confirmation text", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/v1/organizations/${createdOrgId}`,
      headers: {
        authorization: `Bearer ${ownerToken}`,
        "x-organization-id": createdOrgId,
      },
      payload: {
        confirm_text: "delete acme international",
      },
    });

    expect(res.statusCode).toBe(202);
    const body = res.json();
    expect(body.data.deleted_at).toBeDefined();
    expect(body.data.purges_at).toBeDefined();
  });
});
