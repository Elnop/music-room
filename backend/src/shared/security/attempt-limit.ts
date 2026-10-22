import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { rateLimitConfig } from '@/shared/config/rate-limit.config.js';
import * as counter from '@/shared/security/counter.js';
import type { RateLimitConfig, RateLimitResult } from '@/shared/security/security.types.js';

/**
 * Attempt counters for one action (a code check, a resend), keyed by the
 * caller: at most `maxAttempts` in a window of `windowSeconds`.
 *
 * Fail closed: while Redis is not ready, counting or checking answers 503
 * REDIS_UNAVAILABLE. Disabled with RATE_LIMIT_ENABLED=false (nothing counts).
 */

function requireRedis(key: string): void {
	if (!counter.isReady()) {
		logger.error('Rate limiting unavailable - Redis not connected', { key });
		throw new AppError(503, 'Service temporarily unavailable', 'REDIS_UNAVAILABLE');
	}
}

/** Whether one more attempt is allowed, without counting it. */
export async function checkLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
	if (!rateLimitConfig.enabled) {
		logger.debug('Rate limiting disabled (development mode)', { key });
		return { canProceed: true, attempts: 0 };
	}
	requireRedis(key);

	const { count: attempts, ttlMs } = await counter.peek(key);
	if (attempts >= config.maxAttempts) {
		return { canProceed: false, remainingSeconds: counter.toSeconds(ttlMs), attempts };
	}
	return { canProceed: true, attempts };
}

/** Count one attempt, without throwing past the limit. */
export async function increment(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
	if (!rateLimitConfig.enabled) {
		logger.debug('Rate limiting disabled (development mode)', { key });
		return { canProceed: true, attempts: 0, remainingSeconds: 0 };
	}
	requireRedis(key);

	const { count: attempts, ttlMs } = await counter.hit(key, config.windowSeconds * 1000);
	return {
		canProceed: attempts <= config.maxAttempts,
		remainingSeconds: counter.toSeconds(ttlMs),
		attempts,
	};
}

/** Count one attempt: 429 RATE_LIMIT_EXCEEDED past the limit. */
export async function incrementAndCheck(
	key: string,
	config: RateLimitConfig
): Promise<RateLimitResult> {
	const result = await increment(key, config);

	if ((result.attempts ?? 0) > config.maxAttempts) {
		const remainingMinutes = Math.ceil((result.remainingSeconds ?? 0) / 60);
		throw new AppError(
			429,
			`Rate limit exceeded. Please try again in ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`,
			'RATE_LIMIT_EXCEEDED'
		);
	}

	return result;
}

/** Forget the attempts of a key (after a success). Skipped while Redis is down. */
export async function reset(key: string): Promise<void> {
	if (!rateLimitConfig.enabled) {
		logger.debug('Rate limiting disabled - skip reset', { key });
		return;
	}
	if (!counter.isReady()) {
		logger.warn('Cannot reset rate limit - Redis not connected', { key });
		return;
	}

	await counter.clear(key);
	logger.info('Rate limit reset', { key });
}

/** Attempts counted so far; 0 while Redis is down. */
export async function getAttempts(key: string): Promise<number> {
	if (!rateLimitConfig.enabled) return 0;
	if (!counter.isReady()) {
		logger.warn('Cannot get attempts - Redis not connected', { key });
		return 0;
	}

	return (await counter.peek(key)).count;
}
