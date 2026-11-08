import type { z } from 'zod';
import type {
	queueItemSchema,
	queueStateSchema,
	queueTrackSchema,
	transferResultSchema,
} from '@/features/queue/queue.validators.js';

export type QueueTrack = z.infer<typeof queueTrackSchema>;

/** Items queued from one playlist share a block, `blockDetached` once one was removed or moved. */
export type QueueItem = z.infer<typeof queueItemSchema>;

/** A client drops a state whose `version` is not newer than its own. */
export type QueueState = z.infer<typeof queueStateSchema>;

export type QueueStepDirection = 'next' | 'previous';

export type TransferResult = z.infer<typeof transferResultSchema>;
