import { describe, it, expect, beforeAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";

describe("Next Queue Realtime Sync Endpoints (07-features/17-next-queue.md)", () => {
  let app: FastifyInstance;
  let token = "";
  let accountId = "";

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    const email = `next_queue_user_${Date.now()}@example.com`;
    const signupRes = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: {
        email,
        password: "SecurePassword123!",
        name: "Next Queue Tester",
      },
    });

    const body = signupRes.json();
    token = body.data.access_token;
    accountId = body.data.account_id;
  });

  it("GET /v1/next - returns empty queue initially", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/next",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.items).toBeInstanceOf(Array);
    expect(body.data.total_count).toBe(0);
    expect(body.data.open_count).toBe(0);
  });

  it("POST /v1/next - adds an item to Next queue (canonical verb: Add to Next)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/next",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        url: "https://example.com/spec-guide",
        title: "Specification Guide",
        source_kind: "browser_tab",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.message).toBe("Added to Next");
    expect(body.data.urlSnapshot).toBe("https://example.com/spec-guide");
    expect(body.data.titleSnapshot).toBe("Specification Guide");
    expect(body.data.isDone).toBe(false);
    expect(body.data.accountId).toBe(accountId);
  });

  it("POST /v1/next - enforces duplicate-open idempotency (no-op with Already in Next)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/next",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        url: "https://example.com/spec-guide",
        title: "Specification Guide Duplicate",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.isExisting).toBe(true);
    expect(body.message).toBe("Already in Next");
    expect(body.data.isDone).toBe(false);
  });

  it("PATCH /v1/next/:id - marks item as done", async () => {
    // List to get the item id
    const listRes = await app.inject({
      method: "GET",
      url: "/v1/next",
      headers: { authorization: `Bearer ${token}` },
    });
    const item = listRes.json().data.items[0];

    const patchRes = await app.inject({
      method: "PATCH",
      url: `/v1/next/${item.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: {
        is_done: true,
      },
    });

    expect(patchRes.statusCode).toBe(200);
    const patched = patchRes.json().data;
    expect(patched.isDone).toBe(true);
  });

  it("POST /v1/next - duplicate-done un-archives existing row without duplicate", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/next",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        url: "https://example.com/spec-guide",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.reopened).toBe(true);
    expect(body.data.isDone).toBe(false);

    // Verify there is only 1 item in the queue
    const listRes = await app.inject({
      method: "GET",
      url: "/v1/next",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(listRes.json().data.total_count).toBe(1);
    expect(listRes.json().data.open_count).toBe(1);
  });

  it("POST /v1/next/clear-completed - deletes only completed items", async () => {
    // Add a second item
    const addRes = await app.inject({
      method: "POST",
      url: "/v1/next",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        url: "https://example.com/second-tab",
        title: "Second Tab",
      },
    });
    const secondItem = addRes.json().data;

    // Mark second item as done
    await app.inject({
      method: "PATCH",
      url: `/v1/next/${secondItem.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { is_done: true },
    });

    // Clear completed
    const clearRes = await app.inject({
      method: "POST",
      url: "/v1/next/clear-completed",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(clearRes.statusCode).toBe(200);
    expect(clearRes.json().data.deletedCount).toBe(1);

    // Verify only the open item remains
    const listRes = await app.inject({
      method: "GET",
      url: "/v1/next",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(listRes.json().data.total_count).toBe(1);
    expect(listRes.json().data.items[0].urlSnapshot).toBe("https://example.com/spec-guide");
  });

  it("DELETE /v1/next/:id - removes single item from Next", async () => {
    const listRes = await app.inject({
      method: "GET",
      url: "/v1/next",
      headers: { authorization: `Bearer ${token}` },
    });
    const item = listRes.json().data.items[0];

    const delRes = await app.inject({
      method: "DELETE",
      url: `/v1/next/${item.id}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(delRes.statusCode).toBe(200);
    expect(delRes.json().data.ok).toBe(true);

    const checkRes = await app.inject({
      method: "GET",
      url: "/v1/next",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(checkRes.json().data.total_count).toBe(0);
  });

  it("GET /v1/next/events - requires authentication", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/next/events",
    });

    expect(res.statusCode).toBe(401);
  });
});
