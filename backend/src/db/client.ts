import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../config/env.js";
import * as schema from "./schema/index.js";

let sqlClient: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!dbInstance) {
    sqlClient = postgres(env.DATABASE_URL, {
      max: env.NODE_ENV === "production" ? 20 : 5,
      idle_timeout: 30,
      connect_timeout: 1, // 1s connect timeout to prevent hanging health checks
    });
    dbInstance = drizzle(sqlClient, { schema });
  }
  return dbInstance;
}

let lastDbCheckTime = 0;
let lastDbCheckResult = false;
const DB_CHECK_CACHE_TTL_MS = 5000;

export async function checkDbConnection(): Promise<boolean> {
  const now = Date.now();
  if (now - lastDbCheckTime < DB_CHECK_CACHE_TTL_MS) {
    return lastDbCheckResult;
  }

  try {
    getDb();
    if (!sqlClient) {
      lastDbCheckTime = now;
      lastDbCheckResult = false;
      return false;
    }

    const timeoutMs = env.NODE_ENV === "test" ? 150 : 1000;
    await Promise.race([
      sqlClient`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DB_CONNECT_TIMEOUT")), timeoutMs)
      ),
    ]);
    lastDbCheckTime = now;
    lastDbCheckResult = true;
    return true;
  } catch {
    lastDbCheckTime = now;
    lastDbCheckResult = false;
    return false;
  }
}

export async function closeDb(): Promise<void> {
  if (sqlClient) {
    await sqlClient.end();
    sqlClient = null;
    dbInstance = null;
  }
}
