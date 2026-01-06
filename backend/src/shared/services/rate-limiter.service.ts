import { redisClient, isRedisConnected } from '@/shared/config/redis.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { rateLimitConfig } from '@/shared/config/rate-limit.config.js';
import type { RateLimitConfig, RateLimitResult } from '@/shared/types/rate-limit.types.js';

/**
 * Generic rate limiter service
 *
 * Redis-based rate limiting service for production use.
 * Can be disabled in development via RATE_LIMIT_ENABLED=false.
 *
 * Architecture decision: No in-memory fallback to avoid multi-instance security issues.
 * Redis down in production = fail-fast (service unavailable).
 */
export class RateLimiterService {
	/**
	 * Check if an action is within rate limit
	 *
	 * @param key - Unique key for rate limiting (e.g., "email:verify:userId:ip")
	 * @param config - Rate limit configuration
	 * @returns Rate limit result with canProceed flag
	 */
	async checkLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
		const { maxAttempts } = config;

		// Development mode: bypass rate limiting entirely
		if (!rateLimitConfig.enabled) {
			logger.debug('Rate limiting disabled (development mode)', { key });
			return { canProceed: true, attempts: 0 };
		}

		// Production mode: Redis required
		if (!isRedisConnected()) {
			logger.error('Rate limiting unavailable - Redis not connected', { key });
			throw new AppError(503, 'Service temporarily unavailable', 'REDIS_UNAVAILABLE');
		}

		return this.checkLimitRedis(key, maxAttempts);
	}

	/**
	 * Increment attempt counter and check rate limit
	 *
	 * @param key - Unique key for rate limiting
	 * @param config - Rate limit configuration
	 * @returns Rate limit result
	 * @throws AppError if rate limit exceeded
	 */
	async incrementAndCheck(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
		const result = await this.increment(key, config);

		if (result.attempts! > config.maxAttempts) {
			const remainingMinutes = Math.ceil(result.remainingSeconds! / 60);
			throw new AppError(
				429,
				`Rate limit exceeded. Please try again in ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`,
				'RATE_LIMIT_EXCEEDED'
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
	async increment(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
		const { maxAttempts, windowSeconds } = config;

		// Development mode: bypass rate limiting
		if (!rateLimitConfig.enabled) {
			logger.debug('Rate limiting disabled (development mode)', { key });
			return { canProceed: true, attempts: 0, remainingSeconds: 0 };
		}

		// Production mode: Redis required
		if (!isRedisConnected()) {
			logger.error('Rate limiting unavailable - Redis not connected', { key });
			throw new AppError(503, 'Service temporarily unavailable', 'REDIS_UNAVAILABLE');
		}

		return this.incrementRedis(key, maxAttempts, windowSeconds);
	}

	/**
	 * Reset rate limit for a key
	 *
	 * @param key - Unique key to reset
	 */
	async reset(key: string): Promise<void> {
		if (!rateLimitConfig.enabled) {
			logger.debug('Rate limiting disabled - skip reset', { key });
			return;
		}

		if (!isRedisConnected()) {
			logger.warn('Cannot reset rate limit - Redis not connected', { key });
			return;
		}

		await redisClient.del(key);
		logger.info('Rate limit reset', { key });
	}

	/**
	 * Get current attempt count for a key
	 *
	 * @param key - Unique key to check
	 * @returns Current attempt count
	 */
	async getAttempts(key: string): Promise<number> {
		if (!rateLimitConfig.enabled) {
			return 0;
		}

		if (!isRedisConnected()) {
			logger.warn('Cannot get attempts - Redis not connected', { key });
			return 0;
		}

		const count = await redisClient.get(key);
		return count ? parseInt(count) : 0;
	}

	/**
	 * Check rate limit using Redis
	 */
	private async checkLimitRedis(key: string, maxAttempts: number): Promise<RateLimitResult> {
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
		windowSeconds: number
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
}
