import { describe, it, expect, beforeAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";
import { memRepo } from "../db/memRepo.js";

describe("Feature Flags Endpoints (Step 16)", () => {
  let app: FastifyInstance;
  let token = "";
  let accountId = "";
  let orgId = "";

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    const signupRes = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: {
        email: `flag_tester_${Date.now()}@example.com`,
        password: "Password123!",
        name: "Flag Tester",
      },
    });

    const body = signupRes.json();
    token = body.data.access_token;
    accountId = body.data.account_id;
    orgId = body.data.default_organization_id;
  });

  it("GET /v1/flags - lists all registered flags for current caller context", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/flags",
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.evaluated_at).toBeDefined();
    expect(body.data.ttl_seconds).toBe(60);
    expect(body.data.exposure_logged).toBe(true);
    expect(body.data.flags.mindmap_v2).toBeDefined();
    expect(body.data.flags.mindmap_v2.variant).toBe("on");
  });

  it("POST /v1/flags/evaluate - evaluates requested flag keys with correct reasons", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/flags/evaluate",
      headers: {
        authorization: `Bearer ${token}`,
        "x-organization-id": orgId,
      },
      payload: {
        flags: ["mindmap_v2", "ai_assist", "share_password_v2"],
        context: {
          surface: "web_app",
          url_host: "app.letsmarknow.com",
          locale: "en-US",
          client_version: "1.4.2",
        },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.flags.mindmap_v2).toBeDefined();
    expect(body.data.flags.mindmap_v2.variant).toBe("on");

    // ai_assist has 0% rollout and targeting plan: ["pro", "team", "enterprise"] while current org is free
    expect(body.data.flags.ai_assist).toBeDefined();
    expect(body.data.flags.ai_assist.variant).toBe("off");
    expect(body.data.flags.ai_assist.reason).toBe("not_in_targeting");

    // share_password_v2 is multivariate
    expect(body.data.flags.share_password_v2).toBeDefined();
    expect(["control", "treatment"]).toContain(body.data.flags.share_password_v2.variant);
  });

  it("POST /v1/flags/evaluate - silently drops unknown flag keys without error", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/flags/evaluate",
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        flags: ["mindmap_v2", "completely_unknown_flag_key"],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.flags.mindmap_v2).toBeDefined();
    expect(body.data.flags.completely_unknown_flag_key).toBeUndefined();
  });

  it("POST /v1/flags/evaluate - killswitch forces variant off with reason killswitch", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/flags/evaluate",
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        flags: ["safety.share_revoke.kill_switch"],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.flags["safety.share_revoke.kill_switch"].variant).toBe("off");
    expect(body.data.flags["safety.share_revoke.kill_switch"].reason).toBe("killswitch");
  });

  it("POST /v1/flags/evaluate - targeting allowlist enables flag for specific account", async () => {
    // Add custom flag with accountId allowlist
    memRepo.flags.set("beta_feature_x", {
      key: "beta_feature_x",
      type: "boolean",
      defaultValue: "off",
      rolloutPct: 0,
      targeting: {
        accountIds: [accountId],
      },
    });

    const res = await app.inject({
      method: "POST",
      url: "/v1/flags/evaluate",
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        flags: ["beta_feature_x"],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.flags.beta_feature_x.variant).toBe("on");
    expect(body.data.flags.beta_feature_x.reason).toBe("rollout_email_allowlist");
  });

  it("POST /v1/flags/evaluate - validation fails on empty flags array", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/flags/evaluate",
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        flags: [],
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("VALIDATION_FAILED");
  });
});
