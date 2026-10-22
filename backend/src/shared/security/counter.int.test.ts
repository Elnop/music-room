import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const { connectRedis, disconnectRedis, isRedisConnected, redisClient } =
	await import('@/shared/config/redis.js');
const counter = await import('@/shared/security/counter.js');

// The shared counter's scripts against the test Redis (scripts/test-db.sh).

const prefix = `int:counter:${randomUUID()}:`;

describe('shared counter (test Redis)', () => {
	beforeAll(async () => {
		await connectRedis();
		if (!isRedisConnected()) throw new Error('Redis from scripts/test-db.sh is not reachable');
	});

	afterAll(async () => {
		try {
			if (isRedisConnected()) {
				const keys = await redisClient.keys(`${prefix}*`);
				if (keys.length > 0) await redisClient.del(...keys);
			}
		} finally {
			await disconnectRedis();
		}
	});

	it('starts a window on the first hit and keeps its end on the next ones', async () => {
		const key = `${prefix}hit`;

		await expect(counter.hit(key, 60_000)).resolves.toEqual({ count: 1, ttlMs: 60_000 });
		const second = await counter.hit(key, 60_000);

		expect(second.count).toBe(2);
		expect(second.ttlMs).toBeGreaterThan(0);
		expect(second.ttlMs).toBeLessThanOrEqual(60_000);
		expect(await redisClient.get(key)).toBe('2');
		expect(await redisClient.pttl(key)).toBeGreaterThan(0);
	});

	it('starts a new window when the key has no expiry', async () => {
		const key = `${prefix}no-expiry`;
		await redisClient.set(key, '7');

		await expect(counter.hit(key, 5_000)).resolves.toEqual({ count: 1, ttlMs: 5_000 });
	});

	it('reads a counter without counting, 0 and -2 when missing', async () => {
		const key = `${prefix}peek`;

		await expect(counter.peek(key)).resolves.toEqual({ count: 0, ttlMs: -2 });
		await counter.hit(key, 60_000);
		const state = await counter.peek(key);

		expect(state.count).toBe(1);
		expect(state.ttlMs).toBeGreaterThan(0);
	});

	it('releases a hit only while the window exists', async () => {
		const key = `${prefix}release`;

		await counter.release(key);
		expect(await redisClient.exists(key)).toBe(0);

		await counter.hit(key, 60_000);
		await counter.hit(key, 60_000);
		await counter.release(key);
		expect(await redisClient.get(key)).toBe('1');
	});

	it('sets, reads and clears a flag', async () => {
		const key = `${prefix}flag`;

		await expect(counter.readFlag(key)).resolves.toEqual({ isSet: false, ttlSeconds: -2 });
		await counter.setFlag(key, 900, '5');
		expect(await redisClient.get(key)).toBe('5');
		const flag = await counter.readFlag(key);
		expect(flag.isSet).toBe(true);
		expect(flag.ttlSeconds).toBeGreaterThan(890);

		await expect(counter.clear(key)).resolves.toBe(1);
		await expect(counter.clear(key)).resolves.toBe(0);
	});

	it('rounds seconds left as Redis TTL does', () => {
		expect(counter.toSeconds(-2)).toBe(0);
		expect(counter.toSeconds(400)).toBe(0);
		expect(counter.toSeconds(1_500)).toBe(2);
		expect(counter.toSeconds(59_999)).toBe(60);
	});
});
