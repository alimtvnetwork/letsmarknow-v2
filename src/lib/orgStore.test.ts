import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  fetchMyOrganizations,
  createOrganization,
  fetchOrgMembers,
  inviteOrgMembers,
  removeOrgMember,
  changeOrgMemberRole,
  acceptOrgInvite,
} from "./orgStore";
import { api } from "./apiClient";

describe("orgStore", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetchMyOrganizations calls api.get /organizations", async () => {
    const mockOrgs = [
      {
        id: "org-1",
        name: "Personal",
        slug: "personal",
        avatar_token: "PE",
        avatar_color: "#e94560",
        avatar_image_url: null,
        theme: "pink",
        my_role: "owner" as const,
        subscription_plan: "pro",
        is_default: true,
        last_active_at: new Date().toISOString(),
      },
    ];

    vi.spyOn(api, "get").mockResolvedValueOnce({ data: mockOrgs });
    const result = await fetchMyOrganizations();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Personal");
    expect(api.get).toHaveBeenCalledWith("/organizations");
  });

  it("createOrganization calls api.post /organizations", async () => {
    const mockOrg = {
      id: "org-2",
      name: "Engineering",
      slug: "engineering",
      avatar_token: "EN",
      avatar_color: "#3b82f6",
      avatar_image_url: null,
      theme: "indigo",
      my_role: "owner" as const,
      subscription_plan: "free",
      is_default: false,
      last_active_at: new Date().toISOString(),
    };

    vi.spyOn(api, "post").mockResolvedValueOnce({ data: mockOrg });
    const result = await createOrganization({ name: "Engineering" });
    expect(result.id).toBe("org-2");
    expect(api.post).toHaveBeenCalledWith("/organizations", { name: "Engineering" });
  });

  it("fetchOrgMembers calls api.get /members", async () => {
    const mockMembers = [
      {
        id: "mem-1",
        organization_id: "org-1",
        account_id: "acc-1",
        email: "alice@example.com",
        name: "Alice",
        avatar_url: null,
        role: "owner" as const,
        status: "active" as const,
      },
    ];

    vi.spyOn(api, "get").mockResolvedValueOnce({ data: mockMembers });
    const result = await fetchOrgMembers();
    expect(result).toHaveLength(1);
    expect(api.get).toHaveBeenCalledWith("/members");
  });

  it("inviteOrgMembers calls api.post /members/invites", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({
      data: {
        results: [{ index: 0, status: 201, member_id: "inv-1", invite_token: "lmn-iv-test" }],
      },
    });

    const result = await inviteOrgMembers([{ email: "bob@example.com", role: "editor" }]);
    expect(result.results[0].status).toBe(201);
  });

  it("removeOrgMember calls api.delete", async () => {
    vi.spyOn(api, "delete").mockResolvedValueOnce({});
    await removeOrgMember("mem-2");
    expect(api.delete).toHaveBeenCalledWith("/members/mem-2");
  });

  it("acceptOrgInvite calls api.post /members/invites/accept", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({
      data: {
        organization_id: "org-1",
        member_id: "mem-new",
        role: "editor",
        requires_signup: false,
        access_token: "jwt-token",
      },
    });

    const result = await acceptOrgInvite("token-123");
    expect(result.organization_id).toBe("org-1");
    expect(api.post).toHaveBeenCalledWith("/members/invites/accept", { token: "token-123" });
  });
});
