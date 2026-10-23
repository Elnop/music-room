import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';

const {
	hit,
	release: releaseHit,
	isReady,
	config,
} = vi.hoisted(() => ({
	hit: vi.fn(),
	release: vi.fn(),
	isReady: vi.fn(),
	config: {
		enabled: true,
		whitelist: [] as string[],
		token: { windowMs: 60_000, max: 3 },
	},
}));

vi.mock('@/shared/security/counter.js', () => ({ hit, release: releaseHit, isReady }));

vi.mock('@/shared/config/rate-limit.config.js', () => ({ rateLimitConfig: config }));

const { reserve, release, verifyTokenLimited, TokenVerifyLimitError } =
	await import('@/shared/security/token-verify-limit.js');

const IP = '203.0.113.7';
const KEY = `rl:auth:token:${IP}`;
const USER = { id: 'user-a', email: 'a@example.com', role: 'authenticated' };

interface State {
	count: number | null;
	ttl: number;
}

/** In-memory stand-in for counter.ts: release decrements only an existing key. */
function fakeCounter(state: State) {
	hit.mockImplementation((_key: string, windowMs: number) => {
		if (state.count === null) {
			state.count = 1;
			state.ttl = windowMs;
			return Promise.resolve({ count: 1, ttlMs: windowMs });
		}
		state.count += 1;
		return Promise.resolve({ count: state.count, ttlMs: state.ttl });
	});
	releaseHit.mockImplementation(() => {
		if (state.count !== null) state.count -= 1;
		return Promise.resolve();
	});
}

const invalid = () => new AppError(401, 'Invalid or expired token', 'INVALID_TOKEN');

describe('token verification limiter', () => {
	let state: State;

	beforeEach(() => {
		hit.mockReset();
		releaseHit.mockReset();
		isReady.mockReset().mockReturnValue(true);
		config.enabled = true;
		config.whitelist = [];
		state = { count: null, ttl: -2 };
		fakeCounter(state);
	});

	it('reserves under rl:auth:token: with the window as expiry, in one hit', async () => {
		await expect(reserve(IP)).resolves.toEqual({ count: 1, ttlMs: 60_000 });

		expect(hit).toHaveBeenCalledTimes(1);
		expect(hit).toHaveBeenCalledWith(KEY, 60_000);
		expect(state).toEqual({ count: 1, ttl: 60_000 });

		await release(IP);
		expect(releaseHit).toHaveBeenCalledWith(KEY);
		expect(state.count).toBe(0);
	});

	it('does not recreate an expired key on release', async () => {
		await release(IP);
		expect(state.count).toBeNull();
	});

	it('passes a valid token and leaves the counter unchanged', async () => {
		state.count = 2;
		state.ttl = 10_000;
		const verify = vi.fn().mockResolvedValue(USER);

		await expect(verifyTokenLimited('good', IP, verify)).resolves.toEqual(USER);
		expect(verify).toHaveBeenCalledWith('good');
		expect(state.count).toBe(2);
	});

	it.each(['INVALID_TOKEN', 'TOKEN_REVOKED'])('counts a %s failure and rethrows it', async code => {
		const failure = new AppError(401, 'refused', code);
		const verify = vi.fn().mockRejectedValue(failure);

		await expect(verifyTokenLimited('bad', IP, verify)).rejects.toBe(failure);
		expect(state.count).toBe(1);
	});

	it('does not count a 503 REVOCATION_UNAVAILABLE', async () => {
		const failure = new AppError(503, 'unavailable', 'REVOCATION_UNAVAILABLE');
		const verify = vi.fn().mockRejectedValue(failure);

		await expect(verifyTokenLimited('t', IP, verify)).rejects.toBe(failure);
		expect(state.count).toBe(0);
	});

	it('refuses a blocked IP without calling verify, with the time left', async () => {
		state.count = 3;
		state.ttl = 42_000;
		const verify = vi.fn().mockResolvedValue(USER);

		const error: unknown = await verifyTokenLimited('good', IP, verify).catch((e: unknown) => e);

		expect(error).toBeInstanceOf(TokenVerifyLimitError);
		expect(error).toMatchObject({
			statusCode: 429,
			code: 'RATE_LIMIT_EXCEEDED',
			retryAfterMs: 42_000,
		});
		expect(verify).not.toHaveBeenCalled();
		// The refused reservation is given back.
		expect(state.count).toBe(3);
	});

	it('lets at most max of a parallel burst of invalid tokens reach verify', async () => {
		const verify = vi.fn(
			() =>
				new Promise<never>((_resolve, reject) => {
					setTimeout(() => reject(invalid()), 10);
				})
		);

		const results = await Promise.allSettled(
			Array.from({ length: 10 }, (_, i) => verifyTokenLimited(`bad-${i}`, IP, verify))
		);

		expect(verify).toHaveBeenCalledTimes(config.token.max);
		const limited = results.filter(
			r => r.status === 'rejected' && r.reason instanceof TokenVerifyLimitError
		);
		expect(limited).toHaveLength(10 - config.token.max);
		expect(state.count).toBe(config.token.max);
	});

	it('blocks after max failures, then verifies again once the window ends', async () => {
		const verify = vi.fn().mockRejectedValue(invalid());
		for (let i = 0; i < config.token.max; i++) {
			await expect(verifyTokenLimited('bad', IP, verify)).rejects.toMatchObject({
				code: 'INVALID_TOKEN',
			});
		}
		await expect(verifyTokenLimited('bad', IP, verify)).rejects.toBeInstanceOf(
			TokenVerifyLimitError
		);
		expect(verify).toHaveBeenCalledTimes(config.token.max);

		// Window over: the key expired.
		state.count = null;
		verify.mockResolvedValue(USER);
		await expect(verifyTokenLimited('good', IP, verify)).resolves.toEqual(USER);
	});

	it('sends nothing to Redis while it is not ready: neither blocks nor counts', async () => {
		isReady.mockReturnValue(false);
		const failure = invalid();
		const verify = vi.fn().mockRejectedValue(failure);

		await expect(verifyTokenLimited('bad', IP, verify)).rejects.toBe(failure);
		await expect(reserve(IP)).resolves.toBeNull();
		await release(IP);
		expect(hit).not.toHaveBeenCalled();
		expect(releaseHit).not.toHaveBeenCalled();
	});

	it('sends nothing to Redis when disabled', async () => {
		config.enabled = false;
		const verify = vi.fn().mockRejectedValue(invalid());

		await expect(verifyTokenLimited('bad', IP, verify)).rejects.toMatchObject({
			code: 'INVALID_TOKEN',
		});
		expect(hit).not.toHaveBeenCalled();
	});

	it('never blocks nor counts a whitelisted IP', async () => {
		config.whitelist = [IP];
		state.count = 100;
		const verify = vi.fn().mockRejectedValue(invalid());

		await expect(verifyTokenLimited('bad', IP, verify)).rejects.toMatchObject({
			code: 'INVALID_TOKEN',
		});
		expect(verify).toHaveBeenCalledTimes(1);
		expect(hit).not.toHaveBeenCalled();
	});

	it('lets the verification through when Redis throws', async () => {
		const error = vi.spyOn(logger, 'error').mockImplementation(() => logger);
		hit.mockRejectedValue(new Error('Connection is closed.'));
		releaseHit.mockRejectedValue(new Error('Connection is closed.'));
		const verify = vi.fn().mockResolvedValue(USER);

		await expect(reserve(IP)).resolves.toBeNull();
		await expect(verifyTokenLimited('good', IP, verify)).resolves.toEqual(USER);
		await expect(release(IP)).resolves.toBeUndefined();
		expect(error).toHaveBeenCalledWith(
			'Token verification limiter could not reserve a slot',
			expect.objectContaining({ error: 'Connection is closed.' })
		);
		error.mockRestore();
	});
});
