import type { IRateLimiter, RateLimitResult } from "../interfaces/rateLimiter.js";

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

/**
 * In-memory sliding token bucket rate limiter for development
 */
export class MemoryRateLimiter implements IRateLimiter {
  private buckets = new Map<string, TokenBucket>();

  public async consume(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const refillRate = limit / windowMs; // tokens per ms

    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: limit, lastRefill: now };
      this.buckets.set(key, bucket);
    } else {
      // Refill tokens based on elapsed time
      const elapsed = now - bucket.lastRefill;
      bucket.tokens = Math.min(limit, bucket.tokens + elapsed * refillRate);
      bucket.lastRefill = now;
    }

    const resetSeconds = Math.ceil((now + windowMs) / 1000);

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return {
        allowed: true,
        limit,
        remaining: Math.floor(bucket.tokens),
        resetSeconds,
      };
    }

    const missingTokens = 1 - bucket.tokens;
    const retryAfterSeconds = Math.ceil(missingTokens / (refillRate * 1000));

    return {
      allowed: false,
      limit,
      remaining: 0,
      resetSeconds,
      retryAfterSeconds,
    };
  }

  public async reset(key: string): Promise<void> {
    this.buckets.delete(key);
  }

  public clear(): void {
    this.buckets.clear();
  }
}

export const memoryRateLimiter = new MemoryRateLimiter();
