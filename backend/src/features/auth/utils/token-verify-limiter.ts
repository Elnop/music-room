import { redisClient, isRedisConnected } from '@/shared/config/redis.js';
import { rateLimitConfig } from '@/shared/config/rate-limit.config.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import type { SupabaseUser } from '@/features/auth/auth.types.js';

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
	return !isRedisConnected();
}

/** DECR only while the key exists: never recreate an expired key without TTL. */
const RELEASE_SCRIPT =
	"if redis.call('EXISTS', KEYS[1]) == 1 then return redis.call('DECR', KEYS[1]) end return 0";

function logRedisError(operation: string, ip: string, error: unknown): void {
	logger.error(`Token verification limiter could not ${operation}`, {
		ip,
		error: error instanceof Error ? error.message : 'Unknown error',
	});
}

/** ioredis `exec()` reports command errors per pair instead of throwing. */
function resultsOf(results: [Error | null, unknown][] | null): unknown[] {
	if (!results) throw new Error('Transaction aborted');
	return results.map(([error, value]) => {
		if (error) throw error;
		return value;
	});
}

interface Reservation {
	count: number;
	ttlMs: number;
}

/**
 * Reserve a slot for one verification before calling Supabase, so a parallel
 * burst cannot pass the limit: INCR, the window expiry set when the key is
 * created, atomically. Null when the limiter is skipped or Redis fails.
 */
export async function reserve(ip: string): Promise<Reservation | null> {
	if (isSkipped(ip)) return null;
	try {
		const key = keyFor(ip);
		const [, count, ttl] = resultsOf(
			await redisClient
				.multi()
				.set(key, '0', 'PX', rateLimitConfig.token.windowMs, 'NX')
				.incr(key)
				.pttl(key)
				.exec()
		);
		const ttlMs = Number(ttl);
		return {
			count: Number(count),
			ttlMs: ttlMs > 0 ? ttlMs : rateLimitConfig.token.windowMs,
		};
	} catch (error) {
		logRedisError('reserve a slot', ip, error);
		return null;
	}
}

/** Give back a reserved slot (refused, successful or not-counted verification). */
export async function release(ip: string): Promise<void> {
	if (isSkipped(ip)) return;
	try {
		await redisClient.eval(RELEASE_SCRIPT, 1, keyFor(ip));
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
export async function verifyTokenLimited(
	token: string,
	ip: string,
	verify: (token: string) => Promise<SupabaseUser>
): Promise<SupabaseUser> {
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
