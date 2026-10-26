import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '@/shared/utils/logger.js';

const { hit, isReady } = vi.hoisted(() => ({ hit: vi.fn(), isReady: vi.fn() }));

vi.mock('@/shared/security/counter.js', () => ({ hit, isReady }));

const { takeUpstreamSlot } = await import('@/shared/security/upstream-slot.js');

const SLOT = { intervalMs: 1000, maxWaitMs: 3000 };

/** One window per key, ended by the fake clock, like counter.hit's script. */
function fakeWindow() {
	let count = 0;
	let endsAt = 0;
	hit.mockImplementation((_key: string, windowMs: number) => {
		const now = Date.now();
		if (now >= endsAt) {
			count = 1;
			endsAt = now + windowMs;
		} else {
			count += 1;
		}
		return Promise.resolve({ count, ttlMs: endsAt - now });
	});
}

describe('upstream slot', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		hit.mockReset();
		isReady.mockReset().mockReturnValue(true);
		fakeWindow();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('takes a free slot at once, under rl:upstream:<name>', async () => {
		await expect(takeUpstreamSlot('nominatim', SLOT)).resolves.toBeUndefined();
		expect(hit).toHaveBeenCalledWith('rl:upstream:nominatim', 1000);
	});

	it('spaces a burst one interval apart', async () => {
		const granted: number[] = [];
		const start = Date.now();
		const burst = [0, 1, 2].map(() =>
			takeUpstreamSlot('nominatim', SLOT).then(() => granted.push(Date.now() - start))
		);
		await vi.advanceTimersByTimeAsync(3000);
		await Promise.all(burst);

		expect(granted).toEqual([0, 1000, 2000]);
	});

	it('refuses with 429 once the wait would pass maxWaitMs', async () => {
		const warn = vi.spyOn(logger, 'warn').mockImplementation(() => logger);
		const tight = { intervalMs: 1000, maxWaitMs: 500 };
		await takeUpstreamSlot('nominatim', tight);

		await expect(takeUpstreamSlot('nominatim', tight)).rejects.toMatchObject({
			statusCode: 429,
			code: 'RATE_LIMIT_EXCEEDED',
		});
		warn.mockRestore();
	});

	it('fails closed with 503 while Redis is not ready', async () => {
		isReady.mockReturnValue(false);

		await expect(takeUpstreamSlot('nominatim', SLOT)).rejects.toMatchObject({
			statusCode: 503,
			code: 'RATE_LIMIT_UNAVAILABLE',
		});
		expect(hit).not.toHaveBeenCalled();
	});

	it('fails closed with 503 when Redis throws', async () => {
		const error = vi.spyOn(logger, 'error').mockImplementation(() => logger);
		hit.mockRejectedValue(new Error('Connection is closed.'));

		await expect(takeUpstreamSlot('nominatim', SLOT)).rejects.toMatchObject({
			statusCode: 503,
			code: 'RATE_LIMIT_UNAVAILABLE',
		});
		error.mockRestore();
	});
});
