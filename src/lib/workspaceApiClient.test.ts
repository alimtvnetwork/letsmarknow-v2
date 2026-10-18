import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  fetchBackendSpaces,
  createBackendSpace,
  updateBackendSpace,
  deleteBackendSpace,
  fetchBackendCollections,
  createBackendCollection,
  updateBackendCollection,
  moveBackendCollection,
  deleteBackendCollection,
  fetchBackendGroups,
  createBackendGroup,
  updateBackendGroup,
  deleteBackendGroup,
  createBackendItem,
  fetchBackendTags,
  executeBulkItems,
  searchGlobal,
  searchQuick,
  fetchRecentSearches,
  fetchBackendShares,
  createBackendShare,
  updateBackendShare,
  revokeBackendShare,
  restoreBackendShare,
  purgeBackendShare,
  fetchPublicShareMetadata,
  unlockPublicShare,
  fetchPublicShareContents,
  fetchBackendHistory,
  fetchBackendHistoryEvent,
  undoBackendHistoryEvent,
  redoBackendHistoryEvent,
  fetchBackendTrash,
  restoreBackendTrash,
  purgeBackendTrash,
  emptyBackendTrash,
  fetchBackendMindmapLayouts,
  fetchBackendMindmapLayout,
  createBackendMindmapLayout,
  updateBackendMindmapLayout,
  deleteBackendMindmapLayout,
  fetchBackendAccount,
  updateBackendAccount,
  fetchBackendAccountPreferences,
  updateBackendAccountPreferences,
  changeBackendPassword,
  fetchBackendSessions,
  revokeBackendSession,
  signoutAllBackendSessions,
  triggerBackendGdprExport,
  fetchBackendJob,
  listBackendJobs,
  cancelBackendJob,
  triggerBackendLinkHealth,
  fetchBackendLinkHealthStats,
  triggerBackendFaviconFetch,
  fetchBackendFlags,
  evaluateBackendFlags,
  fetchAccountEntitlements,
  fetchOrgBillingSummary,
  createCheckoutSession,
  openBillingPortal,
  changeOrgPlan,
  cancelOrgSubscription,
  redeemLifetimeLicense,
  stackLifetimeLicense,
  fetchInvoicePdfMetadata,
} from "./workspaceApiClient";
import { api } from "./apiClient";

describe("workspaceApiClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetchBackendSpaces calls api.get /spaces", async () => {
    vi.spyOn(api, "get").mockResolvedValueOnce({
      data: [{ id: "space-1", name: "Engineering" }],
    });

    const spaces = await fetchBackendSpaces();
    expect(spaces).toHaveLength(1);
    expect(api.get).toHaveBeenCalledWith("/spaces");
  });

  it("createBackendSpace calls api.post /spaces", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({
      data: { id: "space-2", name: "Design" },
    });

    const space = await createBackendSpace({ name: "Design", color: "#3b82f6" });
    expect(space.name).toBe("Design");
    expect(api.post).toHaveBeenCalledWith("/spaces", { name: "Design", color: "#3b82f6" });
  });

  it("createBackendCollection calls api.post /collections", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({
      data: { id: "col-1", name: "Inspiration", space_id: "space-1" },
    });

    const col = await createBackendCollection({
      spaceId: "space-1",
      name: "Inspiration",
      color: "pink",
    });

    expect(col.name).toBe("Inspiration");
    expect(api.post).toHaveBeenCalledWith("/collections", {
      space_id: "space-1",
      name: "Inspiration",
      description: undefined,
      color: "pink",
      view_mode: undefined,
    });
  });

  it("moveBackendCollection calls api.post /collections/:id/move", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({
      data: { id: "col-1", space_id: "space-2" },
    });

    const col = await moveBackendCollection("col-1", "space-2");
    expect(col.space_id).toBe("space-2");
    expect(api.post).toHaveBeenCalledWith("/collections/col-1/move", {
      to_space_id: "space-2",
    });
  });

  it("createBackendGroup calls api.post /groups", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({
      data: { id: "grp-1", name: "Frontend", collection_id: "col-1" },
    });

    const grp = await createBackendGroup({
      collectionId: "col-1",
      name: "Frontend",
    });

    expect(grp.name).toBe("Frontend");
    expect(api.post).toHaveBeenCalledWith("/groups", {
      collection_id: "col-1",
      name: "Frontend",
      color: undefined,
    });
  });

  it("deleteBackendGroup calls api.delete /groups/:id", async () => {
    vi.spyOn(api, "delete").mockResolvedValueOnce({});
    await deleteBackendGroup("grp-1");
    expect(api.delete).toHaveBeenCalledWith("/groups/grp-1");
  });

  it("fetchBackendItems and createBackendItem call correct item endpoints", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({
      data: { id: "item-1", url: "https://vitejs.dev", title: "Vite" },
    });

    const item = await createBackendItem({
      collectionId: "col-1",
      url: "https://vitejs.dev",
      title: "Vite",
    });

    expect(item.title).toBe("Vite");
    expect(api.post).toHaveBeenCalledWith("/items", {
      collection_id: "col-1",
      group_id: undefined,
      url: "https://vitejs.dev",
      title: "Vite",
      description: undefined,
      color: undefined,
      source: undefined,
    });
  });

  it("fetchBackendTags calls api.get /tags with query params", async () => {
    vi.spyOn(api, "get").mockResolvedValueOnce({
      data: [{ id: "tag-1", name: "typescript" }],
    });

    const tags = await fetchBackendTags({ q: "type" });
    expect(tags).toHaveLength(1);
    expect(api.get).toHaveBeenCalledWith("/tags?q=type");
  });

  it("executeBulkItems sends multi-action payload to /bulk/items", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({
      data: {
        results: [
          { index: 0, status: 200, data: { id: "item-1" } },
          { index: 1, status: 200, data: { id: "item-2" } },
        ],
      },
    });

    const res = await executeBulkItems([
      { op: "star", id: "item-1", data: { is_starred: true } },
      { op: "delete", id: "item-2" },
    ]);

    expect(res.results).toHaveLength(2);
    expect(api.post).toHaveBeenCalledWith("/bulk/items", {
      all_or_nothing: false,
      operations: [
        { op: "star", id: "item-1", data: { is_starred: true } },
        { op: "delete", id: "item-2" },
      ],
    });
  });

  it("searchQuick calls api.get /search/quick with query params", async () => {
    vi.spyOn(api, "get").mockResolvedValueOnce({
      data: [{ id: "item-1", title: "Vite", url: "https://vitejs.dev", score: 0.9 }],
    });

    const results = await searchQuick("vite", 5);
    expect(results).toHaveLength(1);
    expect(api.get).toHaveBeenCalledWith("/search/quick?q=vite&limit=5");
  });

  it("fetchRecentSearches calls api.get /search/recent", async () => {
    vi.spyOn(api, "get").mockResolvedValueOnce({
      data: [{ q: "react", last_used_at: "2026-04-18T12:00:00Z", results_count: 5 }],
    });

    const recents = await fetchRecentSearches();
    expect(recents).toHaveLength(1);
    expect(recents[0].q).toBe("react");
    expect(api.get).toHaveBeenCalledWith("/search/recent");
  });

  it("createBackendShare calls api.post /shares", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({
      data: { id: "share-1", slug: "my-col-1234", mode: "public" },
    });

    const res = await createBackendShare({
      target_type: "collection",
      target_id: "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
      mode: "public",
    });

    expect(res.slug).toBe("my-col-1234");
    expect(api.post).toHaveBeenCalledWith("/shares", {
      target_type: "collection",
      target_id: "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
      mode: "public",
    });
  });

  it("fetchBackendShares calls api.get /shares with target query params", async () => {
    vi.spyOn(api, "get").mockResolvedValueOnce({
      data: [{ id: "share-1", slug: "my-col-1234" }],
    });

    const res = await fetchBackendShares({ collection_id: "col-123" });
    expect(res).toHaveLength(1);
    expect(api.get).toHaveBeenCalledWith("/shares?collection_id=col-123");
  });

  it("revokeBackendShare calls api.post /shares/:id/revoke", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({
      data: { id: "share-1", revoked_at: "2026-04-20T08:00:00Z" },
    });

    const res = await revokeBackendShare("share-1");
    expect(res.revoked_at).toBeDefined();
    expect(api.post).toHaveBeenCalledWith("/shares/share-1/revoke");
  });

  it("unlockPublicShare calls api.post /public/shares/:slug/unlock with password", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({
      data: { unlocked: true, expires_in: 86400 },
    });

    const res = await unlockPublicShare("my-col-1234", "secretPass");
    expect(res.unlocked).toBe(true);
    expect(api.post).toHaveBeenCalledWith("/public/shares/my-col-1234/unlock", {
      password: "secretPass",
    });
  });

  it("fetchPublicShareContents calls api.get /public/shares/:slug/contents", async () => {
    vi.spyOn(api, "get").mockResolvedValueOnce({
      data: {
        slug: "my-col-1234",
        target_type: "collection",
        target: { id: "col-1", name: "AI Reads" },
        groups: [],
        items: [],
      },
    });

    const res = await fetchPublicShareContents("my-col-1234");
    expect(res.slug).toBe("my-col-1234");
    expect(api.get).toHaveBeenCalledWith("/public/shares/my-col-1234/contents");
  });

  it("fetchBackendHistory calls api.get /history with query params", async () => {
    vi.spyOn(api, "get").mockResolvedValueOnce({
      data: [{ id: "evt-1", event_type: "item.created" }],
    });

    const res = await fetchBackendHistory({ entity_type: "item", limit: 20 });
    expect(res).toHaveLength(1);
    expect(api.get).toHaveBeenCalledWith("/history?entity_type=item&limit=20");
  });

  it("fetchBackendHistoryEvent calls api.get /history/:id", async () => {
    vi.spyOn(api, "get").mockResolvedValueOnce({
      data: { id: "evt-1", event_type: "item.created" },
    });

    const res = await fetchBackendHistoryEvent("evt-1");
    expect(res.id).toBe("evt-1");
    expect(api.get).toHaveBeenCalledWith("/history/evt-1");
  });

  it("undoBackendHistoryEvent calls api.post /history/:id/undo", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({
      data: { undone_event_id: "evt-1", undone_at: "2026-04-20T08:00:00Z", entities_affected: 1, batch_id: null },
    });

    const res = await undoBackendHistoryEvent("evt-1", true);
    expect(res.undone_event_id).toBe("evt-1");
    expect(api.post).toHaveBeenCalledWith("/history/evt-1/undo", { undo_entire_batch: true });
  });

  it("redoBackendHistoryEvent calls api.post /history/:id/redo", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({
      data: { redone_event_id: "evt-1", redone_at: "2026-04-20T08:05:00Z", entities_affected: 1, batch_id: null },
    });

    const res = await redoBackendHistoryEvent("evt-1");
    expect(res.redone_event_id).toBe("evt-1");
    expect(api.post).toHaveBeenCalledWith("/history/evt-1/redo");
  });

  it("fetchBackendTrash calls api.get /trash", async () => {
    vi.spyOn(api, "get").mockResolvedValueOnce({
      data: [{ id: "item-del", entity_type: "item", title: "Deleted Item" }],
    });

    const res = await fetchBackendTrash({ entity_type: "item" });
    expect(res).toHaveLength(1);
    expect(api.get).toHaveBeenCalledWith("/trash?entity_type=item");
  });

  it("restoreBackendTrash calls api.post /trash/restore", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({
      data: { restored_count: 2, restored_ids: ["id-1", "id-2"] },
    });

    const res = await restoreBackendTrash(["id-1", "id-2"]);
    expect(res.restored_count).toBe(2);
    expect(api.post).toHaveBeenCalledWith("/trash/restore", { entity_ids: ["id-1", "id-2"] });
  });

  it("purgeBackendTrash calls api.post /trash/purge", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({
      data: { purged_count: 1, purged_ids: ["id-1"] },
    });

    const res = await purgeBackendTrash(["id-1"]);
    expect(res.purged_count).toBe(1);
    expect(api.post).toHaveBeenCalledWith("/trash/purge", { entity_ids: ["id-1"] });
  });

  it("emptyBackendTrash calls api.post /trash/empty", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({
      data: { emptied_count: 5 },
    });

    const res = await emptyBackendTrash();
    expect(res.emptied_count).toBe(5);
    expect(api.post).toHaveBeenCalledWith("/trash/empty");
  });

  it("fetchBackendMindmapLayouts calls api.get /mindmap-layouts with query params", async () => {
    vi.spyOn(api, "get").mockResolvedValueOnce({
      data: [{ id: "lay-1", name: "Q1 Priorities", scope_type: "collection", scope_id: "col-123", is_default: true, node_count: 5 }],
    });

    const res = await fetchBackendMindmapLayouts({
      scope_type: "collection",
      scope_id: "col-123",
      include_shared: true,
    });
    expect(res).toHaveLength(1);
    expect(res[0].name).toBe("Q1 Priorities");
    expect(api.get).toHaveBeenCalledWith("/mindmap-layouts?scope_type=collection&scope_id=col-123&include_shared=true");
  });

  it("fetchBackendMindmapLayout calls api.get /mindmap-layouts/:id", async () => {
    vi.spyOn(api, "get").mockResolvedValueOnce({
      data: { id: "lay-1", name: "Q1 Priorities", nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
    });

    const res = await fetchBackendMindmapLayout("lay-1");
    expect(res.id).toBe("lay-1");
    expect(api.get).toHaveBeenCalledWith("/mindmap-layouts/lay-1");
  });

  it("createBackendMindmapLayout calls api.post /mindmap-layouts", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({
      data: { id: "lay-2", name: "Roadmap Canvas", scope_type: "collection", scope_id: "col-123" },
    });

    const res = await createBackendMindmapLayout({
      name: "Roadmap Canvas",
      scope_type: "collection",
      scope_id: "col-123",
      is_default: true,
    });
    expect(res.id).toBe("lay-2");
    expect(api.post).toHaveBeenCalledWith("/mindmap-layouts", {
      name: "Roadmap Canvas",
      scope_type: "collection",
      scope_id: "col-123",
      is_default: true,
    });
  });

  it("updateBackendMindmapLayout calls api.patch /mindmap-layouts/:id", async () => {
    vi.spyOn(api, "patch").mockResolvedValueOnce({
      data: { id: "lay-2", name: "Roadmap Canvas Updated" },
    });

    const res = await updateBackendMindmapLayout("lay-2", {
      name: "Roadmap Canvas Updated",
    });
    expect(res.name).toBe("Roadmap Canvas Updated");
    expect(api.patch).toHaveBeenCalledWith("/mindmap-layouts/lay-2", {
      name: "Roadmap Canvas Updated",
    });
  });

  it("deleteBackendMindmapLayout calls api.delete /mindmap-layouts/:id", async () => {
    vi.spyOn(api, "delete").mockResolvedValueOnce({
      data: { id: "lay-2", deleted_at: "2026-04-20T08:00:00Z", was_default: true, new_default_id: "lay-1" },
    });

    const res = await deleteBackendMindmapLayout("lay-2");
    expect(res.was_default).toBe(true);
    expect(res.new_default_id).toBe("lay-1");
    expect(api.delete).toHaveBeenCalledWith("/mindmap-layouts/lay-2");
  });

  it("fetchBackendAccount calls api.get /account", async () => {
    vi.spyOn(api, "get").mockResolvedValueOnce({
      data: { id: "acc-1", email: "user@example.com", name: "User" },
    });

    const res = await fetchBackendAccount();
    expect(res.id).toBe("acc-1");
    expect(api.get).toHaveBeenCalledWith("/account");
  });

  it("updateBackendAccount calls api.patch /account", async () => {
    vi.spyOn(api, "patch").mockResolvedValueOnce({
      data: { id: "acc-1", name: "User Updated" },
    });

    const res = await updateBackendAccount({ name: "User Updated" });
    expect(res.name).toBe("User Updated");
    expect(api.patch).toHaveBeenCalledWith("/account", { name: "User Updated" });
  });

  it("fetchBackendAccountPreferences calls api.get /account/preferences", async () => {
    vi.spyOn(api, "get").mockResolvedValueOnce({
      data: { preferences: { theme: "dark" }, updated_at: "2026-04-20T08:00:00Z" },
    });

    const res = await fetchBackendAccountPreferences();
    expect(res.preferences.theme).toBe("dark");
    expect(api.get).toHaveBeenCalledWith("/account/preferences");
  });

  it("updateBackendAccountPreferences calls api.patch /account/preferences with If-Match", async () => {
    vi.spyOn(api, "patch").mockResolvedValueOnce({
      data: { preferences: { theme: "light" }, updated_at: "2026-04-20T08:05:00Z" },
    });

    const res = await updateBackendAccountPreferences({ theme: "light" }, "2026-04-20T08:00:00Z");
    expect(res.preferences.theme).toBe("light");
    expect(api.patch).toHaveBeenCalledWith(
      "/account/preferences",
      { theme: "light" },
      { headers: { "If-Match": "2026-04-20T08:00:00Z" } }
    );
  });

  it("changeBackendPassword calls api.post /auth/password/change", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({});

    await changeBackendPassword({
      current_password: "oldPass",
      new_password: "newPass123!",
    });
    expect(api.post).toHaveBeenCalledWith("/auth/password/change", {
      current_password: "oldPass",
      new_password: "newPass123!",
    });
  });

  it("fetchBackendSessions calls api.get /auth/sessions", async () => {
    vi.spyOn(api, "get").mockResolvedValueOnce({
      data: [{ id: "sess-1", client: "web", current: true }],
    });

    const res = await fetchBackendSessions();
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe("sess-1");
    expect(api.get).toHaveBeenCalledWith("/auth/sessions");
  });

  it("revokeBackendSession calls api.delete /auth/sessions/:id", async () => {
    vi.spyOn(api, "delete").mockResolvedValueOnce({});

    await revokeBackendSession("sess-2");
    expect(api.delete).toHaveBeenCalledWith("/auth/sessions/sess-2");
  });

  it("signoutAllBackendSessions calls api.post /auth/signout-all", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({});

    await signoutAllBackendSessions();
    expect(api.post).toHaveBeenCalledWith("/auth/signout-all");
  });

  it("triggerBackendGdprExport calls api.post /me/gdpr-export", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({
      data: { request_id: "req-123", eta_hours: 24 },
    });

    const res = await triggerBackendGdprExport({ destination_email: "gdpr@example.com" });
    expect(res.request_id).toBe("req-123");
    expect(api.post).toHaveBeenCalledWith("/me/gdpr-export", { destination_email: "gdpr@example.com" });
  });

  it("fetchBackendJob calls api.get /jobs/:job_id", async () => {
    vi.spyOn(api, "get").mockResolvedValueOnce({
      data: { job_id: "job-101", kind: "link_health", status: "running" },
    });

    const res = await fetchBackendJob("job-101");
    expect(res.job_id).toBe("job-101");
    expect(res.kind).toBe("link_health");
    expect(api.get).toHaveBeenCalledWith("/jobs/job-101");
  });

  it("listBackendJobs calls api.get /jobs with filter params", async () => {
    vi.spyOn(api, "get").mockResolvedValueOnce({
      data: [{ job_id: "job-101", kind: "link_health", status: "succeeded" }],
    });

    const res = await listBackendJobs({ kind: "link_health", status: "succeeded", limit: 10 });
    expect(res).toHaveLength(1);
    expect(api.get).toHaveBeenCalledWith("/jobs", {
      params: { kind: "link_health", status: "succeeded", limit: "10" },
    });
  });

  it("cancelBackendJob calls api.post /jobs/:job_id/cancel", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({
      data: { job_id: "job-101", status: "canceled" },
    });

    const res = await cancelBackendJob("job-101");
    expect(res.job_id).toBe("job-101");
    expect(res.status).toBe("canceled");
    expect(api.post).toHaveBeenCalledWith("/jobs/job-101/cancel");
  });

  it("triggerBackendLinkHealth calls api.post /jobs/link-health", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({
      data: {
        job_id: "job-202",
        status: "succeeded",
        progress: { processed: 5, total: 5, percent: 100 },
        result_summary: { ok_count: 4, broken_count: 1 },
      },
    });

    const res = await triggerBackendLinkHealth({ space_id: "space-1" });
    expect(res.job_id).toBe("job-202");
    expect(res.result_summary?.ok_count).toBe(4);
    expect(api.post).toHaveBeenCalledWith("/jobs/link-health", { space_id: "space-1" });
  });

  it("fetchBackendLinkHealthStats calls api.get /jobs/link-health/stats", async () => {
    vi.spyOn(api, "get").mockResolvedValueOnce({
      data: {
        total_items: 20,
        healthy: 18,
        broken: 2,
        redirects: 0,
        timeouts: 0,
        last_checked_at: "2026-04-20T08:30:00Z",
      },
    });

    const res = await fetchBackendLinkHealthStats();
    expect(res.total_items).toBe(20);
    expect(res.healthy).toBe(18);
    expect(res.broken).toBe(2);
    expect(api.get).toHaveBeenCalledWith("/jobs/link-health/stats");
  });

  it("triggerBackendFaviconFetch calls api.post /jobs/favicon-fetch", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({
      data: {
        job_id: "job-303",
        status: "succeeded",
        progress: { processed: 10, total: 10, percent: 100 },
        result_summary: { favicons_resolved: 10 },
      },
    });

    const res = await triggerBackendFaviconFetch({ force_refresh: true });
    expect(res.job_id).toBe("job-303");
    expect(res.result_summary?.favicons_resolved).toBe(10);
    expect(api.post).toHaveBeenCalledWith("/jobs/favicon-fetch", { force_refresh: true });
  });

  it("fetchBackendFlags calls api.get /flags", async () => {
    vi.spyOn(api, "get").mockResolvedValueOnce({
      data: {
        evaluated_at: "2026-04-20T08:30:00Z",
        ttl_seconds: 60,
        flags: { mindmap_v2: { variant: "on", reason: "rollout_pct" } },
        exposure_logged: true,
      },
    });

    const res = await fetchBackendFlags();
    expect(res.flags.mindmap_v2.variant).toBe("on");
    expect(api.get).toHaveBeenCalledWith("/flags");
  });

  it("evaluateBackendFlags calls api.post /flags/evaluate", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({
      data: {
        evaluated_at: "2026-04-20T08:30:00Z",
        ttl_seconds: 60,
        flags: { ai_assist: { variant: "off", reason: "not_in_targeting" } },
        exposure_logged: true,
      },
    });

    const res = await evaluateBackendFlags(["ai_assist"]);
    expect(res.flags.ai_assist.variant).toBe("off");
    expect(api.post).toHaveBeenCalledWith("/flags/evaluate", {
      flags: ["ai_assist"],
      context: undefined,
    });
  });

  it("fetchAccountEntitlements calls api.get /me/entitlements", async () => {
    vi.spyOn(api, "get").mockResolvedValueOnce({
      data: {
        account_id: "acc-1",
        entitlements_hash: "sha256:abc",
        by_organization: [],
      },
    });

    const res = await fetchAccountEntitlements();
    expect(res.account_id).toBe("acc-1");
    expect(api.get).toHaveBeenCalledWith("/me/entitlements");
  });

  it("fetchOrgBillingSummary calls api.get /organizations/:id/billing", async () => {
    vi.spyOn(api, "get").mockResolvedValueOnce({
      data: { plan: "pro", status: "active", seats: 1 },
    });

    const res = await fetchOrgBillingSummary("org-1");
    expect(res.plan).toBe("pro");
    expect(api.get).toHaveBeenCalledWith("/organizations/org-1/billing");
  });

  it("createCheckoutSession calls api.post /organizations/:id/billing/checkout", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({
      data: { checkout_url: "https://checkout.stripe.com/c/pay/cs_123", session_id: "cs_123" },
    });

    const res = await createCheckoutSession("org-1", {
      plan: "pro",
      success_url: "https://app.letsmarknow.com/success",
      cancel_url: "https://app.letsmarknow.com/cancel",
    });
    expect(res.session_id).toBe("cs_123");
    expect(api.post).toHaveBeenCalledWith("/organizations/org-1/billing/checkout", {
      plan: "pro",
      success_url: "https://app.letsmarknow.com/success",
      cancel_url: "https://app.letsmarknow.com/cancel",
    });
  });

  it("redeemLifetimeLicense calls api.post /organizations/:id/billing/lifetime/redeem", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({
      data: { plan: "pro", status: "lifetime", lifetime_license: { code_masked: "LMNL-****-****-WXYZ" } },
    });

    const res = await redeemLifetimeLicense("org-1", "LMNL-ABCD-1234-WXYZ");
    expect(res.status).toBe("lifetime");
    expect(res.lifetime_license.code_masked).toBe("LMNL-****-****-WXYZ");
    expect(api.post).toHaveBeenCalledWith("/organizations/org-1/billing/lifetime/redeem", {
      code: "LMNL-ABCD-1234-WXYZ",
    });
  });

  it("fetchInvoicePdfMetadata calls api.get /billing/invoices/:id/pdf with json header", async () => {
    vi.spyOn(api, "get").mockResolvedValueOnce({
      data: { invoice_id: "inv_1", pdf_url: "https://files.stripe.com/inv.pdf" },
    });

    const res = await fetchInvoicePdfMetadata("inv_1");
    expect(res.invoice_id).toBe("inv_1");
    expect(api.get).toHaveBeenCalledWith("/billing/invoices/inv_1/pdf", {
      headers: { Accept: "application/json" },
    });
  });
});

