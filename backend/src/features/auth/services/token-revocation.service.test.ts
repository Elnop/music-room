import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as service from '@/features/auth/services/token-revocation.service.js';
import { AppError } from '@/shared/middleware/error-handler.js';

const { setex, exists, isRedisConnected } = vi.hoisted(() => ({
	setex: vi.fn(),
	exists: vi.fn(),
	isRedisConnected: vi.fn(),
}));

vi.mock('@/shared/config/redis.js', () => ({
	redisClient: { setex, exists },
	isRedisConnected,
}));

const NOW_SECONDS = 1_800_000_000;

function jwt(payload: Record<string, unknown>): string {
	const part = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
	return `${part({ alg: 'HS256', typ: 'JWT' })}.${part(payload)}.signature`;
}

function hashOf(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

async function expectUnavailable(promise: Promise<unknown>): Promise<void> {
	const error: unknown = await promise.catch((e: unknown) => e);
	expect(error).toBeInstanceOf(AppError);
	expect(error).toMatchObject({ statusCode: 503, code: 'REVOCATION_UNAVAILABLE' });
}

describe('token-revocation.service', () => {
	beforeEach(() => {
		setex.mockReset().mockResolvedValue('OK');
		exists.mockReset();
		isRedisConnected.mockReset().mockReturnValue(true);
		vi.useFakeTimers();
		vi.setSystemTime(NOW_SECONDS * 1000);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('revoke', () => {
		it('stores a SHA-256 hash of the token, never the token', async () => {
			const token = jwt({ sub: 'user-a', exp: NOW_SECONDS + 600 });

			await service.revoke(token);

			const [key, , value] = setex.mock.calls[0] as [string, number, string];
			expect(key).toBe(`auth:revoked:${hashOf(token)}`);
			expect(key).not.toContain(token);
			expect(value).not.toContain(token);
		});

		it('sets the TTL to the remaining lifetime from exp', async () => {
			await service.revoke(jwt({ exp: NOW_SECONDS + 3600 }));

			expect(setex).toHaveBeenCalledWith(expect.any(String), 3600, expect.any(String));
		});

		it('uses a TTL of at least 1 second', async () => {
			await service.revoke(jwt({ exp: NOW_SECONDS - 30 }));
			await service.revoke(jwt({ exp: NOW_SECONDS }));
			await service.revoke('not-a-jwt');

			for (const call of setex.mock.calls) expect(call[1]).toBe(1);
		});

		it('throws 503 REVOCATION_UNAVAILABLE when Redis is not ready', async () => {
			isRedisConnected.mockReturnValue(false);

			await expectUnavailable(service.revoke(jwt({ exp: NOW_SECONDS + 60 })));
			expect(setex).not.toHaveBeenCalled();
		});

		it('throws 503 REVOCATION_UNAVAILABLE when the Redis command fails', async () => {
			setex.mockRejectedValue(new Error("Stream isn't writeable"));

			await expectUnavailable(service.revoke(jwt({ exp: NOW_SECONDS + 60 })));
		});
	});

	describe('isRevoked', () => {
		it('is true when the token hash is in the denylist', async () => {
			const token = jwt({ exp: NOW_SECONDS + 60 });
			exists.mockResolvedValue(1);

			await expect(service.isRevoked(token)).resolves.toBe(true);
			expect(exists).toHaveBeenCalledWith(`auth:revoked:${hashOf(token)}`);
		});

		it('is false when the token hash is not in the denylist', async () => {
			exists.mockResolvedValue(0);

			await expect(service.isRevoked(jwt({ exp: NOW_SECONDS + 60 }))).resolves.toBe(false);
		});

		it('throws 503 REVOCATION_UNAVAILABLE when Redis is not ready', async () => {
			isRedisConnected.mockReturnValue(false);

			await expectUnavailable(service.isRevoked(jwt({ exp: NOW_SECONDS + 60 })));
			expect(exists).not.toHaveBeenCalled();
		});

		it('throws 503 REVOCATION_UNAVAILABLE when the Redis command fails', async () => {
			exists.mockRejectedValue(new Error('Connection is closed.'));

			await expectUnavailable(service.isRevoked(jwt({ exp: NOW_SECONDS + 60 })));
		});
	});
});
