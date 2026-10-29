import { createHash } from "node:crypto";
import { memRepo, type MemFlag } from "../db/memRepo.js";
import { AppError } from "../errors/AppError.js";

export interface FlagEvaluationContext {
  surface?: string;
  url_host?: string;
  locale?: string;
  client_version?: string;
  session_age_minutes?: number;
  client_id?: string;
  [key: string]: unknown;
}

export interface FlagEvaluationResult {
  variant: string;
  reason:
    | "default"
    | "rollout_pct"
    | "rollout_email_allowlist"
    | "rollout_org_allowlist"
    | "ab_cohort_a"
    | "ab_cohort_b"
    | "killswitch"
    | "not_in_targeting"
    | "flag_unknown";
  payload?: Record<string, unknown> | null;
}

export interface EvaluateFlagsResponse {
  evaluated_at: string;
  ttl_seconds: number;
  flags: Record<string, FlagEvaluationResult>;
  exposure_logged: boolean;
}

function hashBucket(key: string, seed: string): number {
  const hash = createHash("sha256").update(`${key}:${seed}`).digest("hex");
  return parseInt(hash.slice(0, 8), 16) % 100;
}

export class FlagService {
  /**
   * Evaluate specific requested flags for the current Account, Org, and Context
   * Spec: 02-spec/21-app/03-api-endpoints/21-flags.md
   */
  public evaluateFlags(
    flagKeys: string[],
    accountId?: string | null,
    orgId?: string | null,
    context?: FlagEvaluationContext
  ): EvaluateFlagsResponse {
    if (!flagKeys || flagKeys.length === 0) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "flags array must contain between 1 and 100 keys",
      });
    }

    if (flagKeys.length > 100) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "flags array cannot exceed 100 keys per request",
      });
    }

    const org = orgId ? memRepo.organizations.get(orgId) : undefined;
    const orgPlan = org?.plan || "free";
    const seed = accountId || (context?.client_id as string) || "anonymous";

    const evaluatedFlags: Record<string, FlagEvaluationResult> = {};

    for (const key of flagKeys) {
      const flag = memRepo.flags.get(key);
      if (!flag) {
        // Spec: Unknown keys are silently dropped from the response (NOT 404)
        continue;
      }

      // 1. Killswitch check (top priority)
      if (flag.isKillswitch) {
        evaluatedFlags[key] = {
          variant: flag.defaultValue || "off",
          reason: "killswitch",
          payload: null,
        };
        continue;
      }

      // 2. Targeting Allowlist checks
      if (flag.targeting) {
        if (accountId && flag.targeting.accountIds?.includes(accountId)) {
          evaluatedFlags[key] = {
            variant: "on",
            reason: "rollout_email_allowlist",
            payload: flag.variants?.on || null,
          };
          continue;
        }

        if (orgId && flag.targeting.orgIds?.includes(orgId)) {
          evaluatedFlags[key] = {
            variant: "on",
            reason: "rollout_org_allowlist",
            payload: flag.variants?.on || null,
          };
          continue;
        }

        if (flag.targeting.plans && flag.targeting.plans.length > 0) {
          if (flag.targeting.plans.includes(orgPlan)) {
            evaluatedFlags[key] = {
              variant: "on",
              reason: "rollout_org_allowlist",
              payload: flag.variants?.on || null,
            };
            continue;
          } else if (flag.rolloutPct === 0) {
            evaluatedFlags[key] = {
              variant: flag.defaultValue || "off",
              reason: "not_in_targeting",
              payload: null,
            };
            continue;
          }
        }
      }

      // 3. Percentage Rollout & Multivariate assignment
      const bucket = hashBucket(key, seed);
      const rolloutPct = flag.rolloutPct ?? 100;

      if (bucket < rolloutPct) {
        if (flag.type === "multivariate" && flag.variants) {
          const variantKeys = Object.keys(flag.variants);
          const variantIndex = bucket % variantKeys.length;
          const assignedVariant = variantKeys[variantIndex];
          evaluatedFlags[key] = {
            variant: assignedVariant,
            reason: variantIndex === 0 ? "ab_cohort_a" : "ab_cohort_b",
            payload: flag.variants[assignedVariant] || null,
          };
        } else {
          evaluatedFlags[key] = {
            variant: "on",
            reason: "rollout_pct",
            payload: flag.variants?.on || null,
          };
        }
      } else {
        evaluatedFlags[key] = {
          variant: flag.defaultValue || "off",
          reason: "not_in_targeting",
          payload: flag.variants?.[flag.defaultValue] || null,
        };
      }
    }

    return {
      evaluated_at: new Date().toISOString(),
      ttl_seconds: 60,
      flags: evaluatedFlags,
      exposure_logged: true,
    };
  }

  /**
   * List all feature flags and their evaluated values for the current caller (GET /v1/flags)
   */
  public listAllFlags(
    accountId?: string | null,
    orgId?: string | null,
    context?: FlagEvaluationContext
  ): EvaluateFlagsResponse {
    const allKeys = Array.from(memRepo.flags.keys());
    return this.evaluateFlags(allKeys, accountId, orgId, context);
  }
}

export const flagService = new FlagService();
