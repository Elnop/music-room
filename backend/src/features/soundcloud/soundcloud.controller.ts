import { Request, Response, NextFunction } from 'express';
import { SoundCloudService } from '@/features/soundcloud/soundcloud.service.js';
import { soundcloudSearchSchema } from '@/features/soundcloud/soundcloud.validators.js';
import { logger } from '@/shared/utils/logger.js';

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
			const { urlOrId } = req.params;

			if (!urlOrId) {
				return res.status(400).json({
					success: false,
					error: {
						message: 'Track URL or ID is required',
						code: 'MISSING_TRACK_ID',
					},
					meta: { timestamp: new Date().toISOString() },
				});
			}

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
			const rawUrl = (req.query.url as string) || req.params.trackUrl;

			logger.info('[SoundCloud] Stream URL request received', {
				rawQueryParam: req.query.url,
				rawPathParam: req.params.trackUrl,
				source: req.query.url ? 'query' : 'path',
				headers: {
					'user-agent': req.headers['user-agent'],
					origin: req.headers['origin'],
				},
			});

			const trackUrl = rawUrl ? decodeURIComponent(rawUrl) : '';

			logger.info('[SoundCloud] Decoded track URL', { trackUrl });

			if (!trackUrl) {
				logger.warn('[SoundCloud] Missing track URL in request');
				return res.status(400).json({
					success: false,
					error: {
						message: 'Track URL is required',
						code: 'MISSING_TRACK_URL',
					},
					meta: { timestamp: new Date().toISOString() },
				});
			}

			logger.info('[SoundCloud] Fetching stream URL from service', {
				trackUrl,
			});

			const streamUrl = await soundcloudService.getStreamUrl(trackUrl);

			logger.info('[SoundCloud] Stream URL obtained successfully', {
				trackUrl,
				streamUrlLength: streamUrl.length,
				streamUrlPreview: streamUrl.substring(0, 100) + '...',
			});

			return res.json({
				success: true,
				data: { streamUrl },
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
