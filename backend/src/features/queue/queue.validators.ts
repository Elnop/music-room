import { z } from 'zod';
import { addTrackSchema } from '@/features/playlists/playlist.validators.js';

/**
 * Body of POST /api/queue/items: a playlist add's track without `previewUrl`,
 * a stream URL that must never be persisted; a sent one is stripped.
 */
export const addQueueItemSchema = addTrackSchema.omit({ previewUrl: true });

/** Path segment of /api/queue/items/:itemId routes. */
export const queueItemParamsSchema = z.object({
	itemId: z.uuid('Invalid queue item ID format'),
});

/** Body of POST /api/queue/items/:itemId/move; null = right after the current item. */
export const moveQueueItemSchema = z.object({
	afterItemId: z.uuid('Invalid queue item ID format').nullable(),
});

export type AddQueueItemInput = z.infer<typeof addQueueItemSchema>;
export type MoveQueueItemInput = z.infer<typeof moveQueueItemSchema>;
