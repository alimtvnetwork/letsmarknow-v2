import { eq, and, inArray } from "drizzle-orm";
import { AppError } from "../errors/AppError.js";
import { getDb, checkDbConnection } from "../db/client.js";
import * as schema from "../db/schema/index.js";
import { uuidv7 } from "../db/utils/uuidv7.js";
import { generateSecureToken, createAccessToken } from "../utils/crypto.js";
import { consoleMailer } from "../adapters/consoleMailer.js";
import { memRepo, type MemInvite, type MemMember } from "../db/memRepo.js";
import type { OrgRole } from "../types/fastify.js";

export interface InviteInput {
  email: string;
  role: OrgRole;
  message?: string;
}

export class MemberService {
  public async listMembers(
    orgId: string,
    options: { includePending?: boolean; role?: string; q?: string } = {}
  ) {
    const isDb = await checkDbConnection();
    const includePending = options.includePending !== false;

    if (isDb) {
      const db = getDb();
      const memberRows = await db
        .select({
          memberId: schema.orgMembers.id,
          orgId: schema.orgMembers.organizationId,
          accountId: schema.orgMembers.accountId,
          role: schema.orgMembers.role,
          status: schema.orgMembers.status,
          invitedBy: schema.orgMembers.invitedBy,
          createdAt: schema.orgMembers.createdAt,
          updatedAt: schema.orgMembers.updatedAt,
        })
        .from(schema.orgMembers)
        .where(eq(schema.orgMembers.organizationId, orgId));

      // Cross-domain fetch (Split-DB application-level join)
      const accountIds = memberRows
        .map((m: any) => m.accountId)
        .filter((id: any): id is string => Boolean(id));

      const accountMap = new Map<
        string,
        { email: string; name?: string | null; avatarUrl?: string | null }
      >();

      if (accountIds.length > 0) {
        const accountsList = await db
          .select({
            id: schema.accounts.id,
            email: schema.accounts.email,
            displayName: schema.accounts.displayName,
            avatarUrl: schema.accounts.avatarUrl,
          })
          .from(schema.accounts)
          .where(inArray(schema.accounts.id, accountIds));

        for (const a of accountsList) {
          accountMap.set(a.id, {
            email: a.email,
            name: a.displayName,
            avatarUrl: a.avatarUrl,
          });
        }
      }

      const activeMembers = memberRows.map((m: any) => {
        const acc = m.accountId ? accountMap.get(m.accountId) : undefined;
        return {
          id: m.memberId,
          organization_id: m.orgId,
          account_id: m.accountId,
          email: acc?.email || "unknown@letsmarknow.com",
          name: acc?.name || acc?.email?.split("@")[0] || "Member",
          avatar_url: acc?.avatarUrl || null,
          role: m.role,
          status: m.status,
          invited_by: m.invitedBy || null,
          joined_at: m.createdAt.toISOString(),
          last_active_at: m.updatedAt.toISOString(),
          created_at: m.createdAt.toISOString(),
          updated_at: m.updatedAt.toISOString(),
        };
      });

      if (!includePending) return activeMembers;

      const inviteRows = await db
        .select()
        .from(schema.orgInvites)
        .where(eq(schema.orgInvites.organizationId, orgId));

      const pendingInvites = inviteRows.map((inv) => ({
        id: inv.id,
        organization_id: inv.organizationId,
        account_id: null,
        email: inv.email,
        name: inv.email.split("@")[0],
        avatar_url: null,
        role: inv.role,
        status: "pending",
        invited_by: inv.invitedBy || null,
        invited_at: inv.createdAt.toISOString(),
        invite_expires_at: inv.expiresAt.toISOString(),
        joined_at: null,
      }));

      return [...activeMembers, ...pendingInvites];
    } else {
      const members = memRepo.members
        .filter((m) => m.organizationId === orgId)
        .map((m) => {
          const acc = memRepo.getAccountById(m.accountId);
          return {
            id: m.id,
            organization_id: m.organizationId,
            account_id: m.accountId,
            email: acc?.email || "user@example.com",
            name: acc?.displayName || acc?.email.split("@")[0] || "Member",
            avatar_url: acc?.avatarUrl || null,
            role: m.role,
            status: m.status,
            invited_by: m.invitedBy || null,
            joined_at: m.createdAt.toISOString(),
            last_active_at: m.updatedAt.toISOString(),
            created_at: m.createdAt.toISOString(),
            updated_at: m.updatedAt.toISOString(),
          };
        });

      if (!includePending) return members;

      const invites = memRepo.invites
        .filter((inv) => inv.organizationId === orgId)
        .map((inv) => ({
          id: inv.id,
          organization_id: inv.organizationId,
          account_id: null,
          email: inv.email,
          name: inv.email.split("@")[0],
          avatar_url: null,
          role: inv.role,
          status: "pending",
          invited_by: inv.invitedBy || null,
          invited_at: inv.createdAt.toISOString(),
          invite_expires_at: inv.expiresAt.toISOString(),
          joined_at: null,
        }));

      return [...members, ...invites];
    }
  }

  public async inviteMembers(
    orgId: string,
    inviterAccountId: string,
    invites: InviteInput[]
  ) {
    if (invites.length > 50) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "Maximum 50 invites per request.",
      });
    }

    const isDb = await checkDbConnection();
    const results = [];

    for (let index = 0; index < invites.length; index++) {
      const item = invites[index];
      const cleanEmail = item.email.trim().toLowerCase();

      if (item.role === "owner") {
        results.push({
          index,
          status: 400,
          error: { code: "VALIDATION_FAILED", message: "Cannot invite member as owner." },
        });
        continue;
      }

      const inviteId = uuidv7();
      const token = `lmn-iv-${generateSecureToken(24)}`;
      const expiresAt = new Date(Date.now() + 7 * 86400000); // 7 days

      if (isDb) {
        const db = getDb();
        // Check if already member via Split-DB decoupled check
        const matchingAccounts = await db
          .select({ id: schema.accounts.id })
          .from(schema.accounts)
          .where(eq(schema.accounts.email, cleanEmail))
          .limit(1);

        if (matchingAccounts.length > 0) {
          const existingMembers = await db
            .select({ memberId: schema.orgMembers.id })
            .from(schema.orgMembers)
            .where(
              and(
                eq(schema.orgMembers.organizationId, orgId),
                eq(schema.orgMembers.accountId, matchingAccounts[0].id)
              )
            )
            .limit(1);

          if (existingMembers.length > 0) {
            results.push({
              index,
              status: 409,
              error: { code: "CONFLICT", details: { reason: "already_member" } },
            });
            continue;
          }
        }

        await db.insert(schema.orgInvites).values({
          id: inviteId,
          organizationId: orgId,
          email: cleanEmail,
          role: item.role,
          token,
          invitedBy: inviterAccountId,
          expiresAt,
        });
      } else {
        const existingMem = memRepo.members.some((m) => {
          if (m.organizationId !== orgId) return false;
          const acc = memRepo.getAccountById(m.accountId);
          return acc?.email === cleanEmail;
        });

        if (existingMem) {
          results.push({
            index,
            status: 409,
            error: { code: "CONFLICT", details: { reason: "already_member" } },
          });
          continue;
        }

        memRepo.invites.push({
          id: inviteId,
          organizationId: orgId,
          email: cleanEmail,
          role: item.role,
          token,
          invitedBy: inviterAccountId,
          expiresAt,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      await consoleMailer.sendOrgInviteEmail(cleanEmail, orgId, token);

      results.push({
        index,
        status: 201,
        member_id: inviteId,
        invite_token: token,
      });
    }

    return { results };
  }

  public async cancelInvite(orgId: string, inviteId: string) {
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      await db
        .delete(schema.orgInvites)
        .where(
          and(
            eq(schema.orgInvites.id, inviteId),
            eq(schema.orgInvites.organizationId, orgId)
          )
        );
    } else {
      const idx = memRepo.invites.findIndex(
        (i) => i.id === inviteId && i.organizationId === orgId
      );
      if (idx !== -1) memRepo.invites.splice(idx, 1);
    }
  }

  public async acceptInvite(token: string, callerAccountId?: string) {
    const isDb = await checkDbConnection();
    let inviteData: {
      id: string;
      organizationId: string;
      email: string;
      role: OrgRole;
      expiresAt: Date;
    } | null = null;

    if (isDb) {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.orgInvites)
        .where(eq(schema.orgInvites.token, token))
        .limit(1);

      if (rows.length > 0) inviteData = rows[0];
    } else {
      const found = memRepo.invites.find((i) => i.token === token);
      if (found) inviteData = found;
    }

    if (!inviteData || inviteData.expiresAt.getTime() < Date.now()) {
      throw new AppError({
        statusCode: 410,
        code: "GONE",
        message: "Invite token has expired or is invalid.",
      });
    }

    let resolvedAccountId = callerAccountId;

    if (!resolvedAccountId) {
      // Find if an account already exists with this email
      if (isDb) {
        const db = getDb();
        const accRows = await db
          .select({ id: schema.accounts.id })
          .from(schema.accounts)
          .where(eq(schema.accounts.email, inviteData.email))
          .limit(1);
        if (accRows.length > 0) resolvedAccountId = accRows[0].id;
      } else {
        const acc = memRepo.accounts.get(inviteData.email);
        if (acc) resolvedAccountId = acc.id;
      }
    }

    if (!resolvedAccountId) {
      return {
        organization_id: inviteData.organizationId,
        member_id: inviteData.id,
        role: inviteData.role,
        requires_signup: true,
        access_token: null,
        expires_in: 0,
      };
    }

    const memberId = uuidv7();
    const now = new Date();

    if (isDb) {
      const db = getDb();
      await db.insert(schema.orgMembers).values({
        id: memberId,
        organizationId: inviteData.organizationId,
        accountId: resolvedAccountId,
        role: inviteData.role,
        status: "active",
      });

      await db.delete(schema.orgInvites).where(eq(schema.orgInvites.id, inviteData.id));
    } else {
      memRepo.members.push({
        id: memberId,
        organizationId: inviteData.organizationId,
        accountId: resolvedAccountId,
        role: inviteData.role,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });

      const idx = memRepo.invites.findIndex((i) => i.id === inviteData!.id);
      if (idx !== -1) memRepo.invites.splice(idx, 1);
    }

    const accessToken = await createAccessToken({
      sub: resolvedAccountId,
      email: inviteData.email,
      org_id: inviteData.organizationId,
      role: inviteData.role,
    });

    return {
      organization_id: inviteData.organizationId,
      member_id: memberId,
      role: inviteData.role,
      requires_signup: false,
      access_token: accessToken,
      expires_in: 900,
    };
  }

  public async changeMemberRole(
    orgId: string,
    memberId: string,
    newRole: OrgRole,
    operatorRole: OrgRole
  ) {
    if (newRole === "owner") {
      throw new AppError({
        statusCode: 422,
        code: "BUSINESS_RULE_VIOLATION",
        message: "Use /v1/organizations/:id/transfer-ownership to transfer ownership.",
      });
    }

    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      const targetRows = await db
        .select()
        .from(schema.orgMembers)
        .where(
          and(
            eq(schema.orgMembers.id, memberId),
            eq(schema.orgMembers.organizationId, orgId)
          )
        )
        .limit(1);

      if (targetRows.length === 0) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Member not found." });
      }

      const target = targetRows[0];
      if (target.role === "owner") {
        throw new AppError({
          statusCode: 422,
          code: "BUSINESS_RULE_VIOLATION",
          message: "Cannot change role of organization owner.",
          details: { reason: "last_owner" },
        });
      }

      if (operatorRole === "admin" && target.role === "admin") {
        throw new AppError({
          statusCode: 403,
          code: "FORBIDDEN",
          message: "Admins cannot modify other Admins.",
        });
      }

      await db
        .update(schema.orgMembers)
        .set({ role: newRole, updatedAt: new Date() })
        .where(eq(schema.orgMembers.id, memberId));
    } else {
      const target = memRepo.members.find(
        (m) => m.id === memberId && m.organizationId === orgId
      );

      if (!target) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Member not found." });
      }

      if (target.role === "owner") {
        throw new AppError({
          statusCode: 422,
          code: "BUSINESS_RULE_VIOLATION",
          message: "Cannot change role of organization owner.",
          details: { reason: "last_owner" },
        });
      }

      if (operatorRole === "admin" && target.role === "admin") {
        throw new AppError({
          statusCode: 403,
          code: "FORBIDDEN",
          message: "Admins cannot modify other Admins.",
        });
      }

      target.role = newRole;
      target.updatedAt = new Date();
    }
  }

  public async removeMember(orgId: string, memberId: string) {
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      const targetRows = await db
        .select()
        .from(schema.orgMembers)
        .where(
          and(
            eq(schema.orgMembers.id, memberId),
            eq(schema.orgMembers.organizationId, orgId)
          )
        )
        .limit(1);

      if (targetRows.length === 0) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Member not found." });
      }

      if (targetRows[0].role === "owner") {
        throw new AppError({
          statusCode: 422,
          code: "BUSINESS_RULE_VIOLATION",
          message: "Cannot remove organization owner.",
          details: { reason: "last_owner" },
        });
      }

      await db.delete(schema.orgMembers).where(eq(schema.orgMembers.id, memberId));
    } else {
      const idx = memRepo.members.findIndex(
        (m) => m.id === memberId && m.organizationId === orgId
      );

      if (idx === -1) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Member not found." });
      }

      if (memRepo.members[idx].role === "owner") {
        throw new AppError({
          statusCode: 422,
          code: "BUSINESS_RULE_VIOLATION",
          message: "Cannot remove organization owner.",
          details: { reason: "last_owner" },
        });
      }

      memRepo.members.splice(idx, 1);
    }
  }

  public async leaveOrganization(orgId: string, accountId: string) {
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      const memberships = await db
        .select()
        .from(schema.orgMembers)
        .where(
          and(
            eq(schema.orgMembers.accountId, accountId),
            eq(schema.orgMembers.status, "active")
          )
        );

      const target = memberships.find((m) => m.organizationId === orgId);
      if (!target) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Membership not found." });
      }

      if (target.role === "owner") {
        throw new AppError({
          statusCode: 422,
          code: "BUSINESS_RULE_VIOLATION",
          message: "Must transfer ownership before leaving.",
          details: { reason: "last_owner" },
        });
      }

      if (memberships.length <= 1) {
        throw new AppError({
          statusCode: 422,
          code: "BUSINESS_RULE_VIOLATION",
          message: "Cannot leave your only organization.",
          details: { reason: "only_organization" },
        });
      }

      await db.delete(schema.orgMembers).where(eq(schema.orgMembers.id, target.id));
    } else {
      const memberships = memRepo.members.filter(
        (m) => m.accountId === accountId && m.status === "active"
      );

      const targetIdx = memberships.findIndex((m) => m.organizationId === orgId);
      if (targetIdx === -1) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Membership not found." });
      }

      const target = memberships[targetIdx];
      if (target.role === "owner") {
        throw new AppError({
          statusCode: 422,
          code: "BUSINESS_RULE_VIOLATION",
          message: "Must transfer ownership before leaving.",
          details: { reason: "last_owner" },
        });
      }

      if (memberships.length <= 1) {
        throw new AppError({
          statusCode: 422,
          code: "BUSINESS_RULE_VIOLATION",
          message: "Cannot leave your only organization.",
          details: { reason: "only_organization" },
        });
      }

      const realIdx = memRepo.members.findIndex((m) => m.id === target.id);
      if (realIdx !== -1) memRepo.members.splice(realIdx, 1);
    }
  }
}

export const memberService = new MemberService();
