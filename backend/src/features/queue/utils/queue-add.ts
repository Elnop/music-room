import { logger } from '@/shared/utils/logger.js';
import { upsertTrack, type TrackUpsertInput } from '@/shared/utils/track-upsert.js';
import { addQueueItemRpc, moveQueueItemRpc } from '@/features/queue/utils/queue-rpc.js';
import type { QueueState } from '@/features/queue/queue.types.js';

interface QueueAddResult {
	state: QueueState;
	operation: 'add' | 'add-next';
}

export async function addTrackToQueue(
	ownerId: string,
	track: TrackUpsertInput,
	next = false
): Promise<QueueAddResult> {
	const trackRow = await upsertTrack({ ...track, previewUrl: undefined });
	const added = await addQueueItemRpc(ownerId, trackRow.id);
	if (!next) return { state: added, operation: 'add' };
	const appendedItem = added.items[added.items.length - 1];
	try {
		return { state: await moveQueueItemRpc(ownerId, appendedItem.id, null), operation: 'add-next' };
	} catch (error) {
		logger.warn('Queue add-next: move refused, item left at the end', {
			ownerId,
			itemId: appendedItem.id,
			error: error instanceof Error ? error.message : String(error),
		});
		return { state: added, operation: 'add' };
	}
}
