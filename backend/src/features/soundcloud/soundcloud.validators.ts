import { z } from 'zod';

/**
 * Validation schema for SoundCloud search query
 */
export const soundcloudSearchSchema = z.object({
	q: z.string().min(1, 'Search query is required').max(200, 'Query too long'),
	limit: z.coerce.number().int().min(1).max(50).default(20),
	offset: z.coerce.number().int().min(0).default(0),
});
export type SoundCloudSearchInput = z.infer<typeof soundcloudSearchSchema>;

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

/**
 * A track as SoundCloud's API returns it, passed through unchanged (snake_case);
 * only the fields the app reads are listed.
 */
export const soundcloudTrackSchema = z.object({
	id: z.int().meta({ description: 'SoundCloud track ID' }),
	title: z.string(),
	description: z.string().nullable(),
	duration: z.int().meta({ description: 'Track duration in milliseconds' }),
	genre: z.string().nullable(),
	artwork_url: z.url().nullable().meta({ description: 'Artwork URL' }),
	permalink_url: z.url().meta({ description: 'SoundCloud permalink URL, stored as trackUri' }),
	user: z.object({
		id: z.int(),
		username: z.string().meta({ description: 'Artist name' }),
		avatar_url: z.url().nullable(),
		permalink_url: z.url(),
	}),
	streamable: z.boolean().optional(),
	playable: z.boolean(),
	policy: z.string().optional().meta({
		description: "SoundCloud's access policy, e.g. ALLOW, or SNIP for a 30-second preview",
	}),
	media: z
		.object({
			transcodings: z.array(
				z.object({
					url: z.url(),
					preset: z.string(),
					snipped: z.boolean().optional().meta({
						description: 'True when this stream is only the 30-second preview',
					}),
					format: z.object({ protocol: z.string(), mime_type: z.string() }),
				})
			),
		})
		.optional(),
});

/** GET /api/soundcloud/search: the playable tracks of one page of results. */
export const soundcloudSearchResultSchema = z.object({
	collection: z.array(soundcloudTrackSchema),
	total_results: z.int().optional(),
	next_href: z.url().nullable().optional().meta({ description: 'URL of the next page' }),
});

/** GET /api/soundcloud/stream */
export const soundcloudStreamResultSchema = z.object({
	streamUrl: z.url().meta({ description: 'HLS AAC stream URL (expires after 30 minutes)' }),
	expiresAt: z.iso.datetime().meta({
		description: 'When the stream URL expires; request a new one shortly before',
	}),
});
