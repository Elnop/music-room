import type { Request, Response } from 'express';
import * as searchService from '@/features/soundcloud/services/soundcloud-search.service.js';
import * as streamService from '@/features/soundcloud/services/soundcloud-stream.service.js';
import {
	soundcloudSearchSchema,
	soundcloudStreamRawSchema,
	soundcloudStreamUrlSchema,
	soundcloudTrackParamsSchema,
} from '@/features/soundcloud/soundcloud.validators.js';
import { logger } from '@/shared/utils/logger.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { sendSuccess } from '@/shared/utils/send-success.js';

export async function search(req: Request, res: Response) {
	const query = soundcloudSearchSchema.parse(req.query);
	sendSuccess(res, await searchService.searchTracks(query));
}

export async function getTrack(req: Request, res: Response) {
	const { urlOrId } = soundcloudTrackParamsSchema.parse(req.params);
	sendSuccess(res, await searchService.getTrack(urlOrId));
}

/** Also serves the legacy /stream/:trackUrl (a URL in the path is blocked by Cloudflare's WAF). */
export async function getStreamUrl(req: Request, res: Response) {
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
	logger.info('[SoundCloud] Fetching stream URL', { trackUrl });

	const { streamUrl, protocol, expiresAt } = await streamService.getStreamUrl(trackUrl);

	logger.info('[SoundCloud] Stream URL obtained successfully', {
		trackUrl,
		streamUrlLength: streamUrl.length,
		streamUrlPreview: streamUrl.substring(0, 100) + '...',
		expiresAt,
	});

	sendSuccess(res, { streamUrl, protocol, expiresAt });
}
