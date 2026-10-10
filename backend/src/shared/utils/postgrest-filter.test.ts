import { describe, expect, it } from 'vitest';
import { ilikeContains } from '@/shared/utils/postgrest-filter.js';

describe('ilikeContains', () => {
	it('wraps plain text in wildcards and double quotes', () => {
		expect(ilikeContains('ali')).toBe('"%ali%"');
	});

	it('keeps filter syntax inside the quoted value', () => {
		expect(ilikeContains('a,id.eq.1)')).toBe('"%a,id.eq.1)%"');
	});

	it('escapes LIKE wildcards so they match themselves', () => {
		expect(ilikeContains('50%_off')).toBe('"%50\\\\%\\\\_off%"');
	});

	it('turns * (a PostgREST wildcard alias) into a one-character wildcard', () => {
		expect(ilikeContains('a*z')).toBe('"%a_z%"');
	});

	it('escapes double quotes and backslashes for PostgREST', () => {
		expect(ilikeContains('a"b')).toBe('"%a\\"b%"');
		expect(ilikeContains('a\\b')).toBe('"%a\\\\\\\\b%"');
	});
});
