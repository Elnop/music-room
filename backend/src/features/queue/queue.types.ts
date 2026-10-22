/**
 * Response and domain types of the play queue (#273): one queue per user,
 * shared by all of their devices. Inferred from the response schemas of
 * queue.validators.ts; request inputs are inferred there too.
 */

import type { z } from 'zod';
import type {
	queueItemSchema,
	queueStateSchema,
	queueTrackSchema,
	transferResultSchema,
} from '@/features/queue/queue.validators.js';

/** Track metadata of a queue item; `trackUri` is the SoundCloud permalink. */
export type QueueTrack = z.infer<typeof queueTrackSchema>;

/** Items queued together from one playlist share a block; `blockDetached` once one was removed or moved. */
export type QueueItem = z.infer<typeof queueItemSchema>;

/**
 * The whole queue, items in rank order. Items ranked before the current one
 * are history, those after it upcoming; with `currentItemId` null every item
 * is upcoming. `version` grows with every change: a client drops a state not
 * newer than its own (#285). Every endpoint returns it, and `queue:updated` carries it.
 */
export type QueueState = z.infer<typeof queueStateSchema>;

export type QueueStepDirection = 'next' | 'previous';

/** Answer of POST /api/queue/transfer (#295); `queue` is the target's new queue when it changed, else null. */
export type TransferResult = z.infer<typeof transferResultSchema>;
