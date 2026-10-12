import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Options as RateLimitOptions } from 'express-rate-limit';
import { RedisRateLimitStore } from '@/features/auth/utils/redis-rate-limit-store.js';
import { AppError } from '@/shared/middleware/error-handler.js';

const { call, isRedisConnected } = vi.hoisted(() => ({
	call: vi.fn(),
	isRedisConnected: vi.fn(),
}));

vi.mock('@/shared/config/redis.js', () => ({
	redisClient: { call },
	isRedisConnected,
}));

const WINDOW_MS = 60_000;
const options = { windowMs: WINDOW_MS } as RateLimitOptions;

// Minimal Redis behaviour for the commands rate-limit-redis sends.
function fakeRedis(...args: string[]): Promise<unknown> {
	const [command] = args;
	if (command === 'SCRIPT') return Promise.resolve('sha');
	if (command === 'EVALSHA') return Promise.resolve([3, WINDOW_MS]);
	return Promise.resolve(1);
}

async function expectUnavailable(promise: Promise<unknown>): Promise<void> {
	const error: unknown = await promise.catch((e: unknown) => e);
	expect(error).toBeInstanceOf(AppError);
	expect(error).toMatchObject({ statusCode: 503, code: 'RATE_LIMIT_UNAVAILABLE' });
}

describe('RedisRateLimitStore', () => {
	let store: RedisRateLimitStore;

	beforeEach(() => {
		call.mockReset().mockImplementation(fakeRedis);
		isRedisConnected.mockReset().mockReturnValue(true);
		store = new RedisRateLimitStore('auth:login');
		store.init(options);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('exposes a Redis prefix and shared keys', () => {
		expect(store.prefix).toBe('rl:auth:login:');
		expect(store.localKeys).toBe(false);
	});

	it('sends nothing to Redis on construction and init', () => {
		expect(call).not.toHaveBeenCalled();
	});

	it('throws 503 and sends nothing while Redis is not ready', async () => {
		isRedisConnected.mockReturnValue(false);

		await expectUnavailable(store.increment('k'));
		await expectUnavailable(store.get('k'));
		await expectUnavailable(store.resetKey('k'));
		await expect(store.decrement('k')).resolves.toBeUndefined();
		expect(call).not.toHaveBeenCalled();
	});

	it('creates the Redis store on first use once ready and delegates to it', async () => {
		const result = await store.increment('k');

		expect(result.totalHits).toBe(3);
		expect(call).toHaveBeenCalledWith(
			'EVALSHA',
			'sha',
			'1',
			'rl:auth:login:k',
			'0',
			String(WINDOW_MS)
		);

		await store.get('k');
		expect(call).toHaveBeenCalledWith('EVALSHA', 'sha', '1', 'rl:auth:login:k');

		await store.decrement('k');
		expect(call).toHaveBeenCalledWith('DECR', 'rl:auth:login:k');

		await store.resetKey('k');
		expect(call).toHaveBeenCalledWith('DEL', 'rl:auth:login:k');

		// The scripts are loaded once, by the single store created.
		expect(call.mock.calls.filter(([command]) => command === 'SCRIPT')).toHaveLength(2);
	});

	it('fails closed again when Redis drops after creation, then resumes', async () => {
		await store.increment('k');
		call.mockClear();

		isRedisConnected.mockReturnValue(false);
		await expectUnavailable(store.increment('k'));
		expect(call).not.toHaveBeenCalled();

		isRedisConnected.mockReturnValue(true);
		await expect(store.increment('k')).resolves.toMatchObject({ totalHits: 3 });
	});

	it('turns a Redis command error into 503 and never rejects on decrement', async () => {
		await store.increment('k');
		call.mockRejectedValue(new Error('Connection is closed.'));

		await expectUnavailable(store.increment('k'));
		await expect(store.decrement('k')).resolves.toBeUndefined();
	});

	it('does not leave an unhandled rejection when script loading fails', async () => {
		const unhandled = vi.fn();
		process.on('unhandledRejection', unhandled);
		call.mockRejectedValue(new Error('Connection is closed.'));

		await expectUnavailable(store.increment('k'));
		await new Promise(resolve => setTimeout(resolve, 0));

		process.off('unhandledRejection', unhandled);
		expect(unhandled).not.toHaveBeenCalled();
	});
});
