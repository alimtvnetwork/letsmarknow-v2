import { describe, it, expect, beforeAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";

describe("Shares & Public Viewer Endpoints (Step 11)", () => {
  let app: FastifyInstance;
  let token = "";
  let orgId = "";
  let spaceId = "";
  let collectionId = "";
  let groupId = "";
  let itemId = "";

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Signup test account
    const signupRes = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: {
        email: `share_tester_${Date.now()}@example.com`,
        password: "Password123!",
        name: "Share Tester",
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
      payload: { name: "Shared Research Space" },
    });
    spaceId = spaceRes.json().data.id;

    // Create a Collection
    const colRes = await app.inject({
      method: "POST",
      url: "/v1/collections",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        space_id: spaceId,
        name: "AI & ML Bookmarks",
        description: "Curated AI engineering resources",
      },
    });
    collectionId = colRes.json().data.id;

    // Create a Group in Collection
    const groupRes = await app.inject({
      method: "POST",
      url: "/v1/groups",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        collection_id: collectionId,
        name: "Language Models",
      },
    });
    groupId = groupRes.json().data.id;

    // Create an Item in Group
    const itemRes = await app.inject({
      method: "POST",
      url: "/v1/items",
      headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      payload: {
        collection_id: collectionId,
        group_id: groupId,
        title: "Anthropic Claude",
        url: "https://claude.ai",
        description: "Conversational AI Assistant",
      },
    });
    itemId = itemRes.json().data.id;
  });

  describe("Public Share Link Flow", () => {
    let publicShareId = "";
    let publicSlug = "";

    it("creates a public share for a collection", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/v1/shares",
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
        payload: {
          target_type: "collection",
          target_id: collectionId,
          mode: "public",
          title_override: "Top AI Reads",
          description_override: "A publicly shared list of top AI links",
        },
      });

      expect(res.statusCode).toBe(201);
      const data = res.json().data;
      expect(data.id).toBeDefined();
      expect(data.slug).toMatch(/^[a-z0-9]{10}$/);
      expect(data.mode).toBe("public");
      expect(data.title_override).toBe("Top AI Reads");
      expect(data.password_set).toBe(false);
      expect(data.url).toBe(`https://letsmarknow.com/t/${data.slug}`);
      // Invariant: password_hash is NEVER leaked
      expect(data.password_hash).toBeUndefined();
      expect(data.passwordHash).toBeUndefined();

      publicShareId = data.id;
      publicSlug = data.slug;
    });

    it("gets share by ID via management API", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/v1/shares/${publicShareId}`,
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.id).toBe(publicShareId);
      expect(res.json().data.slug).toBe(publicSlug);
    });

    it("lists shares filtered by collection_id", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/v1/shares?collection_id=${collectionId}`,
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data).toBeInstanceOf(Array);
      expect(res.json().data.length).toBeGreaterThanOrEqual(1);
      expect(res.json().data[0].target_id).toBe(collectionId);
    });

    it("resolves public metadata without authentication", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/v1/public/shares/${publicSlug}`,
      });

      expect(res.statusCode).toBe(200);
      const data = res.json().data;
      expect(data.slug).toBe(publicSlug);
      expect(data.mode).toBe("public");
      expect(data.title).toBe("Top AI Reads");
      expect(data.requires_password).toBe(false);
      expect(data.owner.organization_name).toBeDefined();
    });

    it("fetches public share contents tree without authentication", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/v1/public/shares/${publicSlug}/contents`,
      });

      expect(res.statusCode).toBe(200);
      const data = res.json().data;
      expect(data.slug).toBe(publicSlug);
      expect(data.target_type).toBe("collection");
      expect(data.groups).toHaveLength(1);
      expect(data.groups[0].name).toBe("Language Models");
      expect(data.groups[0].items).toHaveLength(1);
      expect(data.groups[0].items[0].title).toBe("Anthropic Claude");
    });

    it("fetches paginated share items list", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/v1/public/shares/${publicSlug}/items?limit=10`,
      });

      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.data).toBeInstanceOf(Array);
      expect(json.data.length).toBe(1);
      expect(json.data[0].title).toBe("Anthropic Claude");
      expect(json.page.limit).toBe(10);
      expect(json.page.has_more).toBe(false);
    });

    it("tracks public share views and item clicks", async () => {
      const viewRes = await app.inject({
        method: "POST",
        url: `/v1/public/shares/${publicSlug}/views`,
        payload: { client_id: "anon-tester-1", referrer: "https://news.ycombinator.com" },
      });
      expect(viewRes.statusCode).toBe(204);

      const clickRes = await app.inject({
        method: "POST",
        url: `/v1/public/shares/${publicSlug}/items/${itemId}/clicks`,
        payload: { client_id: "anon-tester-1" },
      });
      expect(clickRes.statusCode).toBe(204);

      const analyticsRes = await app.inject({
        method: "GET",
        url: `/v1/shares/${publicShareId}/analytics`,
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      });
      expect(analyticsRes.statusCode).toBe(200);
      const aData = analyticsRes.json().data;
      expect(aData.view_count).toBeGreaterThanOrEqual(1);
      expect(aData.click_count).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Password Gating Flow", () => {
    let pwShareId = "";
    let pwSlug = "";
    let shareCookie = "";

    it("rejects password share creation if password is missing", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/v1/shares",
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
        payload: {
          target_type: "collection",
          target_id: collectionId,
          mode: "password",
        },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe("VALIDATION_FAILED");
    });

    it("creates a password-protected share with argon2id hash", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/v1/shares",
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
        payload: {
          target_type: "collection",
          target_id: collectionId,
          mode: "password",
          password: "SecretPassword123!",
        },
      });

      expect(res.statusCode).toBe(201);
      const data = res.json().data;
      expect(data.mode).toBe("password");
      expect(data.password_set).toBe(true);
      expect(data.password_hash).toBeUndefined();

      pwShareId = data.id;
      pwSlug = data.slug;
    });

    it("indicates requires_password: true in public metadata", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/v1/public/shares/${pwSlug}`,
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.requires_password).toBe(true);
    });

    it("blocks /contents access with 401 UNAUTHENTICATED without password cookie", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/v1/public/shares/${pwSlug}/contents`,
      });

      expect(res.statusCode).toBe(401);
      expect(res.json().error.code).toBe("UNAUTHENTICATED");
    });

    it("rejects unlocking with wrong password", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/v1/public/shares/${pwSlug}/unlock`,
        payload: { password: "WrongPassword" },
      });

      expect(res.statusCode).toBe(401);
      expect(res.json().error.code).toBe("UNAUTHENTICATED");
    });

    it("unlocks successfully with correct password and sets signed cookie", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/v1/public/shares/${pwSlug}/unlock`,
        payload: { password: "SecretPassword123!" },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.unlocked).toBe(true);

      const setCookieHeader = res.headers["set-cookie"];
      expect(setCookieHeader).toBeDefined();
      const cookieStr = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
      expect(cookieStr).toContain(`lmn_share_${pwSlug}`);

      // Extract the cookie value
      const match = cookieStr?.match(new RegExp(`lmn_share_${pwSlug}=([^;]+)`));
      expect(match).not.toBeNull();
      shareCookie = match![1];
    });

    it("allows /contents access with unlocked cookie", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/v1/public/shares/${pwSlug}/contents`,
        headers: {
          cookie: `lmn_share_${pwSlug}=${shareCookie}`,
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().data.slug).toBe(pwSlug);
      expect(res.json().data.groups).toHaveLength(1);
    });
  });

  describe("Slug Rotation, Revocation, and Purge", () => {
    let shareId = "";
    let originalSlug = "";
    let rotatedSlug = "";

    beforeAll(async () => {
      const res = await app.inject({
        method: "POST",
        url: "/v1/shares",
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
        payload: {
          target_type: "collection",
          target_id: collectionId,
          mode: "public",
        },
      });
      shareId = res.json().data.id;
      originalSlug = res.json().data.slug;
    });

    it("rotates slug and invalidates old slug", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/v1/shares/${shareId}/rotate-slug`,
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
        payload: {},
      });

      expect(res.statusCode).toBe(200);
      rotatedSlug = res.json().data.slug;
      expect(rotatedSlug).not.toBe(originalSlug);

      // Old slug should now 404
      const oldRes = await app.inject({
        method: "GET",
        url: `/v1/public/shares/${originalSlug}`,
      });
      expect(oldRes.statusCode).toBe(404);

      // New slug should 200
      const newRes = await app.inject({
        method: "GET",
        url: `/v1/public/shares/${rotatedSlug}`,
      });
      expect(newRes.statusCode).toBe(200);
    });

    it("revokes share and returns 410 GONE on public endpoints", async () => {
      const revokeRes = await app.inject({
        method: "POST",
        url: `/v1/shares/${shareId}/revoke`,
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      });

      expect(revokeRes.statusCode).toBe(200);
      expect(revokeRes.json().data.revoked_at).not.toBeNull();

      const viewerRes = await app.inject({
        method: "GET",
        url: `/v1/public/shares/${rotatedSlug}`,
      });

      expect(viewerRes.statusCode).toBe(410);
      expect(viewerRes.json().error.code).toBe("GONE");
    });

    it("restores revoked share and re-enables public viewer", async () => {
      const restoreRes = await app.inject({
        method: "POST",
        url: `/v1/shares/${shareId}/restore`,
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      });

      expect(restoreRes.statusCode).toBe(200);
      expect(restoreRes.json().data.revoked_at).toBeNull();

      const viewerRes = await app.inject({
        method: "GET",
        url: `/v1/public/shares/${rotatedSlug}`,
      });

      expect(viewerRes.statusCode).toBe(200);
    });

    it("purges share permanently with confirmation slug", async () => {
      // Mismatched confirm_slug
      const failPurge = await app.inject({
        method: "POST",
        url: `/v1/shares/${shareId}/purge`,
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
        payload: { confirm_slug: "wrong-slug" },
      });
      expect(failPurge.statusCode).toBe(400);

      // Correct confirm_slug
      const purgeRes = await app.inject({
        method: "POST",
        url: `/v1/shares/${shareId}/purge`,
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
        payload: { confirm_slug: rotatedSlug },
      });
      expect(purgeRes.statusCode).toBe(200);
      expect(purgeRes.json().data.slug_at_purge).toBe(rotatedSlug);

      // Now public hits return 404 NOT_FOUND (record is destroyed)
      const afterPurge = await app.inject({
        method: "GET",
        url: `/v1/public/shares/${rotatedSlug}`,
      });
      expect(afterPurge.statusCode).toBe(404);
    });
  });

  describe("Future Stubs (v2 multi-link & Phase 2 comments)", () => {
    it("returns 403 FEATURE_NOT_AVAILABLE for multi-link link revoke", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/v1/shares/links/dummy-link-id/revoke",
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
      });

      expect(res.statusCode).toBe(403);
      expect(res.json().error.code).toBe("FEATURE_NOT_AVAILABLE");
    });

    it("returns 403 FEATURE_NOT_AVAILABLE for public comments", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/v1/public/shares/some-slug/comments",
        payload: { body: "Nice collection!" },
      });

      expect(res.statusCode).toBe(403);
      expect(res.json().error.code).toBe("FEATURE_NOT_AVAILABLE");
    });
    it("publishes collection and items in 1-step from extension via /shares/publish", async () => {
      const pubSlug = `pub-ext-${Date.now()}`;
      const pubRes = await app.inject({
        method: "POST",
        url: "/v1/shares/publish",
        headers: { authorization: `Bearer ${token}`, "x-organization-id": orgId },
        payload: {
          name: "Published From Extension",
          description: "Bookmarks direct from Chrome",
          slug: pubSlug,
          mode: "public",
          groups: [
            {
              name: "Tools",
              items: [
                {
                  title: "GitHub",
                  url: "https://github.com",
                  description: "Code collaboration",
                },
              ],
            },
          ],
        },
      });

      expect(pubRes.statusCode).toBe(201);
      const data = pubRes.json().data;
      expect(data.slug).toBe(pubSlug);
      expect(data.target_type).toBe("collection");

      // Verify unauthenticated public viewer can immediately access published contents
      const viewerRes = await app.inject({
        method: "GET",
        url: `/v1/public/shares/${pubSlug}/contents`,
      });

      expect(viewerRes.statusCode).toBe(200);
      const contents = viewerRes.json().data;
      expect(contents.target.name).toBe("Published From Extension");
      expect(contents.groups.length).toBe(1);
      expect(contents.groups[0].items[0].title).toBe("GitHub");
      expect(contents.groups[0].items[0].url).toBe("https://github.com");
    });
  });
});
