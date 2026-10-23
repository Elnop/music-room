import type { z } from 'zod';
import type {
	queueItemSchema,
	queueStateSchema,
	queueTrackSchema,
	transferResultSchema,
} from '@/features/queue/queue.validators.js';

/** `trackUri` is the SoundCloud permalink. */
export type QueueTrack = z.infer<typeof queueTrackSchema>;

/** Items queued together from one playlist share a block; `blockDetached` once one was removed or moved. */
export type QueueItem = z.infer<typeof queueItemSchema>;

/** Items before the current one are history; a client drops a state whose `version` is not newer than its own. */
export type QueueState = z.infer<typeof queueStateSchema>;

export type QueueStepDirection = 'next' | 'previous';

/** `queue` is the target's new queue when it changed, else null. */
export type TransferResult = z.infer<typeof transferResultSchema>;
