import type { z } from 'zod';
import type {
	queueItemSchema,
	queueStateSchema,
	queueTrackSchema,
	transferResultSchema,
} from '@/features/queue/queue.validators.js';

export type QueueTrack = z.infer<typeof queueTrackSchema>;

export type QueueItem = z.infer<typeof queueItemSchema>;

export type QueueState = z.infer<typeof queueStateSchema>;

export type QueueStepDirection = 'next' | 'previous';

export type TransferResult = z.infer<typeof transferResultSchema>;
