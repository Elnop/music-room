import { logger } from '@/shared/utils/logger.js';
import { upsertTrack, type TrackUpsertInput } from '@/shared/utils/track-upsert.js';
import { addQueueItemRpc, moveQueueItemRpc } from '@/features/queue/utils/queue-rpc.js';
import type { QueueState } from '@/features/queue/queue.types.js';

interface QueueAddResult {
	state: QueueState;
	/** 'add-next' once the new item was moved after the current one, else 'add'. */
	operation: 'add' | 'add-next';
}

/**
 * Appends the track to ownerId's queue; with `next`, then moves the new item
 * right after the current one (at the top when nothing is current, #316).
 * Add and move are two RPCs: when the move is refused (another device changed
 * the queue in between), the item stays appended and the add's state is kept.
 */
export async function addTrackToQueue(
	ownerId: string,
	track: TrackUpsertInput,
	next = false
): Promise<QueueAddResult> {
	// previewUrl is a stream URL: never persisted from a queue add.
	const trackRow = await upsertTrack({ ...track, previewUrl: undefined });
	const added = await addQueueItemRpc(ownerId, trackRow.id);
	if (!next) return { state: added, operation: 'add' };
	// The add appends: the new item is the last one.
	const item = added.items[added.items.length - 1];
	try {
		return { state: await moveQueueItemRpc(ownerId, item.id, null), operation: 'add-next' };
	} catch (error) {
		logger.warn('Queue add-next: move refused, item left at the end', {
			ownerId,
			itemId: item.id,
			error: error instanceof Error ? error.message : String(error),
		});
		return { state: added, operation: 'add' };
	}
}
