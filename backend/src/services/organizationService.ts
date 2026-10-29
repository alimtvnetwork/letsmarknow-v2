import { eq, and, isNull } from "drizzle-orm";
import { AppError } from "../errors/AppError.js";
import { getDb, checkDbConnection } from "../db/client.js";
import * as schema from "../db/schema/index.js";
import { uuidv7 } from "../db/utils/uuidv7.js";
import { memRepo, type MemOrg } from "../db/memRepo.js";
import type { OrgRole } from "../types/fastify.js";

export interface CreateOrgInput {
  name: string;
  theme?: string;
  brandColor?: string;
  avatarImageUrl?: string;
}

export interface UpdateOrgInput {
  name?: string;
  theme?: string;
  brandColor?: string;
  avatarImageUrl?: string;
  description?: string;
  defaultSpaceId?: string;
}

export class OrganizationService {
  public async listMyOrganizations(accountId: string) {
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      const rows = await db
        .select({
          memberId: schema.orgMembers.id,
          role: schema.orgMembers.role,
          orgId: schema.organizations.id,
          name: schema.organizations.name,
          slug: schema.organizations.slug,
          logoUrl: schema.organizations.logoUrl,
          brandColor: schema.organizations.brandColor,
          plan: schema.organizations.plan,
          ownerAccountId: schema.organizations.ownerAccountId,
          updatedAt: schema.organizations.updatedAt,
        })
        .from(schema.orgMembers)
        .innerJoin(
          schema.organizations,
          eq(schema.orgMembers.organizationId, schema.organizations.id)
        )
        .where(
          and(
            eq(schema.orgMembers.accountId, accountId),
            eq(schema.orgMembers.status, "active"),
            isNull(schema.organizations.deletedAt)
          )
        );

      return rows.map((r, index) => ({
        id: r.orgId,
        name: r.name,
        slug: r.slug,
        avatar_token: r.name.slice(0, 2).toUpperCase(),
        avatar_color: r.brandColor || "#6366f1",
        avatar_image_url: r.logoUrl || null,
        theme: "pink",
        my_role: r.role,
        subscription_plan: r.plan || "free",
        is_default: index === 0,
        last_active_at: r.updatedAt.toISOString(),
      }));
    } else {
      const activeMemberships = memRepo.members.filter(
        (m) => m.accountId === accountId && m.status === "active"
      );

      const result = [];
      for (let i = 0; i < activeMemberships.length; i++) {
        const m = activeMemberships[i];
        const org = memRepo.organizations.get(m.organizationId);
        if (org && !org.deletedAt) {
          result.push({
            id: org.id,
            name: org.name,
            slug: org.slug,
            avatar_token: org.name.slice(0, 2).toUpperCase(),
            avatar_color: org.brandColor || "#6366f1",
            avatar_image_url: org.avatarImageUrl || null,
            theme: org.theme || "pink",
            my_role: m.role,
            subscription_plan: org.plan || "free",
            is_default: i === 0,
            last_active_at: org.updatedAt.toISOString(),
          });
        }
      }
      return result;
    }
  }

  public async createOrganization(accountId: string, input: CreateOrgInput) {
    const isDb = await checkDbConnection();
    const cleanName = input.name.trim();
    if (!cleanName) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "Organization name is required.",
      });
    }

    const orgId = uuidv7();
    const spaceId = uuidv7();
    const slugBase = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    const randomSuffix = orgId.replace(/-/g, "").slice(-8);
    const slug = `${slugBase || "org"}-${randomSuffix}`;
    const now = new Date();

    if (isDb) {
      const db = getDb();
      await db.insert(schema.organizations).values({
        id: orgId,
        name: cleanName,
        slug,
        logoUrl: input.avatarImageUrl,
        brandColor: input.brandColor,
        ownerAccountId: accountId,
        defaultSpaceId: spaceId,
      });

      await db.insert(schema.orgMembers).values({
        id: uuidv7(),
        organizationId: orgId,
        accountId,
        role: "owner",
        status: "active",
      });

      await db.insert(schema.spaces).values({
        id: spaceId,
        organizationId: orgId,
        name: "My Collections",
        slug: "my-collections",
        position: 0,
        createdBy: accountId,
      });
    } else {
      memRepo.organizations.set(orgId, {
        id: orgId,
        name: cleanName,
        slug,
        ownerAccountId: accountId,
        avatarImageUrl: input.avatarImageUrl,
        brandColor: input.brandColor,
        theme: input.theme || "pink",
        defaultSpaceId: spaceId,
        plan: "free",
        createdAt: now,
        updatedAt: now,
      });

      memRepo.members.push({
        id: uuidv7(),
        organizationId: orgId,
        accountId,
        role: "owner",
        status: "active",
        createdAt: now,
        updatedAt: now,
      });

      memRepo.spaces.push({
        id: spaceId,
        organizationId: orgId,
        name: "My Collections",
        slug: "my-collections",
        position: 0,
        createdBy: accountId,
        createdAt: now,
        updatedAt: now,
      });
    }

    return this.getOrganization(orgId, accountId);
  }

  public async getOrganization(orgId: string, accountId: string) {
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      const orgRows = await db
        .select()
        .from(schema.organizations)
        .where(and(eq(schema.organizations.id, orgId), isNull(schema.organizations.deletedAt)))
        .limit(1);

      if (orgRows.length === 0) {
        throw new AppError({
          statusCode: 404,
          code: "NOT_FOUND",
          message: "Organization not found.",
        });
      }

      const org = orgRows[0];
      const memberRows = await db
        .select()
        .from(schema.orgMembers)
        .where(
          and(
            eq(schema.orgMembers.organizationId, orgId),
            eq(schema.orgMembers.accountId, accountId),
            eq(schema.orgMembers.status, "active")
          )
        )
        .limit(1);

      if (memberRows.length === 0) {
        throw new AppError({
          statusCode: 404,
          code: "NOT_FOUND",
          message: "Organization not found or you are not an active member.",
        });
      }

      const allMembers = await db
        .select()
        .from(schema.orgMembers)
        .where(eq(schema.orgMembers.organizationId, orgId));

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        avatar_token: org.name.slice(0, 2).toUpperCase(),
        avatar_color: org.brandColor || "#6366f1",
        avatar_image_url: org.logoUrl || null,
        theme: "pink",
        description: null,
        owner_account_id: org.ownerAccountId,
        subscription: {
          plan: org.plan || "free",
          status: "active",
          seats: 5,
          seats_used: allMembers.length,
          current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
        },
        default_space_id: org.defaultSpaceId,
        my_role: memberRows[0].role,
        member_count: allMembers.length,
        space_count: 1,
        created_at: org.createdAt.toISOString(),
        updated_at: org.updatedAt.toISOString(),
      };
    } else {
      const org = memRepo.organizations.get(orgId);
      if (!org || org.deletedAt) {
        throw new AppError({
          statusCode: 404,
          code: "NOT_FOUND",
          message: "Organization not found.",
        });
      }

      const membership = memRepo.members.find(
        (m) => m.organizationId === orgId && m.accountId === accountId && m.status === "active"
      );

      if (!membership) {
        throw new AppError({
          statusCode: 404,
          code: "NOT_FOUND",
          message: "Organization not found or you are not an active member.",
        });
      }

      const memberCount = memRepo.members.filter((m) => m.organizationId === orgId).length;
      const spaceCount = memRepo.spaces.filter((s) => s.organizationId === orgId).length || 1;

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        avatar_token: org.name.slice(0, 2).toUpperCase(),
        avatar_color: org.brandColor || "#6366f1",
        avatar_image_url: org.avatarImageUrl || null,
        theme: org.theme || "pink",
        description: null,
        owner_account_id: org.ownerAccountId,
        subscription: {
          plan: org.plan || "free",
          status: "active",
          seats: 5,
          seats_used: memberCount,
          current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
        },
        default_space_id: org.defaultSpaceId || null,
        my_role: membership.role,
        member_count: memberCount,
        space_count: spaceCount,
        created_at: org.createdAt.toISOString(),
        updated_at: org.updatedAt.toISOString(),
      };
    }
  }

  public async updateOrganization(orgId: string, accountId: string, input: UpdateOrgInput) {
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      await db
        .update(schema.organizations)
        .set({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.avatarImageUrl !== undefined ? { logoUrl: input.avatarImageUrl } : {}),
          ...(input.brandColor !== undefined ? { brandColor: input.brandColor } : {}),
          ...(input.defaultSpaceId !== undefined ? { defaultSpaceId: input.defaultSpaceId } : {}),
          updatedAt: new Date(),
        })
        .where(eq(schema.organizations.id, orgId));
    } else {
      const org = memRepo.organizations.get(orgId);
      if (!org || org.deletedAt) {
        throw new AppError({
          statusCode: 404,
          code: "NOT_FOUND",
          message: "Organization not found.",
        });
      }

      if (input.name !== undefined) org.name = input.name;
      if (input.avatarImageUrl !== undefined) org.avatarImageUrl = input.avatarImageUrl;
      if (input.brandColor !== undefined) org.brandColor = input.brandColor;
      if (input.theme !== undefined) org.theme = input.theme;
      if (input.defaultSpaceId !== undefined) org.defaultSpaceId = input.defaultSpaceId;
      org.updatedAt = new Date();
    }

    return this.getOrganization(orgId, accountId);
  }

  public async transferOwnership(
    orgId: string,
    currentOwnerAccountId: string,
    newOwnerAccountId: string
  ) {
    const isDb = await checkDbConnection();

    if (currentOwnerAccountId === newOwnerAccountId) {
      throw new AppError({
        statusCode: 422,
        code: "BUSINESS_RULE_VIOLATION",
        message: "You are already the owner of this organization.",
      });
    }

    if (isDb) {
      const db = getDb();
      // Ensure target is active member
      const targetMember = await db
        .select()
        .from(schema.orgMembers)
        .where(
          and(
            eq(schema.orgMembers.organizationId, orgId),
            eq(schema.orgMembers.accountId, newOwnerAccountId),
            eq(schema.orgMembers.status, "active")
          )
        )
        .limit(1);

      if (targetMember.length === 0) {
        throw new AppError({
          statusCode: 422,
          code: "BUSINESS_RULE_VIOLATION",
          message: "New owner must be an active member of the organization.",
        });
      }

      // Demote current owner to admin, promote new owner to owner
      await db
        .update(schema.orgMembers)
        .set({ role: "admin", updatedAt: new Date() })
        .where(
          and(
            eq(schema.orgMembers.organizationId, orgId),
            eq(schema.orgMembers.accountId, currentOwnerAccountId)
          )
        );

      await db
        .update(schema.orgMembers)
        .set({ role: "owner", updatedAt: new Date() })
        .where(
          and(
            eq(schema.orgMembers.organizationId, orgId),
            eq(schema.orgMembers.accountId, newOwnerAccountId)
          )
        );

      await db
        .update(schema.organizations)
        .set({ ownerAccountId: newOwnerAccountId, updatedAt: new Date() })
        .where(eq(schema.organizations.id, orgId));
    } else {
      const org = memRepo.organizations.get(orgId);
      if (!org || org.deletedAt) {
        throw new AppError({
          statusCode: 404,
          code: "NOT_FOUND",
          message: "Organization not found.",
        });
      }

      const targetMember = memRepo.members.find(
        (m) =>
          m.organizationId === orgId &&
          m.accountId === newOwnerAccountId &&
          m.status === "active"
      );

      if (!targetMember) {
        throw new AppError({
          statusCode: 422,
          code: "BUSINESS_RULE_VIOLATION",
          message: "New owner must be an active member of the organization.",
        });
      }

      const currentMember = memRepo.members.find(
        (m) =>
          m.organizationId === orgId &&
          m.accountId === currentOwnerAccountId &&
          m.status === "active"
      );

      if (currentMember) {
        currentMember.role = "admin";
        currentMember.updatedAt = new Date();
      }

      targetMember.role = "owner";
      targetMember.updatedAt = new Date();
      org.ownerAccountId = newOwnerAccountId;
      org.updatedAt = new Date();
    }

    return this.getOrganization(orgId, newOwnerAccountId);
  }

  public async deleteOrganization(
    orgId: string,
    ownerAccountId: string,
    confirmText: string
  ) {
    const isDb = await checkDbConnection();
    let orgName = "";

    if (isDb) {
      const db = getDb();
      const orgRows = await db
        .select()
        .from(schema.organizations)
        .where(eq(schema.organizations.id, orgId))
        .limit(1);

      if (orgRows.length === 0) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Organization not found." });
      }
      orgName = orgRows[0].name;

      // Check other active members
      const otherMembers = await db
        .select()
        .from(schema.orgMembers)
        .where(
          and(
            eq(schema.orgMembers.organizationId, orgId),
            eq(schema.orgMembers.status, "active")
          )
        );

      if (otherMembers.length > 1) {
        throw new AppError({
          statusCode: 422,
          code: "BUSINESS_RULE_VIOLATION",
          message: "Remove all other members before deleting the organization.",
          details: { reason: "other_members_present" },
        });
      }

      const expected = `delete ${orgName.toLowerCase()}`;
      if (confirmText.toLowerCase() !== expected) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: `Confirmation text must match '${expected}'`,
        });
      }

      const deletedAt = new Date();
      await db
        .update(schema.organizations)
        .set({ deletedAt, updatedAt: deletedAt })
        .where(eq(schema.organizations.id, orgId));

      return {
        deleted_at: deletedAt.toISOString(),
        purges_at: new Date(deletedAt.getTime() + 30 * 86400000).toISOString(),
      };
    } else {
      const org = memRepo.organizations.get(orgId);
      if (!org) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Organization not found." });
      }
      orgName = org.name;

      const otherMembers = memRepo.members.filter(
        (m) =>
          m.organizationId === orgId &&
          m.accountId !== ownerAccountId &&
          m.status === "active"
      );

      if (otherMembers.length > 0) {
        throw new AppError({
          statusCode: 422,
          code: "BUSINESS_RULE_VIOLATION",
          message: "Remove all other members before deleting the organization.",
          details: { reason: "other_members_present" },
        });
      }

      const expected = `delete ${orgName.toLowerCase()}`;
      if (confirmText.toLowerCase() !== expected) {
        throw new AppError({
          statusCode: 400,
          code: "VALIDATION_FAILED",
          message: `Confirmation text must match '${expected}'`,
        });
      }

      const deletedAt = new Date();
      org.deletedAt = deletedAt;
      org.updatedAt = deletedAt;

      return {
        deleted_at: deletedAt.toISOString(),
        purges_at: new Date(deletedAt.getTime() + 30 * 86400000).toISOString(),
      };
    }
  }
}

export const organizationService = new OrganizationService();
