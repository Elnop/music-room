import { createHash } from 'node:crypto';
import { redisClient, isRedisConnected } from '@/shared/config/redis.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';

const KEY_PREFIX = 'auth:revoked:';
const MIN_TTL_SECONDS = 1;

/** Stores SHA-256 hashes, never usable tokens. Fail-closed: without Redis, 503 REVOCATION_UNAVAILABLE. */

export async function revoke(token: string): Promise<void> {
	ensureRedis('revoke');
	try {
		await redisClient.setex(keyFor(token), ttlFor(token), '1');
	} catch (error) {
		throw unavailable('revoke', error);
	}
}

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

/** No signature check: authMiddleware already verified the token. At least MIN_TTL_SECONDS. */
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
