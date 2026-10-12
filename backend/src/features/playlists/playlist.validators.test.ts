import { describe, expect, it } from 'vitest';
import {
	moveTrackSchema,
	rankSchema,
	trackIdParamSchema,
} from '@/features/playlists/playlist.validators.js';

describe('rankSchema', () => {
	it.each(['V', 'a1', 'zz1', '0V', 'x'.repeat(128)])('accepts %s', rank => {
		expect(rankSchema.safeParse(rank).success).toBe(true);
	});

	it.each(['', 'V0', '0', 'a-b', 'a b', 'é', 'x'.repeat(129)])('rejects %s', rank => {
		expect(rankSchema.safeParse(rank).success).toBe(false);
	});
});

describe('moveTrackSchema', () => {
	it('accepts a move to the top', () => {
		expect(moveTrackSchema.parse({ afterRank: null, expectedVersion: 0 })).toEqual({
			afterRank: null,
			expectedVersion: 0,
		});
	});

	it('accepts a move after a rank', () => {
		expect(moveTrackSchema.parse({ afterRank: 'h', expectedVersion: 10 })).toEqual({
			afterRank: 'h',
			expectedVersion: 10,
		});
	});

	it('requires expectedVersion', () => {
		expect(moveTrackSchema.safeParse({ afterRank: 'V' }).success).toBe(false);
	});

	it('requires afterRank to be present', () => {
		expect(moveTrackSchema.safeParse({ expectedVersion: 1 }).success).toBe(false);
	});

	it('rejects a negative or fractional version', () => {
		expect(moveTrackSchema.safeParse({ afterRank: 'V', expectedVersion: -1 }).success).toBe(false);
		expect(moveTrackSchema.safeParse({ afterRank: 'V', expectedVersion: 1.5 }).success).toBe(false);
	});

	it('rejects an invalid afterRank', () => {
		expect(moveTrackSchema.safeParse({ afterRank: 'V0', expectedVersion: 1 }).success).toBe(false);
		expect(moveTrackSchema.safeParse({ afterRank: '', expectedVersion: 1 }).success).toBe(false);
	});
});

describe('trackIdParamSchema', () => {
	it('accepts a uuid', () => {
		const trackId = '123e4567-e89b-12d3-a456-426614174000';
		expect(trackIdParamSchema.parse({ id: 'p', trackId })).toEqual({ trackId });
	});

	it.each(['not-a-uuid', '', '123'])('rejects %s', trackId => {
		expect(trackIdParamSchema.safeParse({ trackId }).success).toBe(false);
	});
});
