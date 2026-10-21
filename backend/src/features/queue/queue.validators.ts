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
	itemId: z.uuid('Invalid queue item ID format'),
});

/** Path segment of POST /api/queue/playlists/:playlistId/play. */
export const queuePlaylistParamsSchema = z.object({
	playlistId: z.uuid('Invalid playlist ID format'),
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
