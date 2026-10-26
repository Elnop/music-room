import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as cache from '@/features/soundcloud/utils/soundcloud-cache.js';

const T0 = new Date('2026-01-01T00:00:00.000Z');

describe('soundcloud-cache', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(T0);
		cache.clear();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns null for a missing key', () => {
		expect(cache.get('missing')).toBeNull();
	});

	it('returns a stored value before its TTL', () => {
		cache.set('k', { a: 1 }, 10);
		expect(cache.get<{ a: number }>('k')).toEqual({ a: 1 });
	});

	it('still serves the value at exactly the TTL', () => {
		cache.set('k', 'v', 10);
		vi.setSystemTime(T0.getTime() + 10_000);
		expect(cache.get('k')).toBe('v');
	});

	it('expires the value 1 ms after the TTL and drops it', () => {
		cache.set('k', 'v', 10);
		vi.setSystemTime(T0.getTime() + 10_001);
		expect(cache.get('k')).toBeNull();
		expect(cache.size()).toBe(0);
	});

	it('counts entries and clears them', () => {
		cache.set('a', 1, 10);
		cache.set('b', 2, 10);
		expect(cache.size()).toBe(2);
		cache.clear();
		expect(cache.size()).toBe(0);
		expect(cache.get('a')).toBeNull();
	});
});
