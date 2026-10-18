import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";

describe("Items & Session Saver Routes", () => {
  let app: FastifyInstance;
  let token = "";
  let orgId = "";
  let spaceId = "";
  let collectionId = "";
  let secondCollectionId = "";
  let groupId = "";
  let itemId = "";

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Signup test user
    const signupRes = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: {
        email: `items_owner_${Date.now()}@example.com`,
        password: "Password123!",
        name: "Items Test Owner",
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
      payload: { name: "Test Space" },
    });
    spaceId = spaceRes.json().data.id;

    // Create Collections
    const colRes1 = await app.inject({
      method: "POST",
      url: "/v1/collections",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: { space_id: spaceId, name: "Collection A" },
    });
    collectionId = colRes1.json().data.id;

    const colRes2 = await app.inject({
      method: "POST",
      url: "/v1/collections",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: { space_id: spaceId, name: "Collection B" },
    });
    secondCollectionId = colRes2.json().data.id;

    // Create a Group in Collection A
    const grpRes = await app.inject({
      method: "POST",
      url: "/v1/groups",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: { collection_id: collectionId, name: "Group A1" },
    });
    groupId = grpRes.json().data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ===================== ITEM CREATION =====================
  it("POST /v1/items - creates item directly in a collection", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/items",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        collection_id: collectionId,
        url: "https://github.com/letsmarknow",
        title: "GitHub LetsMarkNow",
        description: "Official GitHub repository",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.data.title).toBe("GitHub LetsMarkNow");
    expect(body.data.url).toBe("https://github.com/letsmarknow");
    expect(body.data.collection_id).toBe(collectionId);
    expect(body.data.group_id).toBeNull();
    itemId = body.data.id;
  });

  it("POST /v1/items - creates item inside a group", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/items",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        group_id: groupId,
        url: "https://news.ycombinator.com",
        title: "Hacker News",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.data.group_id).toBe(groupId);
    expect(body.data.collection_id).toBe(collectionId);
  });

  it("POST /v1/items - returns 400 for invalid URL scheme", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/items",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        collection_id: collectionId,
        url: "javascript:alert(1)",
      },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error.code).toBe("VALIDATION_FAILED");
  });

  // ===================== ITEM RETRIEVAL & FILTERING =====================
  it("GET /v1/items/:id - gets item by id", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/v1/items/${itemId}`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.id).toBe(itemId);
  });

  it("GET /v1/items - lists collection items (excluding groups by default)", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/v1/items?collection_id=${collectionId}`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.some((it: { id: string }) => it.id === itemId)).toBe(true);
    // Should not include the item in group by default
    expect(body.data.every((it: { group_id: string | null }) => it.group_id === null)).toBe(true);
  });

  it("GET /v1/items - lists collection items including groups when include_groups=true", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/v1/items?collection_id=${collectionId}&include_groups=true`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.some((it: { group_id: string | null }) => it.group_id === groupId)).toBe(true);
  });

  it("GET /v1/items - filters by search query q", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/v1/items?collection_id=${collectionId}&q=ycombinator`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBe(0); // since ycombinator is inside a group and include_groups is false

    const resWithGroups = await app.inject({
      method: "GET",
      url: `/v1/items?collection_id=${collectionId}&include_groups=true&q=ycombinator`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });

    expect(resWithGroups.statusCode).toBe(200);
    expect(resWithGroups.json().data.length).toBe(1);
  });

  // ===================== STAR / UNSTAR & UPDATE =====================
  it("POST /v1/items/:id/star and unstar", async () => {
    const starRes = await app.inject({
      method: "POST",
      url: `/v1/items/${itemId}/star`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });
    expect(starRes.statusCode).toBe(204);

    let getRes = await app.inject({
      method: "GET",
      url: `/v1/items/${itemId}`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });
    expect(getRes.json().data.is_starred).toBe(true);

    const unstarRes = await app.inject({
      method: "POST",
      url: `/v1/items/${itemId}/unstar`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });
    expect(unstarRes.statusCode).toBe(204);

    getRes = await app.inject({
      method: "GET",
      url: `/v1/items/${itemId}`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });
    expect(getRes.json().data.is_starred).toBe(false);
  });

  it("PATCH /v1/items/:id - updates item properties", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/v1/items/${itemId}`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        title: "Updated Title",
        color: "emerald",
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.title).toBe("Updated Title");
    expect(res.json().data.color).toBe("emerald");
  });

  // ===================== MOVE ITEM =====================
  it("POST /v1/items/:id/move - moves item to another collection", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/v1/items/${itemId}/move`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        to_collection_id: secondCollectionId,
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.collection_id).toBe(secondCollectionId);
    expect(res.json().data.group_id).toBeNull();
  });

  // ===================== SOFT DELETE & RESTORE =====================
  it("DELETE /v1/items/:id and POST /v1/items/:id/restore", async () => {
    const delRes = await app.inject({
      method: "DELETE",
      url: `/v1/items/${itemId}`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });
    expect(delRes.statusCode).toBe(200);
    expect(delRes.json().data.deleted_at).toBeDefined();

    // Verify item is 404
    const getRes = await app.inject({
      method: "GET",
      url: `/v1/items/${itemId}`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });
    expect(getRes.statusCode).toBe(404);

    // Restore item
    const restoreRes = await app.inject({
      method: "POST",
      url: `/v1/items/${itemId}/restore`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });
    expect(restoreRes.statusCode).toBe(200);
    expect(restoreRes.json().data.deleted_at).toBeNull();
  });

  // ===================== MASTER CASCADE INVARIANT =====================
  it("Group deletion retains items with group_id set to null in parent collection", async () => {
    // Create new group and item inside it
    const newGrpRes = await app.inject({
      method: "POST",
      url: "/v1/groups",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: { collection_id: secondCollectionId, name: "Temporary Group" },
    });
    const tempGroupId = newGrpRes.json().data.id;

    const itemInGrpRes = await app.inject({
      method: "POST",
      url: "/v1/items",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        group_id: tempGroupId,
        url: "https://example.org/survivor",
        title: "Survivor Item",
      },
    });
    const survivorItemId = itemInGrpRes.json().data.id;

    // Delete the group
    const delGrpRes = await app.inject({
      method: "DELETE",
      url: `/v1/groups/${tempGroupId}`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });
    expect(delGrpRes.statusCode).toBe(200);

    // Check survivor item - should still exist with group_id === null
    const survivorRes = await app.inject({
      method: "GET",
      url: `/v1/items/${survivorItemId}`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });
    expect(survivorRes.statusCode).toBe(200);
    expect(survivorRes.json().data.group_id).toBeNull();
    expect(survivorRes.json().data.collection_id).toBe(secondCollectionId);
  });

  // ===================== SESSION SAVER (CHROME EXTENSION CORE) =====================
  it("POST /v1/sessions/save/preview - dry run session tab save", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/sessions/save/preview",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        destination: {
          kind: "new_collection",
          name: "Preview Session",
        },
        tabs: [
          { url: "https://vitejs.dev", title: "Vite" },
          { url: "chrome://extensions", title: "Extensions" }, // should be skipped
          { url: "https://vitejs.dev", title: "Vite duplicate" }, // should be deduped
          { url: "https://react.dev", title: "React", pinned: true },
        ],
        options: {
          exclude_pinned: true,
          exclude_chrome_internal: true,
          dedupe_within_session: true,
        },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.would_create).toBe(1); // only vitejs.dev
    expect(body.data.would_skip).toBe(3); // chrome://, duplicate vite, pinned react
    expect(body.data.skipped.length).toBe(3);
  });

  it("POST /v1/sessions/save - persists tabs to new collection with undo_token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/sessions/save",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        destination: {
          kind: "new_collection",
          space_id: spaceId,
          name: "Sprint Tabs",
          color: "purple",
        },
        tabs: [
          { url: "https://developer.mozilla.org", title: "MDN Web Docs" },
          { url: "https://tailwindcss.com", title: "Tailwind CSS" },
          { url: "chrome://settings", title: "Settings" }, // will be skipped
        ],
        options: {
          exclude_chrome_internal: true,
          dedupe_within_session: true,
        },
        client: {
          window_id: 1,
          extension_version: "2.0.0",
          browser: "Chrome",
        },
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.data.items_created).toBe(2);
    expect(body.data.items_skipped).toBe(1);
    expect(body.data.destination.collection_id).toBeDefined();
    expect(body.data.undo_token).toMatch(/^lmn-undo-/);
    expect(body.data.history_event_id).toBeDefined();

    // Verify items exist in the newly created collection
    const listRes = await app.inject({
      method: "GET",
      url: `/v1/items?collection_id=${body.data.destination.collection_id}`,
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
    });
    expect(listRes.json().data.length).toBe(2);
  });
});
