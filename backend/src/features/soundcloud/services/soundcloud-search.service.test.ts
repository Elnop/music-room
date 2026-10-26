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

const transcoded = (...protocols: string[]) => ({
	media: {
		transcodings: protocols.map(protocol => ({
			url: 'https://api.test/t',
			preset: 'aac_160k',
			format: { protocol, mime_type: 'audio/mp4' },
		})),
	},
});
const playable = (id: number) => track({ id, ...transcoded('hls') });
const drmOnly = (id: number) =>
	track({ id, ...transcoded('cbc-encrypted-hls', 'ctr-encrypted-hls') });

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
			search.mockResolvedValueOnce({
				collection: [playable(1), track({ id: 2, ...transcoded('progressive') }), drmOnly(3)],
				total_results: 42,
			});

			const result = await searchService.searchTracks({ q: 'lofi', limit: 20, offset: 0 });

			expect(search).toHaveBeenCalledTimes(1);
			expect(search).toHaveBeenCalledWith({ q: 'lofi', limit: 50, offset: 0 });
			expect(result.collection.map(t => t.id)).toEqual([1, 2]);
			expect(result.total_results).toBe(42);
		});

		it('tops a short page up from the next ones, up to the limit', async () => {
			search
				.mockResolvedValueOnce({
					collection: [playable(1), drmOnly(2), playable(3)],
					total_results: 42,
					next_href: 'https://api.test/page-2',
				})
				.mockResolvedValueOnce({
					collection: [drmOnly(4), playable(5), playable(6)],
					next_href: 'https://api.test/page-3',
				});

			const result = await searchService.searchTracks({ q: 'drake', limit: 3, offset: 10 });

			expect(search).toHaveBeenNthCalledWith(1, { q: 'drake', limit: 50, offset: 10 });
			expect(search).toHaveBeenNthCalledWith(2, { q: 'drake', limit: 50, offset: 13 });
			expect(result.collection.map(t => t.id)).toEqual([1, 3, 5]);
			expect(result.total_results).toBe(42);
			expect(result.next_href).toBe('https://api.test/page-3');
		});

		it('reads at most 3 SoundCloud pages', async () => {
			search.mockResolvedValue({ collection: [drmOnly(1)], next_href: 'https://api.test/next' });

			const result = await searchService.searchTracks({ q: 'drake', limit: 20, offset: 0 });

			expect(search).toHaveBeenCalledTimes(3);
			expect(result.collection).toEqual([]);
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
