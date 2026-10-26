import type { OpenAPIRegistry, RouteConfig } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
	soundcloudSearchResultSchema,
	soundcloudSearchSchema,
	soundcloudStreamResultSchema,
	soundcloudStreamUrlSchema,
	soundcloudTrackParamsSchema,
	soundcloudTrackSchema,
} from '@/features/soundcloud/soundcloud.validators.js';
import {
	describeParams,
	nameSchemas,
	param,
	bearerAuth,
	ok,
} from '@/shared/config/swagger.schemas.js';
import { fail, shared } from '@/shared/config/swagger.errors.js';

const SOUNDCLOUD_URL_RULE =
	'an https URL on `soundcloud.com`, `www.soundcloud.com`, `m.soundcloud.com` or `on.soundcloud.com`';

/** Every route is authenticated, then rate limited per user (default 120 per minute), Redis only. */
const protectedResponses: RouteConfig['responses'] = {
	401: shared('UnauthorizedError'),
	429: fail(
		'RATE_LIMIT_EXCEEDED: too many SoundCloud requests from this user in the window (default 120 per minute), or, before authentication, too many failed token verifications from this IP (#160); `error.details.retryAfter` gives the end of the window',
		[
			'RATE_LIMIT_EXCEEDED',
			'Too many SoundCloud requests. Please try again later.',
			{ retryAfter: '2025-01-15T10:31:00.000Z' },
		]
	),
	503: fail(
		'Redis is not ready (fail closed). REVOCATION_UNAVAILABLE: authMiddleware cannot check the logout denylist (it runs first, so this is what a client sees when Redis is down). RATE_LIMIT_UNAVAILABLE: the SoundCloud limiter cannot count the request.',
		['REVOCATION_UNAVAILABLE', 'Session revocation is unavailable']
	),
};

const streamResponses: RouteConfig['responses'] = {
	200: ok('Stream URL retrieved', soundcloudStreamResultSchema),
	400: fail(
		`MISSING_TRACK_URL: the track URL is missing or empty. VALIDATION_ERROR: it is not ${SOUNDCLOUD_URL_RULE}`,
		['MISSING_TRACK_URL', 'Track URL is required'],
		[
			'VALIDATION_ERROR',
			'Validation error',
			[
				{
					path: 'url',
					message: 'Must be a https SoundCloud URL (soundcloud.com, www., m. or on.)',
				},
			],
		]
	),
	404: shared('NotFoundError'),
	...protectedResponses,
};

export function registerSoundcloudOpenapi(registry: OpenAPIRegistry): void {
	const common = { method: 'get' as const, tags: ['SoundCloud'], security: bearerAuth };
	const ruled = 'Requires authentication; rate limited per user.';
	nameSchemas({ SoundCloudTrack: soundcloudTrackSchema });

	registry.registerPath({
		...common,
		path: '/api/soundcloud/search',
		summary: 'Search SoundCloud tracks',
		description: `${ruled} Returns the playable tracks matching the query (DRM-only and region-blocked ones are left out); short pages are topped up from up to 3 SoundCloud pages of 50, so \`offset\` counts SoundCloud results, not returned tracks.`,
		operationId: 'searchSoundCloudTracks',
		request: {
			query: describeParams(soundcloudSearchSchema, {
				q: 'Search query',
				limit: 'Maximum number of results',
				offset: 'Pagination offset',
			}),
		},
		responses: {
			200: ok('Search results', soundcloudSearchResultSchema),
			400: shared('ValidationError'),
			...protectedResponses,
		},
	});

	registry.registerPath({
		...common,
		path: '/api/soundcloud/track/{urlOrId}',
		summary: 'Get SoundCloud track details',
		description: `${ruled} Fetches track metadata by SoundCloud URL (URL-encoded, ${SOUNDCLOUD_URL_RULE}) or numeric ID.`,
		operationId: 'getSoundCloudTrack',
		request: {
			params: describeParams(soundcloudTrackParamsSchema, {
				urlOrId: `URL-encoded SoundCloud track URL (${SOUNDCLOUD_URL_RULE}) or numeric track ID`,
			}),
		},
		responses: {
			200: ok('Track details', soundcloudTrackSchema),
			400: shared('ValidationError'),
			404: shared('NotFoundError'),
			...protectedResponses,
		},
	});

	registry.registerPath({
		...common,
		path: '/api/soundcloud/stream',
		summary: 'Get SoundCloud stream URL',
		description: `${ruled} Returns AAC HLS stream URL for playback. The track URL goes in the query string (a URL in the path can be blocked by Cloudflare WAF); \`/api/soundcloud/stream/{trackUrl}\` is the legacy form.`,
		operationId: 'getSoundCloudStreamUrlByQuery',
		request: {
			query: describeParams(soundcloudStreamUrlSchema, {
				url: `URL-encoded SoundCloud track permalink URL: ${SOUNDCLOUD_URL_RULE}`,
			}),
		},
		responses: streamResponses,
	});

	registry.registerPath({
		...common,
		path: '/api/soundcloud/stream/{trackUrl}',
		summary: 'Get SoundCloud stream URL',
		description: `${ruled} Returns AAC HLS stream URL for playback. Legacy form of \`/api/soundcloud/stream?url=\`, same validation.`,
		operationId: 'getSoundCloudStreamUrl',
		request: {
			params: z.object({
				trackUrl: param(
					soundcloudStreamUrlSchema.shape.url,
					`URL-encoded SoundCloud track URL: ${SOUNDCLOUD_URL_RULE}`
				),
			}),
		},
		responses: streamResponses,
	});
}
