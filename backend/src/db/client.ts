import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../config/env.js";
import * as schema from "./schema/index.js";
import { dbRegistry, DbRegistry } from "./registry.js";
import type { DbDomain } from "./splitSchemas.js";

export { dbRegistry, DbRegistry };
export type { DbDomain };

let pgClient: ReturnType<typeof postgres> | null = null;
let pgDbInstance: any = null;

export function getDb(domain?: DbDomain): any {
  if (env.DB_DRIVER === "postgres") {
    if (pgDbInstance) return pgDbInstance;
    pgClient = postgres(env.DATABASE_URL, {
      max: env.NODE_ENV === "production" ? 20 : 5,
      idle_timeout: 30,
      connect_timeout: 1,
    });
    pgDbInstance = drizzlePg(pgClient, { schema });
    return pgDbInstance;
  }

  // SQLite Split-DB architecture
  if (domain) {
    return dbRegistry.get(domain);
  }
  return dbRegistry.createRoutingProxy();
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
    if (env.DB_DRIVER === "postgres") {
      getDb();
      if (!pgClient) {
        lastDbCheckTime = now;
        lastDbCheckResult = false;
        return false;
      }
      const timeoutMs = env.NODE_ENV === "test" ? 150 : 1000;
      await Promise.race([
        pgClient`SELECT 1`,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("DB_CONNECT_TIMEOUT")), timeoutMs)
        ),
      ]);
      lastDbCheckTime = now;
      lastDbCheckResult = true;
      return true;
    }

    // SQLite Split-DB connection & schema verification across all 5 databases
    const ok = await dbRegistry.checkConnection();
    lastDbCheckTime = now;
    lastDbCheckResult = ok;
    return ok;
  } catch {
    lastDbCheckTime = now;
    lastDbCheckResult = false;
    return false;
  }
}

export async function closeDb(): Promise<void> {
  if (pgClient) {
    await pgClient.end();
    pgClient = null;
  }
  pgDbInstance = null;
  await dbRegistry.close();
}
