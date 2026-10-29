import { api } from "./apiClient";

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  avatar_token: string;
  avatar_color: string;
  avatar_image_url: string | null;
  theme: string;
  my_role: "owner" | "admin" | "editor" | "viewer" | "billing" | "guest" | "system";
  subscription_plan: string;
  is_default: boolean;
  last_active_at: string;
}

export interface OrgMemberSummary {
  id: string;
  organization_id: string;
  account_id: string | null;
  email: string;
  name: string;
  avatar_url: string | null;
  role: "owner" | "admin" | "editor" | "viewer" | "billing" | "guest" | "system";
  status: "active" | "pending";
  invited_by?: string | null;
  joined_at?: string | null;
  last_active_at?: string;
}

interface Envelope<T> {
  data: T;
}

export async function fetchMyOrganizations(): Promise<OrganizationSummary[]> {
  const res = await api.get<Envelope<OrganizationSummary[]>>("/organizations");
  return res.data;
}

export async function createOrganization(params: {
  name: string;
  theme?: string;
  brand_color?: string;
}): Promise<OrganizationSummary> {
  const res = await api.post<Envelope<OrganizationSummary>>("/organizations", params);
  return res.data;
}

export async function fetchOrgMembers(): Promise<OrgMemberSummary[]> {
  const res = await api.get<Envelope<OrgMemberSummary[]>>("/members");
  return res.data;
}

export async function inviteOrgMembers(
  invites: Array<{ email: string; role: "admin" | "editor" | "viewer" | "billing"; message?: string }>
): Promise<{ results: Array<{ index: number; status: number; member_id?: string; invite_token?: string }> }> {
  const res = await api.post<Envelope<{ results: Array<{ index: number; status: number; member_id?: string; invite_token?: string }> }>>(
    "/members/invites",
    { invites }
  );
  return res.data;
}

export async function removeOrgMember(memberId: string): Promise<void> {
  await api.delete(`/members/${memberId}`);
}

export async function changeOrgMemberRole(
  memberId: string,
  role: "admin" | "editor" | "viewer" | "billing"
): Promise<void> {
  await api.patch(`/members/${memberId}`, { role });
}

export async function acceptOrgInvite(token: string): Promise<{
  organization_id: string;
  member_id: string;
  role: string;
  requires_signup: boolean;
  access_token: string | null;
}> {
  const res = await api.post<Envelope<{
    organization_id: string;
    member_id: string;
    role: string;
    requires_signup: boolean;
    access_token: string | null;
  }>>("/members/invites/accept", { token });
  return res.data;
}
