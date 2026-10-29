import { hash, verify } from "@node-rs/argon2";
import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { env } from "../config/env.js";

const JWT_KEY = new TextEncoder().encode(env.JWT_SECRET);

export interface AccessTokenPayload {
  sub: string; // account_id
  email: string;
  org_id?: string;
  role?: string;
}

/**
 * Hash password using Argon2id per spec 09-auth-accounts/03-passwords-and-mfa.md
 */
export async function hashPassword(password: string): Promise<string> {
  const isTest = env.NODE_ENV === "test";
  return hash(password, {
    memoryCost: isTest ? 1024 : 19456,
    timeCost: isTest ? 1 : 2,
    outputLen: 32,
    parallelism: 1,
  });
}

/**
 * Verify password against Argon2id hash
 */
export async function verifyPassword(
  hashed: string,
  password: string
): Promise<boolean> {
  try {
    return await verify(hashed, password);
  } catch {
    return false;
  }
}

/**
 * SHA-256 hash for tokens (refresh tokens, invite tokens, verification tokens)
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Generate cryptographically secure random token (e.g. 64-hex string)
 */
export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

/**
 * Mint short-lived Access JWT (15 min) per spec 03-api-endpoints/01-conventions.md §2.1
 */
export async function createAccessToken(
  payload: AccessTokenPayload,
  expiresIn = "15m"
): Promise<string> {
  return new SignJWT({
    email: payload.email,
    org_id: payload.org_id,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_KEY);
}

/**
 * Verify Access JWT
 */
export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, JWT_KEY);
  return {
    sub: payload.sub as string,
    email: payload.email as string,
    org_id: payload.org_id as string | undefined,
    role: payload.role as string | undefined,
  };
}
