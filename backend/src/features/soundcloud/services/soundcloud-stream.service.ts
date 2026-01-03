import { logger } from '@/shared/utils/logger.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { SoundCloudCache, CACHE_TTL } from '@/features/soundcloud/utils/soundcloud-cache.js';
import type { SoundCloudClient } from '@/features/soundcloud/soundcloud.types.js';

/**
 * Extended SoundCloud client with util methods
 */
type SoundCloudClientWithUtil = SoundCloudClient & {
	util?: {
		streamLink: (trackUrl: string, protocol: 'hls' | 'progressive') => Promise<string>;
	};
};

/**
 * Service for SoundCloud streaming operations
 */
export class SoundCloudStreamService {
	private soundcloud: SoundCloudClientWithUtil;
	private cache: SoundCloudCache;

	constructor(soundcloudInstance: SoundCloudClientWithUtil) {
		this.soundcloud = soundcloudInstance;
		this.cache = new SoundCloudCache();
	}

	/**
	 * Get stream URL for a track
	 * Uses soundcloud.ts util.streamLink() which handles transcoding internally
	 * Tries HLS first, falls back to progressive if HLS not available
	 */
	async getStreamUrl(trackUrl: string): Promise<string> {
		const cacheKey = `stream:${trackUrl}`;
		const cached = this.cache.get<string>(cacheKey);
		if (cached) {
			logger.debug('Returning cached stream URL', { trackUrl });
			return cached;
		}

		try {
			logger.info('Getting stream URL', { trackUrl });

			// Validate util.streamLink() method exists
			if (typeof this.soundcloud.util?.streamLink !== 'function') {
				logger.error('util.streamLink() method not available');
				throw new AppError(500, 'SoundCloud API client not properly initialized', 'API_ERROR');
			}

			// Try HLS protocol first (better for streaming)
			const streamUrl = await this.tryGetStreamUrl(trackUrl, 'hls');

			if (streamUrl) {
				logger.info('Stream URL obtained (HLS)', { trackUrl });
				this.cache.set(cacheKey, streamUrl, CACHE_TTL.STREAM);
				return streamUrl;
			}

			// Fallback to progressive
			const progressiveUrl = await this.tryGetStreamUrl(trackUrl, 'progressive');

			if (progressiveUrl) {
				logger.info('Stream URL obtained (progressive fallback)', { trackUrl });
				this.cache.set(cacheKey, progressiveUrl, CACHE_TTL.STREAM);
				return progressiveUrl;
			}

			// No valid stream URL found
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

	/**
	 * Try to get stream URL with specified protocol
	 */
	private async tryGetStreamUrl(
		trackUrl: string,
		protocol: 'hls' | 'progressive'
	): Promise<string | null> {
		try {
			logger.debug(`Trying ${protocol} stream`, { trackUrl });

			if (!this.soundcloud.util) {
				logger.error('SoundCloud util methods not available');
				return null;
			}

			const streamUrl = await this.soundcloud.util.streamLink(trackUrl, protocol);

			// Validate stream URL
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
}
