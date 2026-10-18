import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";

describe("Member & Invite Routes", () => {
  let app: FastifyInstance;
  let ownerToken = "";
  let orgId = "";
  let inviteToken = "";
  let inviteId = "";
  let invitedMemberId = "";
  let editorToken = "";

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Register owner
    const signupRes = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: {
        email: `member_owner_${Date.now()}@example.com`,
        password: "Password123!",
        name: "Workspace Owner",
      },
    });

    const body = signupRes.json();
    ownerToken = body.data.access_token;
    orgId = body.data.default_organization_id;
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /v1/members/invites - invites new member with 207 Multi-Status", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/members/invites",
      headers: {
        authorization: `Bearer ${ownerToken}`,
        "x-organization-id": orgId,
      },
      payload: {
        invites: [
          {
            email: `collab_${Date.now()}@example.com`,
            role: "editor",
            message: "Welcome to our workspace!",
          },
        ],
      },
    });

    expect(res.statusCode).toBe(207);
    const body = res.json();
    expect(body.data.results).toHaveLength(1);
    expect(body.data.results[0].status).toBe(201);
    expect(body.data.results[0].invite_token).toBeDefined();

    inviteToken = body.data.results[0].invite_token;
    inviteId = body.data.results[0].member_id;
  });

  it("GET /v1/members - lists members and pending invites", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/members",
      headers: {
        authorization: `Bearer ${ownerToken}`,
        "x-organization-id": orgId,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(2); // owner + pending invite
    const pending = body.data.find((m: { status: string }) => m.status === "pending");
    expect(pending).toBeDefined();
    expect(pending.role).toBe("editor");
  });

  it("POST /v1/members/invites/accept - accepts invite and joins organization", async () => {
    // Sign up the invited user first so their account exists
    const newUserSignup = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: {
        email: `new_member_${Date.now()}@example.com`,
        password: "Password123!",
        name: "New Collaborator",
      },
    });
    const newUserId = newUserSignup.json().data.account_id;

    // Accept invite
    const res = await app.inject({
      method: "POST",
      url: "/v1/members/invites/accept",
      headers: {
        authorization: `Bearer ${newUserSignup.json().data.access_token}`,
      },
      payload: {
        token: inviteToken,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.organization_id).toBe(orgId);
    expect(body.data.role).toBe("editor");
    expect(body.data.requires_signup).toBe(false);
    expect(body.data.access_token).toBeDefined();

    invitedMemberId = body.data.member_id;
    editorToken = body.data.access_token;
  });

  it("PATCH /v1/members/:id - owner promotes editor to admin", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/v1/members/${invitedMemberId}`,
      headers: {
        authorization: `Bearer ${ownerToken}`,
        "x-organization-id": orgId,
      },
      payload: {
        role: "admin",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.role).toBe("admin");
  });

  it("RBAC enforcement - prevents unauthorized member operations", async () => {
    // Create a viewer user
    const viewerSignup = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: {
        email: `viewer_${Date.now()}@example.com`,
        password: "Password123!",
        name: "Viewer Only",
      },
    });
    const viewerToken = viewerSignup.json().data.access_token;

    // Viewer tries to invite members -> 404 because not a member of orgId
    const res = await app.inject({
      method: "POST",
      url: "/v1/members/invites",
      headers: {
        authorization: `Bearer ${viewerToken}`,
        "x-organization-id": orgId,
      },
      payload: {
        invites: [{ email: "test@example.com", role: "viewer" }],
      },
    });

    expect(res.statusCode).toBe(404);
  });

  it("DELETE /v1/members/:id - owner removes member", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/v1/members/${invitedMemberId}`,
      headers: {
        authorization: `Bearer ${ownerToken}`,
        "x-organization-id": orgId,
      },
    });

    expect(res.statusCode).toBe(204);
  });
});
