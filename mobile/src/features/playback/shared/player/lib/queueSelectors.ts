import { EMPTY_QUEUE } from '@/features/playback/shared/player/configs/playerConfig';
import type { QueueState, OwnerQueue } from '@/features/playback/shared/player/types/queueTypes';

type QueueItemsView = Pick<QueueState, 'currentItemId' | 'items'>;

export function selectQueue(
	state: { queues: Record<string, OwnerQueue> },
	ownerId: string | null,
): OwnerQueue {
	return (ownerId !== null && state.queues[ownerId]) || EMPTY_QUEUE;
}

export function selectPlaysPlaylist(
	state: QueueItemsView,
	queueItemId: string | null,
	playlistId: string,
): boolean {
	return (
		queueItemId !== null &&
		state.items.some((item) => item.id === queueItemId && item.sourcePlaylistId === playlistId)
	);
}
