import { drizzle as drizzleLibsql, type LibSQLDatabase } from "drizzle-orm/libsql";
import { createClient as createLibsqlClient, type Client as LibsqlClient } from "@libsql/client";
import { getTableName } from "drizzle-orm";
import path from "node:path";
import fs from "node:fs";
import { env } from "../config/env.js";
import * as schema from "./schema/index.js";
import {
  type DbDomain,
  SPLIT_DB_FILES,
  TABLE_TO_DOMAIN,
  SPLIT_DDL,
} from "./splitSchemas.js";

export class DbRegistry {
  private clients: Map<DbDomain, LibsqlClient> = new Map();
  private dbs: Map<DbDomain, LibSQLDatabase<typeof schema>> = new Map();
  private initialized: boolean = false;
  private initializingPromise: Promise<void> | null = null;
  private dataDir: string;
  private routingProxy: any = null;

  constructor(dataDir?: string) {
    if (dataDir) {
      this.dataDir = dataDir;
    } else {
      const rawUrl = env.DATABASE_URL || "file:./data/letsmarknow.db";
      if (rawUrl.startsWith("file:") && !rawUrl.includes(":memory:")) {
        const rawPath = rawUrl.replace(/^file:\/\//, "").replace(/^file:/, "");
        this.dataDir = path.dirname(path.resolve(rawPath));
      } else {
        this.dataDir = path.resolve(process.cwd(), "data");
      }
    }
  }

  public getDataDir(): string {
    return this.dataDir;
  }

  public getDomains(): DbDomain[] {
    return ["auth", "workspace", "bookmarks", "shares", "history"];
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializingPromise) return this.initializingPromise;

    this.initializingPromise = (async () => {
      const isTest = env.NODE_ENV === "test" || Boolean(process.env.VITEST);
      const isMemory = env.DATABASE_URL.includes(":memory:");

      if (!isTest && !isMemory) {
        if (!fs.existsSync(this.dataDir)) {
          try {
            fs.mkdirSync(this.dataDir, { recursive: true });
          } catch {
            // directory might already exist
          }
        }
      }

      for (const domain of this.getDomains()) {
        let client = this.clients.get(domain);
        if (!client) {
          let clientUrl: string;
          if (isTest || isMemory) {
            clientUrl = "file::memory:";
          } else {
            const filePath = path.join(this.dataDir, SPLIT_DB_FILES[domain]);
            clientUrl = `file:${filePath.replace(/\\/g, "/")}`;
          }

          client = createLibsqlClient({ url: clientUrl });
          this.clients.set(domain, client);
          this.dbs.set(domain, drizzleLibsql(client, { schema }));
        }

        try {
          // Concurrency PRAGMAs per 02-spec/05-split-db-architecture
          await client.execute("PRAGMA journal_mode = WAL;");
          await client.execute("PRAGMA busy_timeout = 5000;");
          await client.execute("PRAGMA synchronous = NORMAL;");
          await client.execute("PRAGMA foreign_keys = ON;");

          // Execute domain DDL batch
          const ddl = SPLIT_DDL[domain];
          if (ddl) {
            const statements = ddl
              .split(";")
              .map((s) => s.trim())
              .filter((s) => s.length > 0);

            if (statements.length > 0) {
              await client.batch(
                statements.map((sql) => ({ sql, args: [] })),
                "write"
              );
            }
          }
        } catch (err) {
          // In concurrent test suites, tables may already be defined
        }
      }

      this.initialized = true;
    })();

    await this.initializingPromise;
  }

  /**
   * Lazily ensure clients exist synchronously for immediate use.
   */
  private ensureClientsSynchronous(): void {
    if (this.clients.size === 5) return;

    const isTest = env.NODE_ENV === "test" || Boolean(process.env.VITEST);
    const isMemory = env.DATABASE_URL.includes(":memory:");

    if (!isTest && !isMemory && !fs.existsSync(this.dataDir)) {
      try {
        fs.mkdirSync(this.dataDir, { recursive: true });
      } catch {
        // ignore
      }
    }

    for (const domain of this.getDomains()) {
      if (!this.clients.has(domain)) {
        let clientUrl: string;
        if (isTest || isMemory) {
          clientUrl = "file::memory:";
        } else {
          const filePath = path.join(this.dataDir, SPLIT_DB_FILES[domain]);
          clientUrl = `file:${filePath.replace(/\\/g, "/")}`;
        }
        const client = createLibsqlClient({ url: clientUrl });
        this.clients.set(domain, client);
        this.dbs.set(domain, drizzleLibsql(client, { schema }));
      }
    }
  }

  public get(domain: DbDomain): LibSQLDatabase<typeof schema> {
    this.ensureClientsSynchronous();
    const db = this.dbs.get(domain);
    if (!db) {
      throw new Error(`DbRegistry: Domain "${domain}" is not initialized.`);
    }
    return db;
  }

  public getClient(domain: DbDomain): LibsqlClient {
    this.ensureClientsSynchronous();
    const client = this.clients.get(domain);
    if (!client) {
      throw new Error(`DbRegistry: Client for domain "${domain}" is not initialized.`);
    }
    return client;
  }

  public getDomainForTable(table: any): DbDomain {
    try {
      const tableName = getTableName(table);
      const domain = TABLE_TO_DOMAIN[tableName];
      if (domain) return domain;
    } catch {
      // fallback
    }
    return "bookmarks";
  }

  public createRoutingProxy(): any {
    if (this.routingProxy) return this.routingProxy;

    const self = this;
    this.routingProxy = {
      select(...args: any[]) {
        return {
          from(table: any) {
            const domain = self.getDomainForTable(table);
            const domainDb = self.get(domain);
            return (domainDb.select as any)(...args).from(table);
          },
        };
      },

      selectDistinct(...args: any[]) {
        return {
          from(table: any) {
            const domain = self.getDomainForTable(table);
            const domainDb = self.get(domain);
            return (domainDb.selectDistinct as any)(...args).from(table);
          },
        };
      },

      insert(table: any) {
        const domain = self.getDomainForTable(table);
        const domainDb = self.get(domain);
        return domainDb.insert(table);
      },

      update(table: any) {
        const domain = self.getDomainForTable(table);
        const domainDb = self.get(domain);
        return domainDb.update(table);
      },

      delete(table: any) {
        const domain = self.getDomainForTable(table);
        const domainDb = self.get(domain);
        return domainDb.delete(table);
      },

      domain(domainName: DbDomain) {
        return self.get(domainName);
      },
    };

    return this.routingProxy;
  }

  public async checkConnection(): Promise<boolean> {
    try {
      await this.initialize();
      for (const domain of this.getDomains()) {
        const client = this.clients.get(domain);
        if (!client) return false;
        await client.execute("SELECT 1;");
      }
      return true;
    } catch {
      return false;
    }
  }

  public async close(): Promise<void> {
    for (const client of this.clients.values()) {
      try {
        client.close();
      } catch {
        // ignore
      }
    }
    this.clients.clear();
    this.dbs.clear();
    this.initialized = false;
    this.initializingPromise = null;
    this.routingProxy = null;
  }
}

export const dbRegistry = new DbRegistry();
