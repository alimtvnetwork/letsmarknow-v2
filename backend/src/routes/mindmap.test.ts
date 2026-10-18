import { describe, it, expect, beforeAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";
import { memRepo } from "../db/memRepo.js";
import { uuidv7 } from "../db/utils/uuidv7.js";

describe("Mindmap Layout Endpoints (Step 13)", () => {
  let app: FastifyInstance;
  let token = "";
  let memberToken = "";
  let orgId = "";
  let collectionId = "";
  let layoutId = "";
  let layout2Id = "";

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Signup owner account
    const signupRes = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: {
        email: `mindmap_owner_${Date.now()}@example.com`,
        password: "Password123!",
        name: "Mindmap Owner",
      },
    });

    const body = signupRes.json();
    token = body.data.access_token;
    orgId = body.data.default_organization_id;

    // Create a Space & Collection
    const spaceRes = await app.inject({
      method: "POST",
      url: "/v1/spaces",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: { name: "Mindmap Space" },
    });
    const spaceId = spaceRes.json().data.id;

    const colRes = await app.inject({
      method: "POST",
      url: "/v1/collections",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        space_id: spaceId,
        name: "Mindmap Collection",
        description: "Visual canvas tests",
      },
    });
    collectionId = colRes.json().data.id;

    // Signup a second user in the same org as a member
    const memberSignupRes = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: {
        email: `mindmap_member_${Date.now()}@example.com`,
        password: "Password123!",
        name: "Mindmap Member",
      },
    });
    const memberBody = memberSignupRes.json();
    memberToken = memberBody.data.access_token;
    const memberAccountId = memberBody.data.account_id;

    // Add second user to org in memRepo
    memRepo.members.push({
      id: uuidv7(),
      organizationId: orgId,
      accountId: memberAccountId,
      role: "editor",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it("POST /v1/mindmap-layouts - creates a layout with nodes, edges, viewport", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/mindmap-layouts",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        name: "Q1 Priorities",
        scope_type: "collection",
        scope_id: collectionId,
        is_default: true,
        shared_with_org: false,
        viewport: { x: 100, y: 50, zoom: 1.2 },
        nodes: [
          {
            id: "0190a4f1-6c5e-7c2a-9b3f-111111111111",
            kind: "collection",
            ref_id: collectionId,
            x: 0,
            y: 0,
            collapsed: false,
          },
          {
            id: "0190a4f1-6c5e-7c2a-9b3f-222222222222",
            kind: "item",
            x: 150,
            y: 80,
            collapsed: false,
            color: "blue",
          },
        ],
        edges: [
          {
            from: "0190a4f1-6c5e-7c2a-9b3f-111111111111",
            to: "0190a4f1-6c5e-7c2a-9b3f-222222222222",
            kind: "containment",
            label: "child",
          },
        ],
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.data).toBeDefined();
    expect(body.data.name).toBe("Q1 Priorities");
    expect(body.data.scope_type).toBe("collection");
    expect(body.data.scope_id).toBe(collectionId);
    expect(body.data.is_default).toBe(true);
    expect(body.data.viewport).toEqual({ x: 100, y: 50, zoom: 1.2 });
    expect(body.data.nodes).toHaveLength(2);
    expect(body.data.edges).toHaveLength(1);
    layoutId = body.data.id;
  });

  it("POST /v1/mindmap-layouts - rejects duplicate name for same scope (409 CONFLICT_NAME_TAKEN)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/mindmap-layouts",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        name: "Q1 Priorities",
        scope_type: "collection",
        scope_id: collectionId,
      },
    });

    expect(res.statusCode).toBe(409);
    const body = res.json();
    expect(body.error.code).toBe("CONFLICT_NAME_TAKEN");
  });

  it("POST /v1/mindmap-layouts - rejects empty name (400 VALIDATION_FAILED)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/mindmap-layouts",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        name: "   ",
        scope_type: "collection",
        scope_id: collectionId,
      },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error.code).toBe("VALIDATION_FAILED");
  });

  it("POST /v1/mindmap-layouts - atomic default unset when creating another default layout", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/mindmap-layouts",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        name: "Q2 Roadmaps",
        scope_type: "collection",
        scope_id: collectionId,
        is_default: true,
        shared_with_org: true,
      },
    });

    expect(res.statusCode).toBe(201);
    layout2Id = res.json().data.id;
    expect(res.json().data.is_default).toBe(true);

    // Verify first layout is no longer default
    const firstRes = await app.inject({
      method: "GET",
      url: `/v1/mindmap-layouts/${layoutId}`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });
    expect(firstRes.statusCode).toBe(200);
    expect(firstRes.json().data.is_default).toBe(false);
  });

  it("GET /v1/mindmap-layouts - returns light summary list (metadata only)", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/v1/mindmap-layouts?scope_type=collection&scope_id=${collectionId}`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data).toBeInstanceOf(Array);
    expect(body.data.length).toBeGreaterThanOrEqual(2);

    const first = body.data[0];
    expect(first.name).toBeDefined();
    expect(first.scope_type).toBe("collection");
    expect(first.node_count).toBeDefined();
    expect(first.created_by_account_id).toBeDefined();
    // Heavy payload properties must NOT be returned in list
    expect(first.nodes).toBeUndefined();
    expect(first.edges).toBeUndefined();
    expect(first.viewport).toBeUndefined();
  });

  it("GET /v1/mindmap-layouts/:id - returns full layout with nodes and viewport", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/v1/mindmap-layouts/${layoutId}`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.id).toBe(layoutId);
    expect(body.data.nodes).toHaveLength(2);
    expect(body.data.edges).toHaveLength(1);
    expect(body.data.viewport).toEqual({ x: 100, y: 50, zoom: 1.2 });
  });

  it("PATCH /v1/mindmap-layouts/:id - updates name, nodes, and viewport", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/v1/mindmap-layouts/${layoutId}`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        name: "Q1 Revised Priorities",
        viewport: { x: 200, y: 100, zoom: 1.5 },
        nodes: [
          {
            id: "0190a4f1-6c5e-7c2a-9b3f-111111111111",
            kind: "collection",
            x: 50,
            y: 50,
            collapsed: true,
          },
        ],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.name).toBe("Q1 Revised Priorities");
    expect(body.data.viewport).toEqual({ x: 200, y: 100, zoom: 1.5 });
    expect(body.data.nodes).toHaveLength(1);
  });

  it("Shared layouts - other org members can view shared layout", async () => {
    // layout2Id is shared_with_org: true
    const res = await app.inject({
      method: "GET",
      url: `/v1/mindmap-layouts/${layout2Id}`,
      headers: { authorization: `Bearer ${memberToken}`, "x-organization-id": orgId },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.id).toBe(layout2Id);
  });

  it("Private layouts - other non-admin member cannot view private layout (403)", async () => {
    // layoutId is shared_with_org: false
    const res = await app.inject({
      method: "GET",
      url: `/v1/mindmap-layouts/${layoutId}`,
      headers: { authorization: `Bearer ${memberToken}`, "x-organization-id": orgId },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe("PERM_DENIED");
  });

  it("DELETE /v1/mindmap-layouts/:id - deletes layout and promotes next sibling if was default", async () => {
    // layout2Id is currently default
    const res = await app.inject({
      method: "DELETE",
      url: `/v1/mindmap-layouts/${layout2Id}`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.id).toBe(layout2Id);
    expect(body.data.was_default).toBe(true);
    expect(body.data.new_default_id).toBe(layoutId);

    // Verify promoted layout is now default
    const getRes = await app.inject({
      method: "GET",
      url: `/v1/mindmap-layouts/${layoutId}`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });
    expect(getRes.statusCode).toBe(200);
    expect(getRes.json().data.is_default).toBe(true);
  });

  it("DELETE /v1/mindmap-layouts/:id - idempotent re-deletion returns already_deleted: true", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/v1/mindmap-layouts/${layout2Id}`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.already_deleted).toBe(true);
  });
});
