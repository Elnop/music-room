import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '@/shared/utils/logger.js';
import { read, write } from '@/features/events/services/geocode-cache.service.js';

const { get, setex, isRedisConnected } = vi.hoisted(() => ({
	get: vi.fn(),
	setex: vi.fn(),
	isRedisConnected: vi.fn(),
}));

vi.mock('@/shared/config/redis.js', () => ({ redisClient: { get, setex }, isRedisConnected }));

const PLACE = { latitude: 48.9, longitude: 2.3, displayName: 'Paris' };
const KEY = `geocode:${createHash('sha256').update('96 bd bessières, paris').digest('hex')}`;
const WEEK = 7 * 24 * 3600;

describe('geocode-cache.service', () => {
	beforeEach(() => {
		get.mockReset().mockResolvedValue(null);
		setex.mockReset().mockResolvedValue('OK');
		isRedisConnected.mockReset().mockReturnValue(true);
		vi.spyOn(logger, 'warn').mockImplementation(() => logger);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('keys the trimmed, lowercased address with single spaces, for a week', async () => {
		await write('  96 BD   Bessières, Paris ', PLACE);
		await read('96 bd bessières, paris');

		expect(setex).toHaveBeenCalledWith(KEY, WEEK, JSON.stringify(PLACE));
		expect(get).toHaveBeenCalledWith(KEY);
	});

	it('stores and returns a "not found" as null', async () => {
		await write('Nowhere', null);
		expect(setex).toHaveBeenCalledWith(expect.any(String), WEEK, 'null');

		get.mockResolvedValue('null');
		await expect(read('Nowhere')).resolves.toBeNull();
	});

	it('returns a cached place', async () => {
		get.mockResolvedValue(JSON.stringify(PLACE));
		await expect(read('Paris')).resolves.toEqual(PLACE);
	});

	it.each([
		['missing', null],
		['corrupt', '{not json'],
		['of another shape', '{"lat":1}'],
	])('treats a %s entry as a miss', async (_case, raw) => {
		get.mockResolvedValue(raw);
		await expect(read('Paris')).resolves.toBeUndefined();
	});

	it('misses and skips writes without Redis', async () => {
		isRedisConnected.mockReturnValue(false);

		await expect(read('Paris')).resolves.toBeUndefined();
		await write('Paris', PLACE);
		expect(get).not.toHaveBeenCalled();
		expect(setex).not.toHaveBeenCalled();
	});

	it('misses when Redis throws, and never fails a write', async () => {
		get.mockRejectedValue(new Error('Connection is closed.'));
		setex.mockRejectedValue(new Error('Connection is closed.'));

		await expect(read('Paris')).resolves.toBeUndefined();
		await expect(write('Paris', PLACE)).resolves.toBeUndefined();
	});
});
