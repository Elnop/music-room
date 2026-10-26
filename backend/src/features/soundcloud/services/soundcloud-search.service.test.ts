import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as searchService from '@/features/soundcloud/services/soundcloud-search.service.js';
import * as cache from '@/features/soundcloud/utils/soundcloud-cache.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import type { SoundCloudClient } from '@/shared/soundcloud/soundcloud-client.js';
import type { SoundCloudTrack } from '@/features/soundcloud/soundcloud.types.js';

function track(overrides: Partial<SoundCloudTrack> = {}): SoundCloudTrack {
	return {
		id: 1,
		title: 'Song',
		description: null,
		duration: 180000,
		genre: null,
		artwork_url: 'https://img.test/art.jpg',
		permalink_url: 'https://soundcloud.com/artist/song',
		user: {
			id: 10,
			username: 'artist',
			avatar_url: 'https://img.test/avatar.jpg',
			permalink_url: 'https://soundcloud.com/artist',
		},
		playable: true,
		...overrides,
	};
}

const { search, get } = vi.hoisted(() => ({
	search: vi.fn<SoundCloudClient['tracks']['search']>(),
	get: vi.fn<SoundCloudClient['tracks']['get']>(),
}));

vi.mock('@/shared/soundcloud/soundcloud-client.js', () => ({
	soundcloud: { tracks: { search, get, getStreamUrl: vi.fn() } },
}));

async function expectAppError(promise: Promise<unknown>, statusCode: number, code: string) {
	const error: unknown = await promise.catch((e: unknown) => e);
	expect(error).toBeInstanceOf(AppError);
	expect(error).toMatchObject({ statusCode, code });
}

describe('soundcloud-search.service', () => {
	beforeEach(() => {
		search.mockReset();
		get.mockReset();
		cache.clear();
	});

	describe('searchTracks', () => {
		it('keeps only tracks with an unencrypted stream and passes paging through', async () => {
			const withProtocols = (id: number, ...protocols: string[]) =>
				track({
					id,
					streamable: true,
					media: {
						transcodings: protocols.map(protocol => ({
							url: 'https://api.test/t',
							preset: 'aac_160k',
							format: { protocol, mime_type: 'audio/mp4' },
						})),
					},
				});
			const hls = withProtocols(1, 'hls');
			const progressive = withProtocols(2, 'progressive');
			const encrypted = withProtocols(3, 'cbc-encrypted-hls', 'ctr-encrypted-hls');
			search.mockResolvedValue({
				collection: [hls, progressive, encrypted],
				total_results: 42,
				next_href: 'https://api.test/next',
			});

			const result = await searchService.searchTracks({ q: 'lofi', limit: 20, offset: 0 });

			expect(search).toHaveBeenCalledWith({ q: 'lofi', limit: 20, offset: 0 });
			expect(result.collection.map(t => t.id)).toEqual([1, 2]);
			expect(result.total_results).toBe(42);
			expect(result.next_href).toBe('https://api.test/next');
		});

		it('returns an empty collection when the client returns none', async () => {
			search.mockResolvedValue({});
			const result = await searchService.searchTracks({ q: 'none', limit: 5, offset: 0 });
			expect(result.collection).toEqual([]);
		});

		it('caches by q, limit and offset', async () => {
			search.mockResolvedValue({ collection: [track({ streamable: true })] });

			const first = await searchService.searchTracks({ q: 'lofi', limit: 20, offset: 0 });
			const second = await searchService.searchTracks({ q: 'lofi', limit: 20, offset: 0 });
			expect(second).toEqual(first);
			expect(search).toHaveBeenCalledTimes(1);

			await searchService.searchTracks({ q: 'lofi', limit: 20, offset: 20 });
			expect(search).toHaveBeenCalledTimes(2);
		});

		it('throws a 500 SOUNDCLOUD_ERROR when the client rejects', async () => {
			search.mockRejectedValue(new Error('rate limited'));
			await expectAppError(
				searchService.searchTracks({ q: 'lofi', limit: 20, offset: 0 }),
				500,
				'SOUNDCLOUD_ERROR'
			);
		});
	});

	describe('getTrack', () => {
		it('fetches a track once and serves it from cache afterwards', async () => {
			const t = track();
			get.mockResolvedValue(t);

			expect(await searchService.getTrack('https://soundcloud.com/artist/song')).toEqual(t);
			expect(await searchService.getTrack('https://soundcloud.com/artist/song')).toEqual(t);
			expect(get).toHaveBeenCalledTimes(1);
			expect(get).toHaveBeenCalledWith('https://soundcloud.com/artist/song');
		});

		it('throws a 404 TRACK_NOT_FOUND when the client rejects', async () => {
			get.mockRejectedValue(new Error('404'));
			await expectAppError(searchService.getTrack('123'), 404, 'TRACK_NOT_FOUND');
		});
	});
});
