/**
 * Abstract Rate Limiter Port
 * Spec: 02-spec/21-app/09-auth-accounts/11-rate-limits-and-abuse.md & 13-rate-limit-values.md
 */
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number; // Unix timestamp in seconds when the window resets
  retryAfterSeconds?: number;
}

export interface IRateLimiter {
  /**
   * Consume 1 token for a given identifier key within a sliding time window.
   */
  consume(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<RateLimitResult>;

  /**
   * Reset rate limit bucket for a key (e.g. after successful CAPTCHA or lockout clearance).
   */
  reset(key: string): Promise<void>;
}
