import { Request, Response, NextFunction } from 'express';
import { SoundCloudService } from '@/features/soundcloud/soundcloud.service.js';
import {
	soundcloudSearchSchema,
	soundcloudStreamRawSchema,
	soundcloudStreamUrlSchema,
	soundcloudTrackParamsSchema,
} from '@/features/soundcloud/soundcloud.validators.js';
import { logger } from '@/shared/utils/logger.js';
import { AppError } from '@/shared/middleware/error-handler.js';

const soundcloudService = new SoundCloudService();

export class SoundCloudController {
	/**
	 * Search tracks
	 * GET /api/soundcloud/search?q=query&limit=20&offset=0
	 */
	async search(req: Request, res: Response, next: NextFunction) {
		try {
			const query = soundcloudSearchSchema.parse(req.query);
			const results = await soundcloudService.searchTracks(query);

			return res.json({
				success: true,
				data: results,
				meta: {
					timestamp: new Date().toISOString(),
				},
			});
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Get track details by URL or ID
	 * GET /api/soundcloud/track/:urlOrId
	 */
	async getTrack(req: Request, res: Response, next: NextFunction) {
		try {
			const { urlOrId } = soundcloudTrackParamsSchema.parse(req.params);

			const track = await soundcloudService.getTrack(urlOrId);

			return res.json({
				success: true,
				data: track,
				meta: { timestamp: new Date().toISOString() },
			});
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Get stream URL for a track
	 * GET /api/soundcloud/stream?url=<trackUrl> (preferred - avoids WAF issues)
	 * GET /api/soundcloud/stream/:trackUrl (legacy - kept for compatibility)
	 */
	async getStreamUrl(req: Request, res: Response, next: NextFunction) {
		try {
			// Support both query param (new) and path param (legacy)
			const { query, params } = soundcloudStreamRawSchema.parse({
				query: req.query,
				params: req.params,
			});
			const rawUrl = query.url || params.trackUrl;

			logger.info('[SoundCloud] Stream URL request received', {
				rawQueryParam: query.url,
				rawPathParam: params.trackUrl,
				source: query.url ? 'query' : 'path',
				headers: {
					'user-agent': req.headers['user-agent'],
					origin: req.headers['origin'],
				},
			});

			if (!rawUrl) {
				logger.warn('[SoundCloud] Missing track URL in request');
				throw new AppError(400, 'Track URL is required', 'MISSING_TRACK_URL', undefined, {
					fix: 'Pass the SoundCloud permalink in the url query parameter',
				});
			}

			const { url: trackUrl } = soundcloudStreamUrlSchema.parse({ url: rawUrl });

			logger.info('[SoundCloud] Decoded track URL', { trackUrl });

			logger.info('[SoundCloud] Fetching stream URL from service', {
				trackUrl,
			});

			const { streamUrl, expiresAt } = await soundcloudService.getStreamUrl(trackUrl);

			logger.info('[SoundCloud] Stream URL obtained successfully', {
				trackUrl,
				streamUrlLength: streamUrl.length,
				streamUrlPreview: streamUrl.substring(0, 100) + '...',
				expiresAt,
			});

			return res.json({
				success: true,
				data: { streamUrl, expiresAt },
				meta: { timestamp: new Date().toISOString() },
			});
		} catch (error) {
			logger.error('[SoundCloud] Error getting stream URL', {
				error: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : undefined,
				trackUrl: req.params.trackUrl,
			});
			next(error);
		}
	}
}
