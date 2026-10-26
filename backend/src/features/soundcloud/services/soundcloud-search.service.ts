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

interface SearchPage {
	collection?: SoundCloudTrack[];
	total_results?: number;
	next_href?: string;
}

// About a third of SoundCloud's results only have DRM streams: the next pages top a short one up.
const SOUNDCLOUD_PAGE_SIZE = 50;
const MAX_PAGES = 3;

/** Keeps playable tracks only, reading up to MAX_PAGES SoundCloud pages to reach `limit`. */
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

		const { playable, scanned, first, last } = await collectPlayable(query);

		const searchResult: SoundCloudSearchResult = {
			collection: playable.slice(0, query.limit),
			total_results: first.total_results,
			next_href: last.next_href,
		};

		cache.set(cacheKey, searchResult, cache.CACHE_TTL.SEARCH);

		logger.info('Search completed', {
			query: query.q,
			totalFound: scanned,
			playableCount: searchResult.collection.length,
		});

		return searchResult;
	} catch (error) {
		logger.error('SoundCloud search failed', { error, query: query.q });
		throw new AppError(500, 'Failed to search SoundCloud', 'SOUNDCLOUD_ERROR');
	}
}

async function collectPlayable(query: SoundCloudSearchInput) {
	const playable: SoundCloudTrack[] = [];
	let offset = query.offset;
	let scanned = 0;
	let first: SearchPage | undefined;
	let last: SearchPage;
	let pages = 0;
	do {
		last = (await soundcloud.tracks.search({
			q: query.q,
			limit: SOUNDCLOUD_PAGE_SIZE,
			offset,
		})) as SearchPage;
		first ??= last;
		pages += 1;
		const collection = last.collection ?? [];
		scanned += collection.length;
		offset += collection.length;
		playable.push(...collection.filter(availability.isPlayable));
		if (collection.length === 0) break;
	} while (playable.length < query.limit && last.next_href && pages < MAX_PAGES);
	return { playable, scanned, first, last };
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
