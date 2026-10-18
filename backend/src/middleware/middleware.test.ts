import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../app.js";
import { requireOrganization } from "./tenancy.js";
import { assertConcurrency } from "./concurrency.js";
import { memoryIdempotencyStore } from "../adapters/memoryIdempotencyStore.js";
import { uuidv7 } from "../db/utils/uuidv7.js";

describe("Base Middleware Verification", () => {
  describe("requireOrganization Middleware", () => {
    it("should throw ORG_HEADER_REQUIRED when X-Organization-Id is missing", async () => {
      const app = await buildApp();
      app.get("/test-org-protected", { preHandler: [requireOrganization] }, async () => {
        return { ok: true };
      });

      const response = await app.inject({
        method: "GET",
        url: "/test-org-protected",
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe("ORG_HEADER_REQUIRED");
    });

    it("should throw VALIDATION_FAILED when X-Organization-Id is not a valid UUID", async () => {
      const app = await buildApp();
      app.get("/test-org-uuid", { preHandler: [requireOrganization] }, async () => {
        return { ok: true };
      });

      const response = await app.inject({
        method: "GET",
        url: "/test-org-uuid",
        headers: {
          "x-organization-id": "not-a-valid-uuid",
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe("VALIDATION_FAILED");
      expect(body.error.field).toBe("x-organization-id");
    });

    it("should allow request through when valid UUID X-Organization-Id is provided", async () => {
      const validOrgId = uuidv7();
      const app = await buildApp();
      app.get("/test-org-valid", { preHandler: [requireOrganization] }, async (req) => {
        return { orgId: req.organizationId };
      });

      const response = await app.inject({
        method: "GET",
        url: "/test-org-valid",
        headers: {
          "x-organization-id": validOrgId,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.orgId).toBe(validOrgId);
    });
  });

  describe("Idempotency Middleware", () => {
    beforeEach(() => {
      memoryIdempotencyStore.clear();
    });

    it("should replay cached response on duplicate Idempotency-Key with same body", async () => {
      const app = await buildApp();
      let callCount = 0;

      app.post("/test-items", async (req, reply) => {
        callCount += 1;
        reply.status(201);
        return {
          id: `item-${callCount}`,
          payload: req.body,
        };
      });

      const key = uuidv7();
      const payload = { title: "GitHub Repo", url: "https://github.com" };

      // First call
      const res1 = await app.inject({
        method: "POST",
        url: "/test-items",
        headers: { "idempotency-key": key },
        payload,
      });

      expect(res1.statusCode).toBe(201);
      const body1 = JSON.parse(res1.body);
      expect(body1.id).toBe("item-1");
      expect(callCount).toBe(1);

      // Second call with same key and same body
      const res2 = await app.inject({
        method: "POST",
        url: "/test-items",
        headers: { "idempotency-key": key },
        payload,
      });

      expect(res2.statusCode).toBe(201);
      expect(res2.headers["x-idempotent-replay"]).toBe("true");
      const body2 = JSON.parse(res2.body);
      expect(body2.id).toBe("item-1"); // Replayed response, not item-2!
      expect(callCount).toBe(1); // Handler was not re-executed!
    });

    it("should reject with IDEMPOTENCY_KEY_REUSED_DIFFERENT_BODY if body differs", async () => {
      const app = await buildApp();
      app.post("/test-items-body", async (_req, reply) => {
        reply.status(201);
        return { created: true };
      });

      const key = uuidv7();

      // First call
      await app.inject({
        method: "POST",
        url: "/test-items-body",
        headers: { "idempotency-key": key },
        payload: { title: "Original" },
      });

      // Second call with same key but different body
      const res2 = await app.inject({
        method: "POST",
        url: "/test-items-body",
        headers: { "idempotency-key": key },
        payload: { title: "Modified Body!" },
      });

      expect(res2.statusCode).toBe(400);
      const body2 = JSON.parse(res2.body);
      expect(body2.error.code).toBe("IDEMPOTENCY_KEY_REUSED_DIFFERENT_BODY");
    });
  });

  describe("Optimistic Concurrency (assertConcurrency)", () => {
    it("should reject mismatching If-Match with 409 STALE_RESOURCE", async () => {
      const app = await buildApp();
      const entityUpdatedAt = new Date("2026-10-15T12:00:00.000Z");

      app.patch("/test-item/:id", async (req, reply) => {
        assertConcurrency(req, reply, entityUpdatedAt);
        return { updated: true };
      });

      const response = await app.inject({
        method: "PATCH",
        url: "/test-item/123",
        headers: {
          "if-match": "2026-10-15T10:00:00.000Z", // Stale ETag
        },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe("STALE_RESOURCE");
      expect(body.error.details.current).toBe(entityUpdatedAt.toISOString());
    });

    it("should pass and set ETag when If-Match matches current updated_at", async () => {
      const app = await buildApp();
      const entityUpdatedAt = new Date("2026-10-15T12:00:00.000Z");

      app.patch("/test-item-match/:id", async (req, reply) => {
        assertConcurrency(req, reply, entityUpdatedAt);
        return { updated: true };
      });

      const response = await app.inject({
        method: "PATCH",
        url: "/test-item-match/123",
        headers: {
          "if-match": entityUpdatedAt.toISOString(),
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["etag"]).toBe(entityUpdatedAt.toISOString());
    });
  });
});
