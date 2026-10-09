import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';

const { multi, evalScript, isRedisConnected, config } = vi.hoisted(() => ({
	multi: vi.fn(),
	evalScript: vi.fn(),
	isRedisConnected: vi.fn(),
	config: {
		enabled: true,
		whitelist: [] as string[],
		token: { windowMs: 60_000, max: 3 },
	},
}));

vi.mock('@/shared/config/redis.js', () => ({
	redisClient: { multi, eval: evalScript },
	isRedisConnected,
}));

vi.mock('@/shared/config/rate-limit.config.js', () => ({ rateLimitConfig: config }));

const { reserve, release, verifyTokenLimited, TokenVerifyLimitError } =
	await import('@/features/auth/utils/token-verify-limiter.js');

const IP = '203.0.113.7';
const KEY = `rl:auth:token:${IP}`;
const USER = { id: 'user-a', email: 'a@example.com', role: 'authenticated' };

interface State {
	count: number | null;
	ttl: number;
}

type Pair = [Error | null, unknown];

/**
 * In-memory stand-in for the commands the limiter sends: MULTI with SET NX PX,
 * INCR and PTTL, and the release script (DECR only when the key exists).
 */
function fakeRedis(state: State) {
	const transactions: unknown[][][] = [];
	multi.mockImplementation(() => {
		const commands: unknown[][] = [];
		const tx = {
			set: (...args: unknown[]) => (commands.push(['set', ...args]), tx),
			incr: (key: string) => (commands.push(['incr', key]), tx),
			pttl: (key: string) => (commands.push(['pttl', key]), tx),
			exec: () =>
				Promise.resolve(
					commands.map(([command, , , , px]): Pair => {
						if (command === 'set') {
							if (state.count !== null) return [null, null];
							state.count = 0;
							state.ttl = px as number;
							return [null, 'OK'];
						}
						if (command === 'incr') {
							state.count = (state.count ?? 0) + 1;
							return [null, state.count];
						}
						return [null, state.count === null ? -2 : state.ttl];
					})
				),
		};
		transactions.push(commands);
		return tx;
	});
	evalScript.mockImplementation(() => {
		if (state.count === null) return Promise.resolve(0);
		state.count -= 1;
		return Promise.resolve(state.count);
	});
	return transactions;
}

const invalid = () => new AppError(401, 'Invalid or expired token', 'INVALID_TOKEN');

describe('token verification limiter', () => {
	let state: State;
	let transactions: unknown[][][];

	beforeEach(() => {
		multi.mockReset();
		evalScript.mockReset();
		isRedisConnected.mockReset().mockReturnValue(true);
		config.enabled = true;
		config.whitelist = [];
		state = { count: null, ttl: -2 };
		transactions = fakeRedis(state);
	});

	it('reserves under rl:auth:token: with the window as expiry, atomically', async () => {
		await expect(reserve(IP)).resolves.toEqual({ count: 1, ttlMs: 60_000 });

		expect(transactions).toEqual([
			[
				['set', KEY, '0', 'PX', 60_000, 'NX'],
				['incr', KEY],
				['pttl', KEY],
			],
		]);
		expect(state).toEqual({ count: 1, ttl: 60_000 });

		await release(IP);
		expect(evalScript).toHaveBeenCalledWith(expect.stringContaining('EXISTS'), 1, KEY);
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
		isRedisConnected.mockReturnValue(false);
		const failure = invalid();
		const verify = vi.fn().mockRejectedValue(failure);

		await expect(verifyTokenLimited('bad', IP, verify)).rejects.toBe(failure);
		await expect(reserve(IP)).resolves.toBeNull();
		await release(IP);
		expect(multi).not.toHaveBeenCalled();
		expect(evalScript).not.toHaveBeenCalled();
	});

	it('sends nothing to Redis when disabled', async () => {
		config.enabled = false;
		const verify = vi.fn().mockRejectedValue(invalid());

		await expect(verifyTokenLimited('bad', IP, verify)).rejects.toMatchObject({
			code: 'INVALID_TOKEN',
		});
		expect(multi).not.toHaveBeenCalled();
	});

	it('never blocks nor counts a whitelisted IP', async () => {
		config.whitelist = [IP];
		state.count = 100;
		const verify = vi.fn().mockRejectedValue(invalid());

		await expect(verifyTokenLimited('bad', IP, verify)).rejects.toMatchObject({
			code: 'INVALID_TOKEN',
		});
		expect(verify).toHaveBeenCalledTimes(1);
		expect(multi).not.toHaveBeenCalled();
	});

	it('lets the verification through when Redis throws', async () => {
		multi.mockImplementation(() => {
			throw new Error('Connection is closed.');
		});
		evalScript.mockRejectedValue(new Error('Connection is closed.'));
		const verify = vi.fn().mockResolvedValue(USER);

		await expect(verifyTokenLimited('good', IP, verify)).resolves.toEqual(USER);
		await expect(release(IP)).resolves.toBeUndefined();
	});

	it('treats a per-command error in exec() as a Redis error', async () => {
		const error = vi.spyOn(logger, 'error').mockImplementation(() => logger);
		state.count = 100;
		multi.mockImplementation(() => {
			const tx = {
				set: () => tx,
				incr: () => tx,
				pttl: () => tx,
				exec: () =>
					Promise.resolve([
						[null, null],
						[new Error('WRONGTYPE'), null],
						[null, 1000],
					]),
			};
			return tx;
		});
		const verify = vi.fn().mockResolvedValue(USER);

		await expect(reserve(IP)).resolves.toBeNull();
		await expect(verifyTokenLimited('good', IP, verify)).resolves.toEqual(USER);
		expect(error).toHaveBeenCalledWith(
			'Token verification limiter could not reserve a slot',
			expect.objectContaining({ error: 'WRONGTYPE' })
		);
		// No reservation: nothing to release.
		expect(evalScript).not.toHaveBeenCalled();
		error.mockRestore();
	});
});
