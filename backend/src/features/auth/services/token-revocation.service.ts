import { createHash } from 'node:crypto';
import { redisClient, isRedisConnected } from '@/shared/config/redis.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';

const KEY_PREFIX = 'auth:revoked:';
const MIN_TTL_SECONDS = 1;

/**
 * Denylist of access tokens revoked by a logout, kept in Redis until each
 * token's own expiry. Stores a SHA-256 hash, never the token itself, so the
 * denylist is not a store of usable credentials.
 *
 * Fail-closed: without a ready Redis, both operations throw 503
 * REVOCATION_UNAVAILABLE. No in-memory fallback.
 */

/** Add a token to the denylist until its `exp`. */
export async function revoke(token: string): Promise<void> {
	ensureRedis('revoke');
	try {
		await redisClient.setex(keyFor(token), ttlFor(token), '1');
	} catch (error) {
		throw unavailable('revoke', error);
	}
}

/** Whether a token was revoked by a logout. */
export async function isRevoked(token: string): Promise<boolean> {
	ensureRedis('check');
	try {
		return (await redisClient.exists(keyFor(token))) === 1;
	} catch (error) {
		throw unavailable('check', error);
	}
}

function ensureRedis(operation: string): void {
	if (!isRedisConnected()) {
		throw unavailable(operation, new Error('Redis not connected'));
	}
}

function keyFor(token: string): string {
	return KEY_PREFIX + createHash('sha256').update(token).digest('hex');
}

/**
 * Remaining lifetime of the token in seconds, read from the JWT `exp`
 * (base64url payload). The token was already verified by authMiddleware, so
 * no signature check here. At least MIN_TTL_SECONDS.
 */
function ttlFor(token: string): number {
	const exp = readExp(token);
	if (exp === undefined) return MIN_TTL_SECONDS;
	return Math.max(MIN_TTL_SECONDS, exp - Math.floor(Date.now() / 1000));
}

function readExp(token: string): number | undefined {
	const payload = token.split('.')[1];
	if (!payload) return undefined;
	try {
		const decoded: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
		if (decoded && typeof decoded === 'object' && 'exp' in decoded) {
			return typeof decoded.exp === 'number' ? decoded.exp : undefined;
		}
		return undefined;
	} catch {
		return undefined;
	}
}

function unavailable(operation: string, error: unknown): AppError {
	logger.error('Token revocation unavailable', {
		operation,
		error: error instanceof Error ? error.message : 'Unknown error',
	});
	return new AppError(503, 'Session revocation is unavailable', 'REVOCATION_UNAVAILABLE');
}
