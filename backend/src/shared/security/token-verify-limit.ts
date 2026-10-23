import { rateLimitConfig } from '@/shared/config/rate-limit.config.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import * as counter from '@/shared/security/counter.js';

// At the limit every token from the IP is refused without calling Supabase, valid or not: telling
// them apart would need the very call the limit avoids. Redis down: neither blocks nor counts.

const TOKEN_LIMIT_PREFIX = 'rl:auth:token:';

/** A 503 does not count. */
const COUNTED_CODES = new Set(['INVALID_TOKEN', 'TOKEN_REVOKED']);

/** Thrown instead of verifying when the IP has reached the limit. */
export class TokenVerifyLimitError extends AppError {
	constructor(public retryAfterMs: number) {
		super(
			429,
			'Too many failed authentication attempts. Please try again later.',
			'RATE_LIMIT_EXCEEDED'
		);
		this.name = 'TokenVerifyLimitError';
	}
}

function keyFor(ip: string): string {
	return TOKEN_LIMIT_PREFIX + ip;
}

function isSkipped(ip: string): boolean {
	if (!rateLimitConfig.enabled) return true;
	if (rateLimitConfig.whitelist.includes(ip)) return true;
	return !counter.isReady();
}

function logRedisError(operation: string, ip: string, error: unknown): void {
	logger.error(`Token verification limiter could not ${operation}`, {
		ip,
		error: error instanceof Error ? error.message : 'Unknown error',
	});
}

interface Reservation {
	count: number;
	ttlMs: number;
}

/** Reserved before calling Supabase so a parallel burst cannot pass the limit. Null when skipped or Redis fails. */
export async function reserve(ip: string): Promise<Reservation | null> {
	if (isSkipped(ip)) return null;
	try {
		const { count, ttlMs } = await counter.hit(keyFor(ip), rateLimitConfig.token.windowMs);
		return { count, ttlMs: ttlMs > 0 ? ttlMs : rateLimitConfig.token.windowMs };
	} catch (error) {
		logRedisError('reserve a slot', ip, error);
		return null;
	}
}

/** Refused, successful or not-counted verification. */
export async function release(ip: string): Promise<void> {
	if (isSkipped(ip)) return;
	try {
		await counter.release(keyFor(ip));
	} catch (error) {
		logRedisError('release a slot', ip, error);
	}
}

/** A failure counted against the IP keeps its slot; more than `max` parallel verifications from one IP get a transient refusal. */
export async function verifyTokenLimited<User>(
	token: string,
	ip: string,
	verify: (token: string) => Promise<User>
): Promise<User> {
	const reservation = await reserve(ip);
	if (reservation && reservation.count > rateLimitConfig.token.max) {
		await release(ip);
		logger.warn('Token verification rate limit exceeded', {
			ip,
			retryAfterMs: reservation.ttlMs,
		});
		throw new TokenVerifyLimitError(reservation.ttlMs);
	}

	try {
		const user = await verify(token);
		if (reservation) await release(ip);
		return user;
	} catch (error) {
		const counted = error instanceof AppError && !!error.code && COUNTED_CODES.has(error.code);
		if (reservation && !counted) await release(ip);
		throw error;
	}
}
