import { z } from 'zod';
import { addTrackSchema } from '@/features/playlists/playlist.validators.js';

/**
 * Body of POST /api/queue/items: a playlist add's track without `previewUrl`,
 * a stream URL that must never be persisted; a sent one is stripped.
 */
export const addQueueItemSchema = addTrackSchema.omit({ previewUrl: true });

/**
 * Body of POST /api/queue/items: the track, plus `next` to place it right
 * after the current item (at the top when nothing is current) instead of last.
 */
export const addQueueItemBodySchema = addQueueItemSchema.extend({
	next: z.boolean().optional(),
});

/** Path segment of /api/users/:userId/queue routes. */
export const queueOwnerParamsSchema = z.object({
	userId: z.uuid('Invalid user ID format').optional(),
});

/**
 * Body of the playback routes (play an item, next, previous, play a playlist):
 * the owner's device that must play; a delegate must send it (#294).
 */
export const queuePlaybackSchema = z
	.object({ deviceId: z.string().min(1).max(128).optional() })
	.optional()
	.transform(body => body ?? {});

/** Path segment of /api/queue/items/:itemId routes. */
export const queueItemParamsSchema = z.object({
	itemId: z
		.uuid('Invalid queue item ID format')
		.meta({ param: { description: 'Id of an item of your queue' } }),
});

/** Path segment of POST /api/queue/playlists/:playlistId/play. */
export const queuePlaylistParamsSchema = z.object({
	playlistId: z
		.uuid('Invalid playlist ID format')
		.meta({ param: { description: 'Id of a playlist you can view' } }),
});

/** Body of POST /api/queue/items/:itemId/move; null = right after the current item. */
export const moveQueueItemSchema = z.object({
	afterItemId: z.uuid('Invalid queue item ID format').nullable(),
});

const deviceIdSchema = z.string().min(1).max(128);

/**
 * Body of POST /api/queue/transfer (#295): play on a device of mine or of a
 * friend. `playing` is an item of my queue or a track played outside it;
 * `source` is the remote device that plays now, to be paused.
 */
export const transferSchema = z.object({
	targetUserId: z.uuid('Invalid user ID format'),
	targetDeviceId: deviceIdSchema,
	positionMs: z.number().int().min(0).max(86_400_000),
	playing: z.union([
		z.object({ queueItemId: z.uuid('Invalid queue item ID format') }),
		z.object({ track: addQueueItemSchema }),
	]),
	source: z
		.object({ userId: z.uuid('Invalid user ID format'), deviceId: deviceIdSchema })
		.optional(),
});

export type TransferInput = z.infer<typeof transferSchema>;

/** Track metadata of a queue item. */
export const queueTrackSchema = z.object({
	trackUri: z.string().meta({
		description: 'SoundCloud permalink URL (never a stream URL)',
		example: 'https://soundcloud.com/artist/track',
	}),
	title: z.string(),
	artist: z.string(),
	album: z.string().nullable(),
	albumArt: z.url().nullable(),
	durationMs: z.int(),
});

export const queueItemSchema = z.object({
	id: z.uuid(),
	rank: z.string().meta({ description: 'Sort key (base-62 fraction); items come sorted by it' }),
	track: queueTrackSchema,
	sourcePlaylistId: z.uuid().nullable(),
	blockId: z
		.uuid()
		.nullable()
		.meta({ description: 'Items queued together from one playlist share a block' }),
	blockDetached: z
		.boolean()
		.meta({ description: 'True once you removed or moved an item of the block' }),
});

/** The whole queue: every queue route answers it, and `queue:updated` carries it. */
export const queueStateSchema = z
	.object({
		ownerId: z.uuid(),
		version: z.int().min(0).meta({ example: 12 }),
		currentItemId: z.uuid().nullable(),
		items: z.array(queueItemSchema),
	})
	.meta({
		description:
			'Items in rank order. Items before the current one are history, those after it upcoming; with `currentItemId` null every item is upcoming. `version` grows with every change: a client drops a state whose version is not above the one it holds. Also the payload of the `queue:updated` socket event.',
	});

/** Answer of POST /api/queue/transfer. */
export const transferResultSchema = z.object({
	ownerId: z.uuid(),
	deviceId: z.string(),
	queue: queueStateSchema
		.nullable()
		.meta({ description: "The friend's new queue; null when the target is one of your devices" }),
});
