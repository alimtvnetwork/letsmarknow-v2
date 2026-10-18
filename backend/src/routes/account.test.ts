import { describe, it, expect, beforeAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";

describe("Account & Session Management Endpoints (Step 14)", () => {
  let app: FastifyInstance;
  let token = "";
  let accountId = "";
  let email = "";
  let sessionCookie = "";

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    email = `acc_tester_${Date.now()}@example.com`;
    const signupRes = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: {
        email,
        password: "InitialPassword123!",
        name: "Account Tester",
      },
    });

    const body = signupRes.json();
    token = body.data.access_token;
    accountId = body.data.account_id;

    const cookie = signupRes.cookies.find((c) => c.name === "lmn_refresh");
    if (cookie) {
      sessionCookie = `${cookie.name}=${cookie.value}`;
    }
  });

  it("GET /v1/account - returns user profile and verification status", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/account",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.id).toBe(accountId);
    expect(body.data.email).toBe(email);
    expect(body.data.name).toBe("Account Tester");
    expect(body.data.email_verified).toBe(false);
  });

  it("PATCH /v1/account - updates profile display name and avatar", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/v1/account",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        name: "Account Tester Updated",
        avatar_url: "https://example.com/avatar.png",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.name).toBe("Account Tester Updated");
    expect(body.data.avatar_url).toBe("https://example.com/avatar.png");
  });

  it("GET /v1/account/preferences - returns default preferences", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/account/preferences",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.preferences).toBeDefined();
    expect(body.data.preferences.default_view).toBe("grid");
    expect(body.data.preferences.theme).toBe("system");
    expect(body.data.preferences.locale).toBe("en-US");
    expect(body.data.preferences.layout).toBeDefined();
    expect(body.data.updated_at).toBeDefined();
  });

  it("PATCH /v1/account/preferences - updates preferences partially", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/v1/account/preferences",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        theme: "dark",
        default_view: "mindmap",
        layout: {
          sidebar_width_px: 320,
        },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.preferences.theme).toBe("dark");
    expect(body.data.preferences.default_view).toBe("mindmap");
    expect(body.data.preferences.layout.sidebar_width_px).toBe(320);
    // Preserves existing default values
    expect(body.data.preferences.locale).toBe("en-US");
  });

  it("PATCH /v1/account/preferences - enforces If-Match optimistic concurrency", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/v1/account/preferences",
      headers: {
        authorization: `Bearer ${token}`,
        "if-match": "2020-01-01T00:00:00.000Z", // Stale timestamp
      },
      payload: {
        theme: "light",
      },
    });

    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe("CONFLICT");
  });

  it("POST /v1/auth/password/change - rejects incorrect current password (401)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/auth/password/change",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        current_password: "WrongPassword!",
        new_password: "NewSecurePassword123!",
      },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("AUTH_INVALID_CREDENTIALS");
  });

  it("POST /v1/auth/password/change - rejects short new password (400)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/auth/password/change",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        current_password: "InitialPassword123!",
        new_password: "short",
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("VALIDATION_FAILED");
  });

  it("POST /v1/auth/password/change - successfully updates password", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/auth/password/change",
      headers: {
        authorization: `Bearer ${token}`,
        cookie: sessionCookie,
      },
      payload: {
        current_password: "InitialPassword123!",
        new_password: "NewSecurePassword123!",
      },
    });

    expect(res.statusCode).toBe(204);

    // Verify signin works with new password
    const signinRes = await app.inject({
      method: "POST",
      url: "/v1/auth/signin",
      payload: {
        email,
        password: "NewSecurePassword123!",
      },
    });

    expect(signinRes.statusCode).toBe(200);
    token = signinRes.json().data.access_token;
  });

  it("GET /v1/auth/sessions - lists active sessions", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/auth/sessions",
      headers: {
        authorization: `Bearer ${token}`,
        cookie: sessionCookie,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data).toBeInstanceOf(Array);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data[0].id).toBeDefined();
  });

  it("DELETE /v1/auth/sessions/:id - prevents revoking current session (403)", async () => {
    const listRes = await app.inject({
      method: "GET",
      url: "/v1/auth/sessions",
      headers: {
        authorization: `Bearer ${token}`,
        cookie: sessionCookie,
      },
    });

    const sessions = listRes.json().data;
    const currentSession = sessions.find((s: { current: boolean }) => s.current);

    if (currentSession) {
      const res = await app.inject({
        method: "DELETE",
        url: `/v1/auth/sessions/${currentSession.id}`,
        headers: {
          authorization: `Bearer ${token}`,
          cookie: sessionCookie,
        },
      });

      expect(res.statusCode).toBe(403);
      expect(res.json().error.code).toBe("FORBIDDEN");
    }
  });

  it("POST /v1/me/gdpr-export - triggers GDPR data export (202 Accepted)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/me/gdpr-export",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        destination_email: email,
      },
    });

    expect(res.statusCode).toBe(202);
    const body = res.json();
    expect(body.data.request_id).toBeDefined();
    expect(body.data.eta_hours).toBe(24);
  });

  it("POST /v1/auth/signout-all - signs out from all devices", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/auth/signout-all",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(204);
  });
});
