import { eq, and } from "drizzle-orm";
import { AppError } from "../errors/AppError.js";
import { getDb, checkDbConnection } from "../db/client.js";
import * as schema from "../db/schema/index.js";
import { uuidv7 } from "../db/utils/uuidv7.js";
import {
  hashPassword,
  verifyPassword,
  hashToken,
  generateSecureToken,
  createAccessToken,
} from "../utils/crypto.js";
import { consoleMailer } from "../adapters/consoleMailer.js";

export interface SignupInput {
  email: string;
  password: string;
  name?: string;
}

export interface SigninInput {
  email: string;
  password: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface AuthResult {
  account_id: string;
  email: string;
  name?: string;
  default_organization_id: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

import { memRepo, type MemSession } from "../db/memRepo.js";

export class AuthService {
  public getMemRepo() {
    return memRepo;
  }

  public async signup(input: SignupInput): Promise<AuthResult> {
    const cleanEmail = input.email.trim().toLowerCase();
    const isDb = await checkDbConnection();

    // Check if account already exists
    if (isDb) {
      const db = getDb();
      const existing = await db
        .select()
        .from(schema.accounts)
        .where(eq(schema.accounts.email, cleanEmail))
        .limit(1);

      if (existing.length > 0) {
        throw new AppError({
          statusCode: 409,
          code: "CONFLICT",
          message: "An account with this email already exists.",
          details: { reason: "email_exists" },
          docUrl: "https://docs.letsmarknow.com/errors/conflict",
        });
      }
    } else {
      if (memRepo.accounts.has(cleanEmail)) {
        throw new AppError({
          statusCode: 409,
          code: "CONFLICT",
          message: "An account with this email already exists.",
          details: { reason: "email_exists" },
          docUrl: "https://docs.letsmarknow.com/errors/conflict",
        });
      }
    }

    const passwordHash = await hashPassword(input.password);
    const accountId = uuidv7();
    const orgId = uuidv7();
    const spaceId = uuidv7();
    const collectionId = uuidv7();
    const rawRefreshToken = generateSecureToken(32);
    const refreshTokenHash = hashToken(rawRefreshToken);
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const displayName = input.name?.trim() || cleanEmail.split("@")[0];
    const orgName = `${displayName}'s Workspace`;
    const orgSlug = `${displayName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${accountId.slice(0, 6)}`;

    if (isDb) {
      const db = getDb();
      await db.insert(schema.accounts).values({
        id: accountId,
        email: cleanEmail,
        passwordHash,
        displayName,
        status: "active",
      });

      await db.insert(schema.organizations).values({
        id: orgId,
        name: orgName,
        slug: orgSlug,
        ownerAccountId: accountId,
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
        name: "Personal Space",
        slug: "personal-space",
        position: 0,
        createdBy: accountId,
      });

      await db.insert(schema.collections).values({
        id: collectionId,
        organizationId: orgId,
        spaceId,
        name: "Quick Saves",
        slug: "quick-saves",
        position: 0,
        createdBy: accountId,
      });

      await db.insert(schema.sessions).values({
        id: uuidv7(),
        accountId,
        refreshTokenHash,
        expiresAt: sessionExpiresAt,
      });
    } else {
      memRepo.accounts.set(cleanEmail, {
        id: accountId,
        email: cleanEmail,
        passwordHash,
        displayName,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const now = new Date();
      memRepo.organizations.set(orgId, {
        id: orgId,
        name: orgName,
        slug: orgSlug,
        ownerAccountId: accountId,
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

      memRepo.sessions.set(refreshTokenHash, {
        id: uuidv7(),
        accountId,
        refreshTokenHash,
        expiresAt: sessionExpiresAt,
        createdAt: new Date(),
      });
    }

    // Send verification email via ConsoleMailer
    const verifyToken = generateSecureToken(16);
    memRepo.verificationTokens.set(verifyToken, accountId);
    await consoleMailer.sendVerificationEmail(cleanEmail, verifyToken);

    // Mint access JWT
    const accessToken = await createAccessToken({
      sub: accountId,
      email: cleanEmail,
      org_id: orgId,
      role: "owner",
    });

    return {
      account_id: accountId,
      email: cleanEmail,
      name: displayName,
      default_organization_id: orgId,
      access_token: accessToken,
      refresh_token: rawRefreshToken,
      expires_in: 900,
    };
  }

  public async signin(input: SigninInput): Promise<AuthResult> {
    const cleanEmail = input.email.trim().toLowerCase();
    const isDb = await checkDbConnection();

    let accountRecord: {
      id: string;
      email: string;
      passwordHash: string | null;
      displayName?: string | null;
    } | null = null;

    let defaultOrgId = "";

    if (isDb) {
      const db = getDb();
      const accounts = await db
        .select()
        .from(schema.accounts)
        .where(eq(schema.accounts.email, cleanEmail))
        .limit(1);

      if (accounts.length > 0) {
        accountRecord = accounts[0];
        const memberRow = await db
          .select()
          .from(schema.orgMembers)
          .where(eq(schema.orgMembers.accountId, accountRecord.id))
          .limit(1);
        if (memberRow.length > 0) {
          defaultOrgId = memberRow[0].organizationId;
        }
      }
    } else {
      const memAcc = memRepo.accounts.get(cleanEmail);
      if (memAcc) {
        accountRecord = memAcc;
        const memMem = memRepo.members.find((m) => m.accountId === memAcc.id);
        if (memMem) defaultOrgId = memMem.organizationId;
      }
    }

    if (!accountRecord || !accountRecord.passwordHash) {
      throw new AppError({
        statusCode: 401,
        code: "UNAUTHENTICATED",
        message: "Invalid email or password.",
        docUrl: "https://docs.letsmarknow.com/errors/unauthenticated",
      });
    }

    const isValidPassword = await verifyPassword(
      accountRecord.passwordHash,
      input.password
    );

    if (!isValidPassword) {
      throw new AppError({
        statusCode: 401,
        code: "UNAUTHENTICATED",
        message: "Invalid email or password.",
        docUrl: "https://docs.letsmarknow.com/errors/unauthenticated",
      });
    }

    const rawRefreshToken = generateSecureToken(32);
    const refreshTokenHash = hashToken(rawRefreshToken);
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (isDb) {
      const db = getDb();
      await db.insert(schema.sessions).values({
        id: uuidv7(),
        accountId: accountRecord.id,
        refreshTokenHash,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
        expiresAt: sessionExpiresAt,
      });
    } else {
      memRepo.sessions.set(refreshTokenHash, {
        id: uuidv7(),
        accountId: accountRecord.id,
        refreshTokenHash,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
        expiresAt: sessionExpiresAt,
        createdAt: new Date(),
      });
    }

    const accessToken = await createAccessToken({
      sub: accountRecord.id,
      email: accountRecord.email,
      org_id: defaultOrgId || undefined,
    });

    return {
      account_id: accountRecord.id,
      email: accountRecord.email,
      name: accountRecord.displayName || undefined,
      default_organization_id: defaultOrgId,
      access_token: accessToken,
      refresh_token: rawRefreshToken,
      expires_in: 900,
    };
  }

  public async refreshToken(
    rawRefreshToken: string,
    requestedOrgId?: string
  ): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    active_organization_id?: string;
  }> {
    const isDb = await checkDbConnection();
    const tokenHash = hashToken(rawRefreshToken);

    let accountId = "";
    let email = "";
    let activeOrgId = requestedOrgId;

    if (isDb) {
      const db = getDb();
      const sessionRows = await db
        .select()
        .from(schema.sessions)
        .where(
          and(
            eq(schema.sessions.refreshTokenHash, tokenHash),
            // ensure not expired
          )
        )
        .limit(1);

      if (sessionRows.length === 0 || sessionRows[0].expiresAt.getTime() < Date.now()) {
        throw new AppError({
          statusCode: 401,
          code: "UNAUTHENTICATED",
          message: "Refresh token is invalid or expired.",
          docUrl: "https://docs.letsmarknow.com/errors/unauthenticated",
        });
      }

      accountId = sessionRows[0].accountId;
      const accRows = await db
        .select()
        .from(schema.accounts)
        .where(eq(schema.accounts.id, accountId))
        .limit(1);
      email = accRows[0]?.email || "";

      // Rotate token: update session with new hash
      const newRawToken = generateSecureToken(32);
      const newHash = hashToken(newRawToken);
      await db
        .update(schema.sessions)
        .set({
          refreshTokenHash: newHash,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        })
        .where(eq(schema.sessions.id, sessionRows[0].id));

      const newAccessToken = await createAccessToken({
        sub: accountId,
        email,
        org_id: activeOrgId,
      });

      return {
        access_token: newAccessToken,
        refresh_token: newRawToken,
        expires_in: 900,
        active_organization_id: activeOrgId,
      };
    } else {
      const memSession = memRepo.sessions.get(tokenHash);
      if (!memSession || memSession.expiresAt.getTime() < Date.now()) {
        throw new AppError({
          statusCode: 401,
          code: "UNAUTHENTICATED",
          message: "Refresh token is invalid or expired.",
          docUrl: "https://docs.letsmarknow.com/errors/unauthenticated",
        });
      }

      accountId = memSession.accountId;
      for (const acc of memRepo.accounts.values()) {
        if (acc.id === accountId) email = acc.email;
      }

      // Rotate
      memRepo.sessions.delete(tokenHash);
      const newRawToken = generateSecureToken(32);
      const newHash = hashToken(newRawToken);
      memRepo.sessions.set(newHash, {
        ...memSession,
        refreshTokenHash: newHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const newAccessToken = await createAccessToken({
        sub: accountId,
        email,
        org_id: activeOrgId,
      });

      return {
        access_token: newAccessToken,
        refresh_token: newRawToken,
        expires_in: 900,
        active_organization_id: activeOrgId,
      };
    }
  }

  public async signout(rawRefreshToken?: string): Promise<void> {
    if (!rawRefreshToken) return;
    const tokenHash = hashToken(rawRefreshToken);
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      await db
        .delete(schema.sessions)
        .where(eq(schema.sessions.refreshTokenHash, tokenHash));
    } else {
      memRepo.sessions.delete(tokenHash);
    }
  }

  public async verifyEmail(token: string): Promise<Date> {
    const verifiedAt = new Date();
    const isDb = await checkDbConnection();

    const accountId = memRepo.verificationTokens.get(token);
    if (!accountId) {
      throw new AppError({
        statusCode: 410,
        code: "VALIDATION_FAILED",
        message: "Verification token is invalid or expired.",
        docUrl: "https://docs.letsmarknow.com/errors/validation_failed",
      });
    }

    if (isDb) {
      const db = getDb();
      await db
        .update(schema.accounts)
        .set({ emailVerifiedAt: verifiedAt })
        .where(eq(schema.accounts.id, accountId));
    } else {
      for (const acc of memRepo.accounts.values()) {
        if (acc.id === accountId) {
          acc.emailVerifiedAt = verifiedAt;
        }
      }
    }

    memRepo.verificationTokens.delete(token);
    return verifiedAt;
  }

  public async getAccount(accountId: string) {
    const isDb = await checkDbConnection();
    if (isDb) {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.accounts)
        .where(eq(schema.accounts.id, accountId))
        .limit(1);

      if (rows.length === 0) {
        throw new AppError({
          statusCode: 404,
          code: "NOT_FOUND",
          message: "Account not found",
        });
      }
      const acc = rows[0];
      return {
        id: acc.id,
        email: acc.email,
        name: acc.displayName || undefined,
        avatar_url: acc.avatarUrl || undefined,
        email_verified: Boolean(acc.emailVerifiedAt),
        created_at: acc.createdAt.toISOString(),
      };
    } else {
      for (const acc of memRepo.accounts.values()) {
        if (acc.id === accountId) {
          return {
            id: acc.id,
            email: acc.email,
            name: acc.displayName || undefined,
            avatar_url: acc.avatarUrl || undefined,
            email_verified: Boolean(acc.emailVerifiedAt),
            created_at: acc.createdAt.toISOString(),
          };
        }
      }
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Account not found",
      });
    }
  }

  public async updateAccount(
    accountId: string,
    input: { displayName?: string; avatarUrl?: string }
  ) {
    const isDb = await checkDbConnection();
    if (isDb) {
      const db = getDb();
      const rows = await db
        .update(schema.accounts)
        .set({
          ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
          ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
          updatedAt: new Date(),
        })
        .where(eq(schema.accounts.id, accountId))
        .returning();

      if (rows.length === 0) {
        throw new AppError({
          statusCode: 404,
          code: "NOT_FOUND",
        message: "Account not found",
        });
      }
      const acc = rows[0];
      return {
        id: acc.id,
        email: acc.email,
        name: acc.displayName || undefined,
        avatar_url: acc.avatarUrl || undefined,
        email_verified: Boolean(acc.emailVerifiedAt),
        updated_at: acc.updatedAt.toISOString(),
      };
    } else {
      for (const acc of memRepo.accounts.values()) {
        if (acc.id === accountId) {
          if (input.displayName !== undefined) acc.displayName = input.displayName;
          if (input.avatarUrl !== undefined) acc.avatarUrl = input.avatarUrl;
          acc.updatedAt = new Date();
          return {
            id: acc.id,
            email: acc.email,
            name: acc.displayName || undefined,
            avatar_url: acc.avatarUrl || undefined,
            email_verified: Boolean(acc.emailVerifiedAt),
            updated_at: acc.updatedAt.toISOString(),
          };
        }
      }
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Account not found",
      });
    }
  }

  public async listSessions(accountId: string, currentRefreshToken?: string) {
    const currentHash = currentRefreshToken ? hashToken(currentRefreshToken) : undefined;
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.accountId, accountId));

      return rows.map((s) => ({
        id: s.id,
        client: s.userAgent || "web",
        ip: s.ipAddress || "127.0.0.1",
        user_agent: s.userAgent || undefined,
        current: currentHash ? s.refreshTokenHash === currentHash : false,
        created_at: s.createdAt.toISOString(),
      }));
    } else {
      const result = [];
      for (const s of memRepo.sessions.values()) {
        if (s.accountId === accountId) {
          result.push({
            id: s.id,
            client: s.userAgent || "web",
            ip: s.ipAddress || "127.0.0.1",
            user_agent: s.userAgent || undefined,
            current: currentHash ? s.refreshTokenHash === currentHash : false,
            created_at: s.createdAt.toISOString(),
          });
        }
      }
      return result;
    }
  }

  public async revokeSession(
    accountId: string,
    sessionId: string,
    currentRefreshToken?: string
  ) {
    const currentHash = currentRefreshToken ? hashToken(currentRefreshToken) : undefined;
    const isDb = await checkDbConnection();

    if (isDb) {
      const db = getDb();
      const sessionRow = await db
        .select()
        .from(schema.sessions)
        .where(
          and(
            eq(schema.sessions.id, sessionId),
            eq(schema.sessions.accountId, accountId)
          )
        )
        .limit(1);

      if (sessionRow.length === 0) {
        throw new AppError({
          statusCode: 404,
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }

      if (currentHash && sessionRow[0].refreshTokenHash === currentHash) {
        throw new AppError({
          statusCode: 403,
          code: "FORBIDDEN",
          message: "Cannot revoke current session via this endpoint. Use /v1/auth/signout instead.",
        });
      }

      await db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId));
    } else {
      let targetKey: string | null = null;
      let targetSession: MemSession | null = null;

      for (const [key, s] of memRepo.sessions.entries()) {
        if (s.id === sessionId && s.accountId === accountId) {
          targetKey = key;
          targetSession = s;
          break;
        }
      }

      if (!targetSession || !targetKey) {
        throw new AppError({
          statusCode: 404,
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }

      if (currentHash && targetSession.refreshTokenHash === currentHash) {
        throw new AppError({
          statusCode: 403,
          code: "FORBIDDEN",
          message: "Cannot revoke current session via this endpoint. Use /v1/auth/signout instead.",
        });
      }

      memRepo.sessions.delete(targetKey);
    }
  }

  public async changePassword(
    accountId: string,
    currentPass: string,
    newPass: string,
    currentRefreshToken?: string
  ): Promise<void> {
    const isDb = await checkDbConnection();
    if (newPass.length < 8) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "New password must be at least 8 characters long",
      });
    }

    if (isDb) {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.accounts)
        .where(eq(schema.accounts.id, accountId))
        .limit(1);
      if (rows.length === 0 || !rows[0].passwordHash) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Account not found" });
      }
      const valid = await verifyPassword(rows[0].passwordHash, currentPass);
      if (!valid) {
        throw new AppError({
          statusCode: 401,
          code: "AUTH_INVALID_CREDENTIALS",
          message: "Current password is incorrect.",
        });
      }
      const newHash = await hashPassword(newPass);
      await db
        .update(schema.accounts)
        .set({ passwordHash: newHash, updatedAt: new Date() })
        .where(eq(schema.accounts.id, accountId));
    } else {
      let foundAccount: any = null;
      for (const acc of memRepo.accounts.values()) {
        if (acc.id === accountId) {
          foundAccount = acc;
          break;
        }
      }
      if (!foundAccount) {
        throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Account not found" });
      }
      const valid = await verifyPassword(foundAccount.passwordHash, currentPass);
      if (!valid) {
        throw new AppError({
          statusCode: 401,
          code: "AUTH_INVALID_CREDENTIALS",
          message: "Current password is incorrect.",
        });
      }
      foundAccount.passwordHash = await hashPassword(newPass);
      foundAccount.updatedAt = new Date();

      // Revoke all other sessions except current
      const currentHash = currentRefreshToken ? hashToken(currentRefreshToken) : undefined;
      for (const [key, s] of memRepo.sessions.entries()) {
        if (s.accountId === accountId && (!currentHash || s.refreshTokenHash !== currentHash)) {
          memRepo.sessions.delete(key);
        }
      }
    }
  }

  public async signoutAll(accountId: string): Promise<void> {
    const isDb = await checkDbConnection();
    if (isDb) {
      const db = getDb();
      await db.delete(schema.sessions).where(eq(schema.sessions.accountId, accountId));
    } else {
      for (const [key, s] of memRepo.sessions.entries()) {
        if (s.accountId === accountId) {
          memRepo.sessions.delete(key);
        }
      }
      for (const acc of memRepo.accounts.values()) {
        if (acc.id === accountId) {
          acc.tokensInvalidatedAfter = new Date();
          break;
        }
      }
    }
  }

  public async getPreferences(
    accountId: string
  ): Promise<{ preferences: any; updated_at: string }> {
    for (const acc of memRepo.accounts.values()) {
      if (acc.id === accountId) {
        const defaultPrefs = {
          default_view: "grid",
          theme: "system",
          locale: "en-US",
          timezone: "UTC",
          layout: {
            sidebar_width_px: 280,
            right_pane_width_px: 360,
            section_heights_px: { starred: 200, recent: 240 },
          },
          keyboard_layout: "qwerty",
          notifications: {
            email_digest: "weekly",
            in_app: true,
          },
          experiments: {},
        };
        const prefs = { ...defaultPrefs, ...(acc.preferences || {}) };
        return {
          preferences: prefs,
          updated_at: acc.updatedAt.toISOString(),
        };
      }
    }
    throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Account not found" });
  }

  public async updatePreferences(
    accountId: string,
    patch: any,
    ifMatch?: string
  ): Promise<{ preferences: any; updated_at: string }> {
    for (const acc of memRepo.accounts.values()) {
      if (acc.id === accountId) {
        if (ifMatch && ifMatch !== acc.updatedAt.toISOString()) {
          throw new AppError({
            statusCode: 409,
            code: "CONFLICT",
            message: "Preferences were modified concurrently. Please reload and retry.",
          });
        }

        const currentPrefs = acc.preferences || {
          default_view: "grid",
          theme: "system",
          locale: "en-US",
          timezone: "UTC",
          layout: {
            sidebar_width_px: 280,
            right_pane_width_px: 360,
            section_heights_px: { starred: 200, recent: 240 },
          },
          keyboard_layout: "qwerty",
          notifications: {
            email_digest: "weekly",
            in_app: true,
          },
          experiments: {},
        };

        acc.preferences = {
          ...currentPrefs,
          ...patch,
          layout: {
            ...(currentPrefs.layout || {}),
            ...(patch.layout || {}),
            section_heights_px: {
              ...(currentPrefs.layout?.section_heights_px || {}),
              ...(patch.layout?.section_heights_px || {}),
            },
          },
          notifications: {
            ...(currentPrefs.notifications || {}),
            ...(patch.notifications || {}),
          },
          experiments: {
            ...(currentPrefs.experiments || {}),
            ...(patch.experiments || {}),
          },
        };

        acc.updatedAt = new Date();
        return {
          preferences: acc.preferences,
          updated_at: acc.updatedAt.toISOString(),
        };
      }
    }
    throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Account not found" });
  }

  public async triggerGdprExport(
    _accountId: string,
    _destinationEmail?: string,
    _includeOrgs?: string[]
  ): Promise<{ request_id: string; eta_hours: number }> {
    return {
      request_id: uuidv7(),
      eta_hours: 24,
    };
  }
}

export const authService = new AuthService();
