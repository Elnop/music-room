/**
 * Mail feature types
 *
 * Minimal types for rate limiting only.
 * Email templates are now inline functions - no registry needed.
 */

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
	maxAttempts: number;
	windowSeconds: number;
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
	canProceed: boolean;
	remainingSeconds?: number;
	attempts?: number;
}
