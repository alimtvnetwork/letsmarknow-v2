/**
 * Cached response payload stored for idempotency
 */
export interface IdempotencyRecord {
  statusCode: number;
  headers: Record<string, string | string[]>;
  body: unknown;
  requestPayloadHash: string;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Abstract Idempotency Store Port
 * Spec: 02-spec/21-app/03-api-endpoints/01-conventions.md §6
 */
export interface IIdempotencyStore {
  /**
   * Retrieve cached response for an account + idempotency key
   */
  get(accountId: string | null, key: string): Promise<IdempotencyRecord | null>;

  /**
   * Save response for an account + idempotency key with TTL (default 24h)
   */
  set(
    accountId: string | null,
    key: string,
    record: Omit<IdempotencyRecord, "createdAt" | "expiresAt">,
    ttlSeconds?: number
  ): Promise<void>;

  /**
   * Delete or clear expired keys
   */
  purgeExpired(): Promise<number>;
}
