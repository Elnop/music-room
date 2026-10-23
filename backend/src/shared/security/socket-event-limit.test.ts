import { describe, expect, it } from 'vitest';
import {
	RATE_LIMITED,
	rateLimitedErrorFor,
	createSocketEventLimiter,
} from '@/shared/security/socket-event-limit.js';

describe('createSocketEventLimiter', () => {
	const limits = { 'a:x': { max: 2, windowMs: 1000 }, 'b:y': { max: 2, windowMs: 1000 } };

	function limiter() {
		let now = 0;
		const check = createSocketEventLimiter(limits, { max: 1, windowMs: 1000 }, () => now);
		return { instance: { check }, advance: (ms: number) => (now += ms) };
	}

	it('refuses past the limit, says limited once, then allows again in the next window', () => {
		const { instance, advance } = limiter();
		expect(instance.check('a:x')).toBe('allowed');
		expect(instance.check('a:x')).toBe('allowed');
		expect(instance.check('a:x')).toBe('limited');
		expect(instance.check('a:x')).toBe('still-limited');

		advance(1000);
		expect(instance.check('a:x')).toBe('allowed');
	});

	it('counts each known event apart', () => {
		const { instance } = limiter();
		instance.check('a:x');
		instance.check('a:x');
		expect(instance.check('a:x')).toBe('limited');
		expect(instance.check('b:y')).toBe('allowed');
	});

	it('makes unknown event names share the fallback counter', () => {
		const { instance } = limiter();
		expect(instance.check('random:1')).toBe('allowed');
		expect(instance.check('random:2')).toBe('limited');
		expect(instance.check('a:x')).toBe('allowed');
	});
});

describe('rateLimitedErrorFor', () => {
	it.each([
		['listening:update', 'listening:error'],
		['control:action', 'control:error'],
	])('sends %j refusals on %j as { message, code }', (eventName, event) => {
		expect(rateLimitedErrorFor(eventName)).toEqual({
			event,
			payload: { message: RATE_LIMITED.message, code: 'RATE_LIMITED' },
		});
	});

	it('sends playlist refusals in the playlist:error shape', () => {
		expect(rateLimitedErrorFor('playlist:join')).toEqual({
			event: 'playlist:error',
			payload: { playlistId: null, message: RATE_LIMITED.message, code: 'RATE_LIMITED' },
		});
	});

	it.each(['other:event', ''])('sends nothing for %j', eventName => {
		expect(rateLimitedErrorFor(eventName)).toBeNull();
	});
});
