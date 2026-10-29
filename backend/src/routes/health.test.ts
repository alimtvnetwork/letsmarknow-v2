import { describe, it, expect } from "vitest";
import { buildApp } from "../app.js";

describe("Health Check Routes", () => {
  it("should return 200 OK on /v1/health with version and ok status", async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: "GET",
      url: "/v1/health",
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe("ok");
    expect(body.version).toBe("0.2.11");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("uptimeSeconds");
  });

  it("should return 200 OK on unversioned /health", async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe("ok");
  });

  it("should return spec-compliant UPPER_SNAKE_CASE error envelope on 404", async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: "GET",
      url: "/v1/non-existent-route",
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("error");
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error).toHaveProperty("request_id");
  });
});
