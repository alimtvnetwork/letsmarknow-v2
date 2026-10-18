import { describe, it, expect, beforeAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";

describe("History, Undo/Redo & Trash Endpoints (Step 12)", () => {
  let app: FastifyInstance;
  let token = "";
  let orgId = "";
  let spaceId = "";
  let collectionId = "";
  let itemId = "";

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Signup test account
    const signupRes = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: {
        email: `history_tester_${Date.now()}@example.com`,
        password: "Password123!",
        name: "History Tester",
      },
    });

    const body = signupRes.json();
    token = body.data.access_token;
    orgId = body.data.default_organization_id;

    // Create a Space
    const spaceRes = await app.inject({
      method: "POST",
      url: "/v1/spaces",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: { name: "History Research Space" },
    });
    spaceId = spaceRes.json().data.id;

    // Create a Collection
    const colRes = await app.inject({
      method: "POST",
      url: "/v1/collections",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        space_id: spaceId,
        name: "Dev History",
        description: "Audit trail testing",
      },
    });
    collectionId = colRes.json().data.id;

    // Create an Item (emits item.created)
    const itemRes = await app.inject({
      method: "POST",
      url: "/v1/items",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        collection_id: collectionId,
        title: "Test Bookmark",
        url: "https://example.com/test",
      },
    });
    itemId = itemRes.json().data.id;
  });

  describe("History Event Querying", () => {
    it("GET /v1/history lists events for the active organization", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/v1/history",
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      });

      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.data).toBeInstanceOf(Array);
      expect(json.data.length).toBeGreaterThanOrEqual(1);

      const createEvt = json.data.find((e: any) => e.entity_id === itemId);
      expect(createEvt).toBeDefined();
      expect(createEvt.event_type).toBe("item.created");
      expect(createEvt.entity_type).toBe("item");
      expect(createEvt.undoable).toBe(true);
      expect(createEvt.is_undone).toBe(false);
    });

    it("GET /v1/history?entity_type=item filters events by entity_type", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/v1/history?entity_type=item",
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      });

      expect(res.statusCode).toBe(200);
      const data = res.json().data;
      expect(data.every((e: any) => e.entity_type === "item")).toBe(true);
    });

    it("GET /v1/history/for/:entity_type/:entity_id retrieves entity timeline", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/v1/history/for/item/${itemId}`,
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      });

      expect(res.statusCode).toBe(200);
      const data = res.json().data;
      expect(data.length).toBeGreaterThanOrEqual(1);
      expect(data[0].entity_id).toBe(itemId);
    });

    it("GET /v1/items/:id/history serves as a convenient alias for item history", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/v1/items/${itemId}/history`,
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      });

      expect(res.statusCode).toBe(200);
      const data = res.json().data;
      expect(data.length).toBeGreaterThanOrEqual(1);
      expect(data[0].entity_id).toBe(itemId);
    });

    it("GET /v1/history/:id returns single event details", async () => {
      const listRes = await app.inject({
        method: "GET",
        url: `/v1/items/${itemId}/history`,
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      });

      const eventId = listRes.json().data[0].id;

      const res = await app.inject({
        method: "GET",
        url: `/v1/history/${eventId}`,
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.id).toBe(eventId);
    });
  });

  describe("Undo & Redo Engine", () => {
    let deleteEventId = "";

    it("deletes item and records item.deleted history event", async () => {
      const delRes = await app.inject({
        method: "DELETE",
        url: `/v1/items/${itemId}`,
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      });

      expect(delRes.statusCode).toBe(200);

      // Verify history has delete event
      const historyRes = await app.inject({
        method: "GET",
        url: `/v1/items/${itemId}/history`,
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      });

      const events = historyRes.json().data;
      const delEvt = events.find((e: any) => e.event_type === "item.deleted");
      expect(delEvt).toBeDefined();
      deleteEventId = delEvt.id;
    });

    it("POST /v1/history/:id/undo restores the deleted item", async () => {
      const undoRes = await app.inject({
        method: "POST",
        url: `/v1/history/${deleteEventId}/undo`,
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      });

      expect(undoRes.statusCode).toBe(200);
      const data = undoRes.json().data;
      expect(data.undo_event_id).toBeDefined();
      expect(data.restored_entity_ids).toContain(itemId);

      // Verify item is restored (GET /v1/items/:id returns 200)
      const itemRes = await app.inject({
        method: "GET",
        url: `/v1/items/${itemId}`,
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      });
      expect(itemRes.statusCode).toBe(200);
    });

    it("POST /v1/history/:id/undo rejects already undone events with 409", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/v1/history/${deleteEventId}/undo`,
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      });

      expect(res.statusCode).toBe(409);
      expect(res.json().error.code).toBe("HISTORY_ALREADY_UNDONE");
    });

    it("POST /v1/history/:id/redo re-applies the deletion", async () => {
      const redoRes = await app.inject({
        method: "POST",
        url: `/v1/history/${deleteEventId}/redo`,
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      });

      expect(redoRes.statusCode).toBe(200);
      expect(redoRes.json().data.redo_event_id).toBeDefined();

      // Verify item is deleted again (GET /v1/items/:id returns 404)
      const itemRes = await app.inject({
        method: "GET",
        url: `/v1/items/${itemId}`,
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      });
      expect(itemRes.statusCode).toBe(404);
    });

    it("POST /v1/history/:id/redo rejects if not in undone state", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/v1/history/${deleteEventId}/redo`,
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      });

      expect(res.statusCode).toBe(409);
      expect(res.json().error.code).toBe("HISTORY_REDO_NOT_AVAILABLE");
    });
  });

  describe("Trash Lifecycle", () => {
    let trashItemId = "";

    beforeAll(async () => {
      // Create and delete an item to have in trash
      const createRes = await app.inject({
        method: "POST",
        url: "/v1/items",
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
        payload: {
          collection_id: collectionId,
          title: "Trash Candidate Item",
          url: "https://example.com/trash-candidate",
        },
      });
      trashItemId = createRes.json().data.id;

      await app.inject({
        method: "DELETE",
        url: `/v1/items/${trashItemId}`,
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      });
    });

    it("GET /v1/trash lists soft-deleted entities with purges_at schedule", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/v1/trash",
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      });

      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.data).toBeInstanceOf(Array);

      const target = json.data.find((t: any) => t.entity_id === trashItemId);
      expect(target).toBeDefined();
      expect(target.name).toBe("Trash Candidate Item");
      expect(target.entity_type).toBe("item");
      expect(target.purges_at).toBeDefined();
    });

    it("POST /v1/trash/restore restores soft-deleted entity", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/v1/trash/restore",
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
        payload: { entity_ids: [trashItemId] },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.restored_count).toBe(1);
      expect(res.json().data.restored_ids).toContain(trashItemId);

      // Verify item is restored
      const itemRes = await app.inject({
        method: "GET",
        url: `/v1/items/${trashItemId}`,
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      });
      expect(itemRes.statusCode).toBe(200);
    });

    it("POST /v1/trash/purge permanently hard-deletes specified trash entities", async () => {
      // Delete again
      await app.inject({
        method: "DELETE",
        url: `/v1/items/${trashItemId}`,
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      });

      const purgeRes = await app.inject({
        method: "POST",
        url: "/v1/trash/purge",
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
        payload: { entity_ids: [trashItemId] },
      });

      expect(purgeRes.statusCode).toBe(200);
      expect(purgeRes.json().data.purged_count).toBe(1);

      // Check trash no longer has this item
      const trashRes = await app.inject({
        method: "GET",
        url: "/v1/trash",
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      });
      const remaining = trashRes.json().data.find((t: any) => t.entity_id === trashItemId);
      expect(remaining).toBeUndefined();
    });

    it("POST /v1/trash/empty purges all soft-deleted items across the organization", async () => {
      // Create and delete another item
      const newItem = await app.inject({
        method: "POST",
        url: "/v1/items",
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
        payload: {
          collection_id: collectionId,
          title: "Temporary Trash 2",
          url: "https://example.com/temp2",
        },
      });
      const newId = newItem.json().data.id;
      await app.inject({
        method: "DELETE",
        url: `/v1/items/${newId}`,
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      });

      const emptyRes = await app.inject({
        method: "POST",
        url: "/v1/trash/empty",
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
        payload: {},
      });

      expect(emptyRes.statusCode).toBe(202);
      expect(emptyRes.json().data.status).toBe("completed");

      // Verify trash is completely empty
      const afterEmpty = await app.inject({
        method: "GET",
        url: "/v1/trash",
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      });
      expect(afterEmpty.json().data).toHaveLength(0);
    });
  });
});
