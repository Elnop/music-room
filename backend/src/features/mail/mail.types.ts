/**
 * Mail feature types
 *
 * Email templates are now inline functions - no registry needed.
 * Rate limiting types moved to shared.
 */

/**
 * Re-export rate limiting types from shared for backward compatibility
 */
export type {
  RateLimitConfig,
  RateLimitResult,
} from "@/shared/types/rate-limit.types.js";
