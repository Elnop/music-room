import { rateLimitConfig } from '@/shared/config/rate-limit.config.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import * as counter from '@/shared/security/counter.js';

const TOKEN_LIMIT_PREFIX = 'rl:auth:token:';

const COUNTED_CODES = new Set(['INVALID_TOKEN', 'TOKEN_REVOKED']);

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

export async function release(ip: string): Promise<void> {
	if (isSkipped(ip)) return;
	try {
		await counter.release(keyFor(ip));
	} catch (error) {
		logRedisError('release a slot', ip, error);
	}
}

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
