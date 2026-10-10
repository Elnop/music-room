import { describe, expect, it } from 'vitest';
import { compileTrust, parseTrustProxy } from '@/shared/config/trust-proxy-setting.js';

describe('parseTrustProxy', () => {
	it.each([
		['', false],
		['  ', false],
		['false', false],
		['true', true],
		['1', 1],
		['2', 2],
		['FALSE', false],
		['True', true],
		['Loopback', 'loopback'],
		[' loopback , 10.0.0.0/8 ', 'loopback,10.0.0.0/8'],
	])('reads %j as %j', (value, expected) => {
		expect(parseTrustProxy(value)).toBe(expected);
	});
});

describe('compileTrust', () => {
	it('trusts the listed proxies only', () => {
		const trust = compileTrust(parseTrustProxy('loopback'));
		expect(trust('127.0.0.1', 0)).toBe(true);
		expect(trust('203.0.113.1', 0)).toBe(false);
	});

	it('counts hops', () => {
		const trust = compileTrust(parseTrustProxy('1'));
		expect(trust('203.0.113.1', 0)).toBe(true);
		expect(trust('203.0.113.1', 1)).toBe(false);
	});

	it.each(['-1', '1.5', 'not-an-ip'])('throws on %j', value => {
		expect(() => compileTrust(parseTrustProxy(value))).toThrow();
	});
});
