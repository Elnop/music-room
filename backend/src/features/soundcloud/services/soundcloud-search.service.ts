import { logger } from '@/shared/utils/logger.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import * as cache from '@/features/soundcloud/utils/soundcloud-cache.js';
import { soundcloud } from '@/shared/soundcloud/soundcloud-client.js';
import * as availability from '@/shared/soundcloud/track-availability.js';
import type { SoundCloudSearchInput } from '@/features/soundcloud/soundcloud.validators.js';
import type {
	SoundCloudSearchResult,
	SoundCloudTrack,
} from '@/features/soundcloud/soundcloud.types.js';

/** Keeps playable tracks only. */
export async function searchTracks(query: SoundCloudSearchInput): Promise<SoundCloudSearchResult> {
	const cacheKey = `search:${query.q}:${query.limit}:${query.offset}`;

	const cached = cache.get<SoundCloudSearchResult>(cacheKey);
	if (cached) {
		logger.debug('Returning cached search results', { query: query.q });
		return cached;
	}

	try {
		logger.info('Searching SoundCloud', {
			query: query.q,
			limit: query.limit,
		});

		const results = (await soundcloud.tracks.search({
			q: query.q,
			limit: query.limit,
			offset: query.offset,
		})) as {
			collection?: SoundCloudTrack[];
			total_results?: number;
			next_href?: string;
		};

		const playableTracks = (results.collection || []).filter(availability.isPlayable);

		const searchResult: SoundCloudSearchResult = {
			collection: playableTracks,
			total_results: results.total_results,
			next_href: results.next_href,
		};

		cache.set(cacheKey, searchResult, cache.CACHE_TTL.SEARCH);

		logger.info('Search completed', {
			query: query.q,
			totalFound: results.collection?.length || 0,
			playableCount: playableTracks.length,
		});

		return searchResult;
	} catch (error) {
		logger.error('SoundCloud search failed', { error, query: query.q });
		throw new AppError(500, 'Failed to search SoundCloud', 'SOUNDCLOUD_ERROR');
	}
}

/** Accepts a permalink URL or a numeric id. */
export async function getTrack(urlOrId: string): Promise<SoundCloudTrack> {
	const cacheKey = `track:${urlOrId}`;
	const cached = cache.get<SoundCloudTrack>(cacheKey);
	if (cached) {
		logger.debug('Returning cached track', { urlOrId });
		return cached;
	}

	try {
		logger.info('Fetching track', { urlOrId });

		const track = (await soundcloud.tracks.get(urlOrId)) as SoundCloudTrack;

		cache.set(cacheKey, track, cache.CACHE_TTL.TRACK);

		return track;
	} catch (error) {
		logger.error('Failed to fetch track', { error, urlOrId });
		throw new AppError(404, 'Track not found', 'TRACK_NOT_FOUND');
	}
}
