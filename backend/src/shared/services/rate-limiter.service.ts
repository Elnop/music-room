import { redisClient, isRedisConnected } from "@/shared/config/redis.js";
import { AppError } from "@/shared/middleware/error-handler.js";
import { logger } from "@/shared/utils/logger.js";
import type {
  RateLimitConfig,
  RateLimitResult,
} from "@/shared/types/rate-limit.types.js";

/**
 * Generic rate limiter service
 *
 * Shared rate limiting service using Redis (with in-memory fallback).
 * Can be used for any feature requiring rate limiting (email, API calls, auth, etc.).
 *
 * Moved from features/mail to shared/services for reusability.
 */
export class RateLimiterService {
  /**
   * In-memory fallback storage when Redis is unavailable
   * Structure: Map<key, { count: number, expiresAt: number }>
   */
  private inMemoryStore: Map<string, { count: number; expiresAt: number }> =
    new Map();

  /**
   * Check if an action is within rate limit
   *
   * @param key - Unique key for rate limiting (e.g., "email:verify:userId:ip")
   * @param config - Rate limit configuration
   * @returns Rate limit result with canProceed flag
   */
  async checkLimit(
    key: string,
    config: RateLimitConfig,
  ): Promise<RateLimitResult> {
    const { maxAttempts } = config;

    if (isRedisConnected()) {
      return this.checkLimitRedis(key, maxAttempts);
    } else {
      return this.checkLimitMemory(key, maxAttempts);
    }
  }

  /**
   * Increment attempt counter and check rate limit
   *
   * @param key - Unique key for rate limiting
   * @param config - Rate limit configuration
   * @returns Rate limit result
   * @throws AppError if rate limit exceeded
   */
  async incrementAndCheck(
    key: string,
    config: RateLimitConfig,
  ): Promise<RateLimitResult> {
    const result = await this.increment(key, config);

    if (result.attempts! > config.maxAttempts) {
      const remainingMinutes = Math.ceil(result.remainingSeconds! / 60);
      throw new AppError(
        429,
        `Rate limit exceeded. Please try again in ${remainingMinutes} minute${remainingMinutes > 1 ? "s" : ""}.`,
        "RATE_LIMIT_EXCEEDED",
      );
    }

    return result;
  }

  /**
   * Increment attempt counter without throwing
   *
   * @param key - Unique key for rate limiting
   * @param config - Rate limit configuration
   * @returns Rate limit result with attempt count
   */
  async increment(
    key: string,
    config: RateLimitConfig,
  ): Promise<RateLimitResult> {
    const { maxAttempts, windowSeconds } = config;

    if (isRedisConnected()) {
      return this.incrementRedis(key, maxAttempts, windowSeconds);
    } else {
      return this.incrementMemory(key, maxAttempts, windowSeconds);
    }
  }

  /**
   * Reset rate limit for a key
   *
   * @param key - Unique key to reset
   */
  async reset(key: string): Promise<void> {
    if (isRedisConnected()) {
      await redisClient.del(key);
    } else {
      this.inMemoryStore.delete(key);
    }

    logger.info("Rate limit reset", { key });
  }

  /**
   * Get current attempt count for a key
   *
   * @param key - Unique key to check
   * @returns Current attempt count
   */
  async getAttempts(key: string): Promise<number> {
    if (isRedisConnected()) {
      const count = await redisClient.get(key);
      return count ? parseInt(count) : 0;
    } else {
      const entry = this.inMemoryStore.get(key);
      if (!entry || entry.expiresAt < Date.now()) {
        return 0;
      }
      return entry.count;
    }
  }

  /**
   * Check rate limit using Redis
   */
  private async checkLimitRedis(
    key: string,
    maxAttempts: number,
  ): Promise<RateLimitResult> {
    const count = await redisClient.get(key);
    const attempts = count ? parseInt(count) : 0;

    if (attempts >= maxAttempts) {
      const ttl = await redisClient.ttl(key);
      return {
        canProceed: false,
        remainingSeconds: ttl > 0 ? ttl : 0,
        attempts,
      };
    }

    return { canProceed: true, attempts };
  }

  /**
   * Increment counter using Redis
   */
  private async incrementRedis(
    key: string,
    maxAttempts: number,
    windowSeconds: number,
  ): Promise<RateLimitResult> {
    const attempts = await redisClient.incr(key);

    if (attempts === 1) {
      await redisClient.expire(key, windowSeconds);
    }

    const ttl = await redisClient.ttl(key);

    return {
      canProceed: attempts <= maxAttempts,
      remainingSeconds: ttl > 0 ? ttl : 0,
      attempts,
    };
  }

  /**
   * Check rate limit using in-memory storage
   */
  private checkLimitMemory(
    key: string,
    maxAttempts: number,
  ): RateLimitResult {
    this.cleanupExpiredMemory();

    const entry = this.inMemoryStore.get(key);
    const now = Date.now();

    if (!entry || entry.expiresAt < now) {
      return { canProceed: true, attempts: 0 };
    }

    if (entry.count >= maxAttempts) {
      const remainingSeconds = Math.ceil((entry.expiresAt - now) / 1000);
      return {
        canProceed: false,
        remainingSeconds,
        attempts: entry.count,
      };
    }

    return { canProceed: true, attempts: entry.count };
  }

  /**
   * Increment counter using in-memory storage
   */
  private incrementMemory(
    key: string,
    maxAttempts: number,
    windowSeconds: number,
  ): RateLimitResult {
    this.cleanupExpiredMemory();

    const entry = this.inMemoryStore.get(key);
    const now = Date.now();
    const expiresAt = now + windowSeconds * 1000;

    if (!entry || entry.expiresAt < now) {
      this.inMemoryStore.set(key, { count: 1, expiresAt });
      return { canProceed: true, remainingSeconds: windowSeconds, attempts: 1 };
    }

    entry.count++;
    const remainingSeconds = Math.ceil((entry.expiresAt - now) / 1000);

    return {
      canProceed: entry.count <= maxAttempts,
      remainingSeconds,
      attempts: entry.count,
    };
  }

  /**
   * Cleanup expired entries from in-memory storage
   */
  private cleanupExpiredMemory(): void {
    const now = Date.now();
    for (const [key, entry] of this.inMemoryStore.entries()) {
      if (entry.expiresAt < now) {
        this.inMemoryStore.delete(key);
      }
    }
  }
}
