import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";

describe("Auth & Account Routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  const testUser = {
    email: `alice_${Date.now()}@example.com`,
    password: "Password123!",
    name: "Alice Developer",
  };

  let accessToken = "";
  let refreshCookie = "";
  let accountId = "";

  it("POST /v1/auth/signup - registers user, sets cookie, provisions org", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: testUser,
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.data).toBeDefined();
    expect(body.data.account_id).toBeDefined();
    expect(body.data.access_token).toBeDefined();
    expect(body.data.default_organization_id).toBeDefined();
    expect(body.data.expires_in).toBe(900);

    accountId = body.data.account_id;
    accessToken = body.data.access_token;

    // Check lmn_refresh cookie was set
    const cookies = res.cookies;
    const cookie = cookies.find((c) => c.name === "lmn_refresh");
    expect(cookie).toBeDefined();
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.path).toBe("/v1/auth");
    refreshCookie = `${cookie?.name}=${cookie?.value}`;
  });

  it("POST /v1/auth/signup - rejects duplicate email with 409 CONFLICT", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: testUser,
    });

    expect(res.statusCode).toBe(409);
    const body = res.json();
    expect(body.error.code).toBe("CONFLICT");
  });

  it("POST /v1/auth/signup - rejects short password with 400 VALIDATION_FAILED", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: {
        email: "short@example.com",
        password: "short",
      },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error.code).toBe("VALIDATION_FAILED");
  });

  it("POST /v1/auth/signin - signs in with correct credentials", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/auth/signin",
      payload: {
        email: testUser.email,
        password: testUser.password,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.account_id).toBe(accountId);
    expect(body.data.access_token).toBeDefined();
    expect(body.data.mfa_required).toBe(false);

    // Update tokens
    accessToken = body.data.access_token;
    const cookie = res.cookies.find((c) => c.name === "lmn_refresh");
    if (cookie) {
      refreshCookie = `${cookie.name}=${cookie.value}`;
    }
  });

  it("POST /v1/auth/signin - rejects invalid credentials with 401 UNAUTHENTICATED", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/auth/signin",
      payload: {
        email: testUser.email,
        password: "WrongPassword!",
      },
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });

  it("POST /v1/auth/token - rotates refresh token and returns new access token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/auth/token",
      headers: {
        cookie: refreshCookie,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.access_token).toBeDefined();
    expect(body.data.expires_in).toBe(900);

    // Update token
    accessToken = body.data.access_token;
    const cookie = res.cookies.find((c) => c.name === "lmn_refresh");
    if (cookie) {
      refreshCookie = `${cookie.name}=${cookie.value}`;
    }
  });

  it("GET /v1/account - rejects unauthenticated access with 401", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/account",
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });

  it("GET /v1/account - returns profile for authenticated user", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/account",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.id).toBe(accountId);
    expect(body.data.email).toBe(testUser.email);
    expect(body.data.name).toBe(testUser.name);
  });

  it("PATCH /v1/account - updates profile display name", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/v1/account",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      payload: {
        name: "Alice Updated",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.name).toBe("Alice Updated");
  });

  it("GET /v1/auth/sessions - lists active sessions", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/auth/sessions",
      headers: {
        authorization: `Bearer ${accessToken}`,
        cookie: refreshCookie,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it("POST /v1/auth/signout - revokes session and clears cookie", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/auth/signout",
      headers: {
        cookie: refreshCookie,
      },
    });

    expect(res.statusCode).toBe(204);
  });
});
