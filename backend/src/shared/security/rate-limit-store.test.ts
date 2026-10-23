import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Options as RateLimitOptions } from 'express-rate-limit';
import { createRateLimitStore, type RateLimitStore } from '@/shared/security/rate-limit-store.js';
import { AppError } from '@/shared/middleware/error-handler.js';

const counter = vi.hoisted(() => ({
	isReady: vi.fn(),
	hit: vi.fn(),
	peek: vi.fn(),
	release: vi.fn(),
	clear: vi.fn(),
}));

vi.mock('@/shared/security/counter.js', () => counter);

const WINDOW_MS = 60_000;
const options = { windowMs: WINDOW_MS } as RateLimitOptions;

async function expectUnavailable(promise: unknown): Promise<void> {
	const error: unknown = await Promise.resolve(promise).catch((e: unknown) => e);
	expect(error).toBeInstanceOf(AppError);
	expect(error).toMatchObject({ statusCode: 503, code: 'RATE_LIMIT_UNAVAILABLE' });
}

const sent = () =>
	[counter.hit, counter.peek, counter.release, counter.clear].some(fn => fn.mock.calls.length > 0);

describe('createRateLimitStore', () => {
	let store: RateLimitStore;

	beforeEach(() => {
		for (const fn of Object.values(counter)) fn.mockReset();
		counter.isReady.mockReturnValue(true);
		counter.hit.mockResolvedValue({ count: 3, ttlMs: 42_000 });
		counter.peek.mockResolvedValue({ count: 3, ttlMs: 42_000 });
		counter.release.mockResolvedValue(undefined);
		counter.clear.mockResolvedValue(1);
		store = createRateLimitStore('auth:login');
		void store.init?.(options);
	});

	it('exposes a Redis prefix and shared keys', () => {
		expect(store.prefix).toBe('rl:auth:login:');
		expect(store.localKeys).toBe(false);
	});

	it('sends nothing to Redis on construction and init', () => {
		expect(sent()).toBe(false);
	});

	it('throws 503 and sends nothing while Redis is not ready', async () => {
		counter.isReady.mockReturnValue(false);

		await expectUnavailable(store.increment('k'));
		await expectUnavailable(store.get?.('k'));
		await expectUnavailable(store.resetKey('k'));
		await expect(store.decrement('k')).resolves.toBeUndefined();
		expect(sent()).toBe(false);
	});

	it('counts on the shared counter under the prefix, with the window', async () => {
		const before = Date.now();
		const result = await store.increment('k');

		expect(counter.hit).toHaveBeenCalledWith('rl:auth:login:k', WINDOW_MS);
		expect(result.totalHits).toBe(3);
		expect(result.resetTime?.getTime()).toBeGreaterThanOrEqual(before + 42_000);

		await expect(store.get?.('k')).resolves.toMatchObject({ totalHits: 3 });
		expect(counter.peek).toHaveBeenCalledWith('rl:auth:login:k');

		await store.decrement('k');
		expect(counter.release).toHaveBeenCalledWith('rl:auth:login:k');

		await store.resetKey('k');
		expect(counter.clear).toHaveBeenCalledWith('rl:auth:login:k');
	});

	it('answers undefined from get for a key that does not exist', async () => {
		counter.peek.mockResolvedValue({ count: 0, ttlMs: -2 });
		await expect(store.get?.('k')).resolves.toBeUndefined();
	});

	it('fails closed again when Redis drops, then resumes', async () => {
		await store.increment('k');
		counter.hit.mockClear();

		counter.isReady.mockReturnValue(false);
		await expectUnavailable(store.increment('k'));
		expect(counter.hit).not.toHaveBeenCalled();

		counter.isReady.mockReturnValue(true);
		await expect(store.increment('k')).resolves.toMatchObject({ totalHits: 3 });
	});

	it('turns a Redis command error into 503 and never rejects on decrement', async () => {
		counter.hit.mockRejectedValue(new Error('Connection is closed.'));
		counter.release.mockRejectedValue(new Error('Connection is closed.'));

		await expectUnavailable(store.increment('k'));
		await expect(store.decrement('k')).resolves.toBeUndefined();
	});
});
