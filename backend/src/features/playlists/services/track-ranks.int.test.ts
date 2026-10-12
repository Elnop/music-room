import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { supabaseAdmin } from '@/shared/config/supabase.js';

// SQL rank functions from migration 016, against the local Supabase stack.
// Called by name: the generated types only know these functions after `make generate-types`.
const db = supabaseAdmin as unknown as SupabaseClient;

async function call(fn: string, args: Record<string, unknown>): Promise<string> {
	const response: { data: unknown; error: PostgrestError | null } = await db.rpc(fn, args);
	const { data, error } = response;
	if (error) throw new Error(error.message);
	return data as string;
}

const between = (a: string | null, b: string | null) => call('rank_between', { p_a: a, p_b: b });
const after = (a: string | null) => call('rank_after', { p_a: a });
const spaced = (index: number, count: number) =>
	call('rank_spaced', { p_index: index, p_count: count });

const VALID = /^[0-9A-Za-z]*[1-9A-Za-z]$/;
const below = (a: string, b: string) => a < b; // byte order, as COLLATE "C"

describe('rank_between (migration 016)', () => {
	it.each([
		[null, null],
		[null, 'V'],
		['V', null],
		['h', 'p'],
		['V', 'W'],
		['V', 'V1'],
		['z', null],
		['0V', '1'],
	])('returns a valid key strictly between %s and %s', async (a, b) => {
		const key = await between(a, b);
		expect(key).toMatch(VALID);
		if (a !== null) expect(below(a, key)).toBe(true);
		if (b !== null) expect(below(key, b)).toBe(true);
	});

	it('refuses bounds in the wrong order', async () => {
		await expect(between('p', 'h')).rejects.toThrow();
		await expect(between('h', 'h')).rejects.toThrow();
	});

	it('keeps keys short when inserting 200 times into the same gap', async () => {
		let low = 'V';
		const high = 'W';
		for (let i = 0; i < 200; i++) {
			const key = await between(low, high);
			expect(below(low, key) && below(key, high)).toBe(true);
			low = key;
		}
		expect(low.length).toBeLessThanOrEqual(40);
	});
});

describe('rank_after (migration 016)', () => {
	it('starts at V and grows by one character per 61 appends', async () => {
		let key = await after(null);
		expect(key).toBe('V');
		for (let i = 0; i < 1000; i++) {
			const next = await after(key);
			expect(next).toMatch(VALID);
			expect(below(key, next)).toBe(true);
			key = next;
		}
		expect(key.length).toBeLessThanOrEqual(20);
	});
});

describe('rank_spaced (migration 016)', () => {
	it('returns increasing distinct keys', async () => {
		for (const count of [1, 2, 61, 62, 500]) {
			let previous = '';
			for (const index of [1, 2, Math.ceil(count / 2), count]) {
				if (index > count) continue;
				const key = await spaced(index, count);
				expect(key).toMatch(VALID);
				if (previous && index > 1) expect(below(previous, key)).toBe(true);
				previous = key;
			}
		}
	});
});
