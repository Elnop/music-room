import { logger } from '@/shared/utils/logger.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import * as cache from '@/features/soundcloud/utils/soundcloud-cache.js';
import { soundcloud } from '@/features/soundcloud/utils/soundcloud-client.js';
import type { StreamUrlResult } from '@/features/soundcloud/soundcloud.types.js';

type Protocol = 'hls' | 'progressive';

// HLS first, else progressive. Never persisted; a cached result keeps its original `expiresAt`.
export async function getStreamUrl(trackUrl: string): Promise<StreamUrlResult> {
	const cacheKey = `stream:${trackUrl}`;
	const cached = cache.get<StreamUrlResult>(cacheKey);
	if (cached) {
		logger.debug('Returning cached stream URL', { trackUrl });
		return cached;
	}

	try {
		logger.info('Getting stream URL', { trackUrl });

		if (typeof soundcloud.util?.streamLink !== 'function') {
			logger.error('util.streamLink() method not available');
			throw new AppError(500, 'SoundCloud API client not properly initialized', 'API_ERROR');
		}

		const obtainedAt = Date.now();
		const streamUrl =
			(await tryGetStreamUrl(trackUrl, 'hls')) ?? (await tryGetStreamUrl(trackUrl, 'progressive'));

		if (streamUrl) {
			logger.info('Stream URL obtained', { trackUrl });
			const result: StreamUrlResult = {
				streamUrl,
				expiresAt: new Date(obtainedAt + cache.STREAM_URL_LIFETIME_S * 1000).toISOString(),
			};
			cache.set(cacheKey, result, cache.CACHE_TTL.STREAM);
			return result;
		}

		throw new AppError(404, 'Track stream not available', 'STREAM_NOT_FOUND');
	} catch (error) {
		if (error instanceof AppError) throw error;

		logger.error('Failed to get stream URL', {
			error: error instanceof Error ? error.message : 'Unknown error',
			trackUrl,
		});

		throw new AppError(500, 'Failed to get stream URL', 'STREAM_ERROR');
	}
}

/** The stream URL for one protocol, or null when SoundCloud has none. */
async function tryGetStreamUrl(trackUrl: string, protocol: Protocol): Promise<string | null> {
	try {
		logger.debug(`Trying ${protocol} stream`, { trackUrl });

		if (!soundcloud.util) {
			logger.error('SoundCloud util methods not available');
			return null;
		}

		const streamUrl = await soundcloud.util.streamLink(trackUrl, protocol);

		if (!streamUrl || typeof streamUrl !== 'string' || streamUrl.length === 0) {
			logger.debug(`${protocol} stream not available`, { trackUrl });
			return null;
		}

		return streamUrl;
	} catch (error) {
		logger.debug(`Failed to get ${protocol} stream`, {
			error: error instanceof Error ? error.message : 'Unknown error',
			trackUrl,
		});
		return null;
	}
}
