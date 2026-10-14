import { z } from 'zod';
import { addTrackSchema } from '@/features/playlists/playlist.validators.js';

/**
 * Body of POST /api/queue/items: a playlist add's track without `previewUrl`,
 * a stream URL that must never be persisted; a sent one is stripped.
 */
export const addQueueItemSchema = addTrackSchema.omit({ previewUrl: true });

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

export type AddQueueItemInput = z.infer<typeof addQueueItemSchema>;
export type MoveQueueItemInput = z.infer<typeof moveQueueItemSchema>;
