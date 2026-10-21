import { z } from 'zod';

/**
 * Validation schema for SoundCloud search query
 */
export const soundcloudSearchSchema = z.object({
	q: z.string().min(1, 'Search query is required').max(200, 'Query too long'),
	limit: z.coerce.number().int().min(1).max(50).default(20),
	offset: z.coerce.number().int().min(0).default(0),
});

const SOUNDCLOUD_HOSTS = new Set([
	'soundcloud.com',
	'www.soundcloud.com',
	'm.soundcloud.com',
	'on.soundcloud.com',
]);

/**
 * A SoundCloud track URL on soundcloud.com (also www. and m.) or
 * `https://on.soundcloud.com/...`, with a path.
 */
const soundcloudUrlSchema = z
	.string()
	.max(2048, 'URL too long')
	.refine(value => {
		try {
			const url = new URL(value);
			return (
				url.protocol === 'https:' &&
				SOUNDCLOUD_HOSTS.has(url.hostname) &&
				url.port === '' &&
				url.username === '' &&
				url.password === '' &&
				url.pathname.length > 1
			);
		} catch {
			return false;
		}
	}, 'Must be a https SoundCloud URL (soundcloud.com, www., m. or on.)');

/** A numeric SoundCloud track id. */
const soundcloudTrackIdSchema = z.string().regex(/^\d{1,20}$/, 'Must be a numeric track id');

/**
 * Params of GET /api/soundcloud/track/:urlOrId
 */
export const soundcloudTrackParamsSchema = z.object({
	urlOrId: z.union([soundcloudTrackIdSchema, soundcloudUrlSchema], {
		error: 'Must be a SoundCloud track URL or a numeric track id',
	}),
});

/**
 * Track URL of GET /api/soundcloud/stream?url= and /stream/:trackUrl, as
 * received (it is URL-decoded once more, as the client may double-encode it).
 */
export const soundcloudStreamUrlSchema = z.object({
	url: z
		.string()
		.transform((value, ctx) => {
			try {
				return decodeURIComponent(value);
			} catch {
				ctx.addIssue({ code: 'custom', message: 'Malformed URL encoding' });
				return z.NEVER;
			}
		})
		.pipe(soundcloudUrlSchema),
});

/**
 * Raw stream inputs, before the presence check (MISSING_TRACK_URL).
 */
export const soundcloudStreamRawSchema = z.object({
	query: z.object({ url: z.string().optional() }),
	params: z.object({ trackUrl: z.string().optional() }),
});
