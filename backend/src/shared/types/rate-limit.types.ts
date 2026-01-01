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

/**
 * Account lockout status
 */
export interface LockoutStatus {
  isLocked: boolean;
  failedAttempts: number;
  remainingAttempts?: number;
  lockedUntil?: Date;
  remainingSeconds?: number;
}

/**
 * IP reputation status
 */
export interface IPReputationStatus {
  status: "normal" | "throttled" | "blocked" | "blacklisted";
  count: number;
}

/**
 * Rate limit error details
 */
export interface RateLimitError {
  message: string;
  code: "RATE_LIMIT_EXCEEDED" | "ACCOUNT_LOCKED" | "IP_BLOCKED";
  retryAfter?: string | Date;
  lockedUntil?: Date;
  remainingTime?: number;
  remainingAttempts?: number;
  lockoutWarning?: string;
}
