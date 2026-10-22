import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLatestThrottle, type LatestThrottle } from '@/realtime/latest-throttle.js';

const WINDOW_MS = 1000;

describe('LatestThrottle', () => {
	let throttle: LatestThrottle;
	let calls: string[];
	const call = (label: string) => () => {
		calls.push(label);
	};

	beforeEach(() => {
		vi.useFakeTimers();
		throttle = createLatestThrottle(WINDOW_MS);
		calls = [];
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('runs a single call at once', () => {
		throttle.submit('k', call('a'));
		expect(calls).toEqual(['a']);

		vi.advanceTimersByTime(WINDOW_MS);
		expect(calls).toEqual(['a']);
	});

	it('runs the first call of a burst at once and the last at window end', () => {
		throttle.submit('k', call('false'));
		vi.advanceTimersByTime(100);
		throttle.submit('k', call('true'));
		expect(calls).toEqual(['false']);

		vi.advanceTimersByTime(WINDOW_MS - 101);
		expect(calls).toEqual(['false']);

		vi.advanceTimersByTime(1);
		expect(calls).toEqual(['false', 'true']);
	});

	it('replaces a pending call with a newer one', () => {
		throttle.submit('k', call('A'));
		throttle.submit('k', call('B'));
		throttle.submit('k', call('C'));

		vi.advanceTimersByTime(WINDOW_MS);
		expect(calls).toEqual(['A', 'C']);
	});

	it('opens a new window after a trailing run', () => {
		throttle.submit('k', call('A'));
		throttle.submit('k', call('B'));
		vi.advanceTimersByTime(WINDOW_MS);
		expect(calls).toEqual(['A', 'B']);

		throttle.submit('k', call('C'));
		expect(calls).toEqual(['A', 'B']);

		vi.advanceTimersByTime(WINDOW_MS);
		expect(calls).toEqual(['A', 'B', 'C']);
	});

	it('drops the pending call on cancel', () => {
		throttle.submit('k', call('A'));
		throttle.submit('k', call('B'));
		throttle.cancel('k');

		vi.advanceTimersByTime(WINDOW_MS * 2);
		expect(calls).toEqual(['A']);
		expect(vi.getTimerCount()).toBe(0);
	});

	it('runs a call after the window at once', () => {
		throttle.submit('k', call('A'));
		vi.advanceTimersByTime(WINDOW_MS);

		throttle.submit('k', call('B'));
		expect(calls).toEqual(['A', 'B']);
	});

	it('throttles keys independently', () => {
		throttle.submit('k1', call('k1-A'));
		throttle.submit('k2', call('k2-A'));
		expect(calls).toEqual(['k1-A', 'k2-A']);
	});
});
