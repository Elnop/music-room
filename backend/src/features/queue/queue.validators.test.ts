import { describe, expect, it } from 'vitest';
import {
	addQueueItemSchema,
	moveQueueItemSchema,
	queueItemParamsSchema,
	queueOwnerParamsSchema,
	queuePlaybackSchema,
	queuePlaylistParamsSchema,
} from '@/features/queue/queue.validators.js';

const ITEM_ID = '3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e';

describe('queueItemParamsSchema', () => {
	it('accepts a uuid itemId', () => {
		expect(queueItemParamsSchema.parse({ itemId: ITEM_ID })).toEqual({ itemId: ITEM_ID });
	});

	it('rejects a missing or non-uuid itemId', () => {
		expect(queueItemParamsSchema.safeParse({}).success).toBe(false);
		expect(queueItemParamsSchema.safeParse({ itemId: 'not-a-uuid' }).success).toBe(false);
		expect(queueItemParamsSchema.safeParse({ itemId: '' }).success).toBe(false);
	});
});

describe('moveQueueItemSchema', () => {
	it('accepts a uuid or null afterItemId', () => {
		expect(moveQueueItemSchema.parse({ afterItemId: ITEM_ID })).toEqual({ afterItemId: ITEM_ID });
		expect(moveQueueItemSchema.parse({ afterItemId: null })).toEqual({ afterItemId: null });
	});

	it('rejects a missing or non-uuid afterItemId', () => {
		expect(moveQueueItemSchema.safeParse({}).success).toBe(false);
		expect(moveQueueItemSchema.safeParse({ afterItemId: 'abc' }).success).toBe(false);
		expect(moveQueueItemSchema.safeParse({ afterItemId: 42 }).success).toBe(false);
	});
});

describe('addQueueItemSchema', () => {
	const track = {
		trackUri: 'https://soundcloud.com/artist/track',
		title: 'Song',
		artist: 'Artist',
		durationMs: 1000,
	};

	it('accepts a track', () => {
		expect(addQueueItemSchema.safeParse(track).success).toBe(true);
	});

	it('strips a previewUrl (a stream URL, never persisted)', () => {
		const parsed = addQueueItemSchema.parse({ ...track, previewUrl: 'https://example.com/stream' });
		expect(parsed).not.toHaveProperty('previewUrl');
	});

	it('rejects a track without uri or with a bad duration', () => {
		expect(addQueueItemSchema.safeParse({ ...track, trackUri: '' }).success).toBe(false);
		expect(addQueueItemSchema.safeParse({ ...track, durationMs: 0 }).success).toBe(false);
	});
});

describe('queuePlaylistParamsSchema', () => {
	it('accepts a uuid playlistId', () => {
		expect(queuePlaylistParamsSchema.parse({ playlistId: ITEM_ID })).toEqual({
			playlistId: ITEM_ID,
		});
	});

	it('rejects a missing or non-uuid playlistId', () => {
		expect(queuePlaylistParamsSchema.safeParse({}).success).toBe(false);
		expect(queuePlaylistParamsSchema.safeParse({ playlistId: 'not-a-uuid' }).success).toBe(false);
	});
});

describe('queuePlaybackSchema', () => {
	it('accepts no body, an empty body, or a deviceId', () => {
		expect(queuePlaybackSchema.parse(undefined)).toEqual({});
		expect(queuePlaybackSchema.parse({})).toEqual({});
		expect(queuePlaybackSchema.parse({ deviceId: 'tv' })).toEqual({ deviceId: 'tv' });
	});

	it('rejects an empty or oversized deviceId', () => {
		expect(() => queuePlaybackSchema.parse({ deviceId: '' })).toThrow();
		expect(() => queuePlaybackSchema.parse({ deviceId: 'x'.repeat(129) })).toThrow();
	});
});

describe('queueOwnerParamsSchema', () => {
	it('accepts a missing userId (own queue) or a uuid', () => {
		expect(queueOwnerParamsSchema.parse({})).toEqual({});
		const id = '0b0e7b4e-0000-4000-8000-000000000000';
		expect(queueOwnerParamsSchema.parse({ userId: id })).toEqual({ userId: id });
	});

	it('rejects a non-uuid userId', () => {
		expect(() => queueOwnerParamsSchema.parse({ userId: 'nope' })).toThrow();
	});
});
