import type {
  IdempotencyRecord,
  IIdempotencyStore,
} from "../interfaces/idempotencyStore.js";

/**
 * In-memory idempotency store for development and testing
 * Caches (accountId + key) -> IdempotencyRecord with automatic expiration
 */
export class MemoryIdempotencyStore implements IIdempotencyStore {
  private cache = new Map<string, IdempotencyRecord>();

  private getCompositeKey(accountId: string | null, key: string): string {
    return `${accountId || "anon"}:${key}`;
  }

  public async get(
    accountId: string | null,
    key: string
  ): Promise<IdempotencyRecord | null> {
    const compositeKey = this.getCompositeKey(accountId, key);
    const record = this.cache.get(compositeKey);

    if (!record) return null;

    if (record.expiresAt.getTime() < Date.now()) {
      this.cache.delete(compositeKey);
      return null;
    }

    return record;
  }

  public async set(
    accountId: string | null,
    key: string,
    record: Omit<IdempotencyRecord, "createdAt" | "expiresAt">,
    ttlSeconds = 86400 // 24 hours per spec 03-api-endpoints/01-conventions.md §6
  ): Promise<void> {
    const compositeKey = this.getCompositeKey(accountId, key);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    this.cache.set(compositeKey, {
      ...record,
      createdAt: now,
      expiresAt,
    });
  }

  public async purgeExpired(): Promise<number> {
    const now = Date.now();
    let purged = 0;

    for (const [key, record] of this.cache.entries()) {
      if (record.expiresAt.getTime() < now) {
        this.cache.delete(key);
        purged += 1;
      }
    }

    return purged;
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const memoryIdempotencyStore = new MemoryIdempotencyStore();
