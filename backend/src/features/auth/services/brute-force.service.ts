import { redisClient, isRedisConnected } from "@/shared/config/redis.js";
import { rateLimitConfig } from "@/shared/config/rate-limit.config.js";
import { logger } from "@/shared/utils/logger.js";
import type {
  LockoutStatus,
  IPReputationStatus,
} from "@/shared/types/rate-limit.types.js";

/**
 * Brute Force Protection Service
 * Handles failed login attempt tracking, account lockouts, and IP reputation
 */
export class BruteForceProtectionService {
  /**
   * Record a failed login attempt for an email+IP combination
   * @returns Current lockout status
   */
  async recordFailedAttempt(
    email: string,
    ip: string,
  ): Promise<LockoutStatus> {
    if (!isRedisConnected() || !rateLimitConfig.lockout.enabled) {
      logger.warn("Brute force protection disabled (Redis unavailable or disabled)");
      return {
        isLocked: false,
        failedAttempts: 0,
        remainingAttempts: rateLimitConfig.lockout.threshold,
      };
    }

    try {
      const key = `failed_login:${email}:${ip}`;
      const attempts = await redisClient.incr(key);

      // Set expiry on first attempt (15 minutes window)
      if (attempts === 1) {
        await redisClient.expire(key, 15 * 60); // 15 minutes
      }

      logger.info("Failed login attempt recorded", {
        email,
        ip,
        attempts,
        threshold: rateLimitConfig.lockout.threshold,
      });

      // Check if lockout threshold reached
      if (attempts >= rateLimitConfig.lockout.threshold) {
        return await this.lockAccount(email, ip, attempts);
      }

      return {
        isLocked: false,
        failedAttempts: attempts,
        remainingAttempts: rateLimitConfig.lockout.threshold - attempts,
      };
    } catch (error) {
      logger.error("Error recording failed attempt", {
        error: error instanceof Error ? error.message : "Unknown error",
        email,
        ip,
      });
      return {
        isLocked: false,
        failedAttempts: 0,
        remainingAttempts: rateLimitConfig.lockout.threshold,
      };
    }
  }

  /**
   * Lock an account with progressive duration based on attempt count
   * @returns Lockout status with expiry time
   */
  async lockAccount(
    email: string,
    ip: string,
    attempts: number,
  ): Promise<LockoutStatus> {
    if (!isRedisConnected()) {
      return {
        isLocked: false,
        failedAttempts: attempts,
      };
    }

    try {
      // Determine lockout duration based on severity
      let lockDuration: number;
      let severity: string;

      if (attempts >= 10) {
        // Severe: 24 hours
        lockDuration = rateLimitConfig.lockout.durationSevere;
        severity = "severe";
      } else if (attempts >= 8) {
        // Hard: 1 hour
        lockDuration = rateLimitConfig.lockout.durationHard;
        severity = "hard";
      } else {
        // Soft: 15 minutes
        lockDuration = rateLimitConfig.lockout.durationSoft;
        severity = "soft";
      }

      const lockKey = `account_locked:${email}:${ip}`;
      await redisClient.setex(lockKey, lockDuration, attempts.toString());

      const lockedUntil = new Date(Date.now() + lockDuration * 1000);

      logger.warn("Account locked", {
        email,
        ip,
        attempts,
        severity,
        lockDuration,
        lockedUntil: lockedUntil.toISOString(),
      });

      return {
        isLocked: true,
        lockedUntil,
        remainingSeconds: lockDuration,
        failedAttempts: attempts,
      };
    } catch (error) {
      logger.error("Error locking account", {
        error: error instanceof Error ? error.message : "Unknown error",
        email,
        ip,
      });
      return {
        isLocked: false,
        failedAttempts: attempts,
      };
    }
  }

  /**
   * Reset failed attempts counter (called on successful login)
   */
  async resetFailedAttempts(email: string, ip: string): Promise<void> {
    if (!isRedisConnected()) {
      return;
    }

    try {
      const failedKey = `failed_login:${email}:${ip}`;
      const lockKey = `account_locked:${email}:${ip}`;

      const deleted = await Promise.all([
        redisClient.del(failedKey),
        redisClient.del(lockKey),
      ]);

      if (deleted[0] > 0 || deleted[1] > 0) {
        logger.info("Failed attempts reset", {
          email,
          ip,
          deletedFailed: deleted[0],
          deletedLock: deleted[1],
        });
      }
    } catch (error) {
      logger.error("Error resetting failed attempts", {
        error: error instanceof Error ? error.message : "Unknown error",
        email,
        ip,
      });
    }
  }

  /**
   * Check if an account is currently locked
   * @returns Current lockout status
   */
  async checkLockout(email: string, ip: string): Promise<LockoutStatus> {
    if (!isRedisConnected() || !rateLimitConfig.lockout.enabled) {
      return {
        isLocked: false,
        failedAttempts: 0,
        remainingAttempts: rateLimitConfig.lockout.threshold,
      };
    }

    try {
      const lockKey = `account_locked:${email}:${ip}`;
      const failedKey = `failed_login:${email}:${ip}`;

      const [isLocked, ttl, failedAttemptsStr] = await Promise.all([
        redisClient.exists(lockKey),
        redisClient.ttl(lockKey),
        redisClient.get(failedKey),
      ]);

      const failedAttempts = parseInt(failedAttemptsStr || "0");

      if (isLocked === 1 && ttl > 0) {
        const lockedUntil = new Date(Date.now() + ttl * 1000);

        return {
          isLocked: true,
          lockedUntil,
          remainingSeconds: ttl,
          failedAttempts,
        };
      }

      // Not locked, return current attempt count
      return {
        isLocked: false,
        failedAttempts,
        remainingAttempts: rateLimitConfig.lockout.threshold - failedAttempts,
      };
    } catch (error) {
      logger.error("Error checking lockout status", {
        error: error instanceof Error ? error.message : "Unknown error",
        email,
        ip,
      });
      return {
        isLocked: false,
        failedAttempts: 0,
        remainingAttempts: rateLimitConfig.lockout.threshold,
      };
    }
  }

  /**
   * Record IP-based failed login activity (across all accounts)
   * @returns IP reputation status
   */
  async recordIPActivity(ip: string): Promise<IPReputationStatus> {
    if (!isRedisConnected()) {
      return { status: "normal", count: 0 };
    }

    try {
      const key = `ip_failed_logins:${ip}`;
      const count = await redisClient.incr(key);

      // Set expiry on first failure (15 minutes window)
      if (count === 1) {
        await redisClient.expire(key, 15 * 60);
      }

      // Check reputation thresholds
      if (count >= rateLimitConfig.ipReputation.blacklistThreshold) {
        await this.blacklistIP(ip, 24 * 60 * 60); // 24 hours
        logger.error("IP blacklisted", {
          ip,
          count,
          threshold: rateLimitConfig.ipReputation.blacklistThreshold,
        });
        return { status: "blacklisted", count };
      } else if (count >= rateLimitConfig.ipReputation.blockThreshold) {
        logger.warn("IP blocked", {
          ip,
          count,
          threshold: rateLimitConfig.ipReputation.blockThreshold,
        });
        return { status: "blocked", count };
      } else if (count >= rateLimitConfig.ipReputation.throttleThreshold) {
        logger.warn("IP throttled", {
          ip,
          count,
          threshold: rateLimitConfig.ipReputation.throttleThreshold,
        });
        return { status: "throttled", count };
      }

      return { status: "normal", count };
    } catch (error) {
      logger.error("Error recording IP activity", {
        error: error instanceof Error ? error.message : "Unknown error",
        ip,
      });
      return { status: "normal", count: 0 };
    }
  }

  /**
   * Add an IP to the blacklist
   */
  async blacklistIP(ip: string, durationSeconds: number): Promise<void> {
    if (!isRedisConnected()) {
      return;
    }

    try {
      const blacklistKey = `ip_blacklist:${ip}`;
      await redisClient.setex(blacklistKey, durationSeconds, "1");

      logger.error("IP added to blacklist", {
        ip,
        durationSeconds,
        expiresAt: new Date(Date.now() + durationSeconds * 1000).toISOString(),
      });
    } catch (error) {
      logger.error("Error blacklisting IP", {
        error: error instanceof Error ? error.message : "Unknown error",
        ip,
      });
    }
  }

  /**
   * Check if an IP is blacklisted
   */
  async isIPBlacklisted(ip: string): Promise<boolean> {
    if (!isRedisConnected()) {
      return false;
    }

    try {
      const blacklistKey = `ip_blacklist:${ip}`;
      const exists = await redisClient.exists(blacklistKey);
      return exists === 1;
    } catch (error) {
      logger.error("Error checking IP blacklist", {
        error: error instanceof Error ? error.message : "Unknown error",
        ip,
      });
      return false;
    }
  }
}

// Export singleton instance
export const bruteForceService = new BruteForceProtectionService();
