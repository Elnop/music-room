import { rateLimitConfig } from '@/shared/config/rate-limit.config.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import * as counter from '@/shared/security/counter.js';

/**
 * Limit on failed access token verifications per client IP (#160).
 *
 * Every authenticated request and socket handshake verifies its token with
 * Supabase (`supabase.auth.getUser`). Failed verifications are counted per IP
 * in Redis over a fixed window; once an IP reaches the limit, every token from
 * it is refused without calling Supabase until the window ends, valid or not
 * (telling them apart would need the very call the limit avoids).
 *
 * Redis only, no in-memory counting. While Redis is not ready the limiter
 * neither blocks nor counts: verifyToken fails closed on its own (503).
 * Disabled with RATE_LIMIT_ENABLED=false; whitelisted IPs are never counted.
 */

const TOKEN_LIMIT_PREFIX = 'rl:auth:token:';

/** Verification failures that count against the IP; a 503 does not. */
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

/** True when the limiter must neither block nor count this IP. */
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

/**
 * Reserve a slot for one verification before calling Supabase, so a parallel
 * burst cannot pass the limit: one atomic hit on the counter, the window
 * starting with the first. Null when the limiter is skipped or Redis fails.
 */
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

/** Give back a reserved slot (refused, successful or not-counted verification). */
export async function release(ip: string): Promise<void> {
	if (isSkipped(ip)) return;
	try {
		await counter.release(keyFor(ip));
	} catch (error) {
		logRedisError('release a slot', ip, error);
	}
}

/**
 * Verify a token through the limiter. A slot is reserved first; above the
 * limit it is released and TokenVerifyLimitError is thrown without calling
 * `verify`. A failure with code INVALID_TOKEN or TOKEN_REVOKED keeps the slot
 * (it is the count of failures); a success or any other failure releases it.
 * Side effect: more than `max` simultaneous verifications from one IP get a
 * transient refusal.
 */
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
