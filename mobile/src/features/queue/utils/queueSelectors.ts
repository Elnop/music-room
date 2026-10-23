import { ApiError } from '@/shared/services/api';
import type { QueueState, OwnerQueue } from '@/features/queue/types';

export {
	previousAction,
	currentItem,
	nextItem,
	selectHasNext,
	selectHasPrevious,
} from '@/shared/utils/queueNavigation';

type QueueItemsView = Pick<QueueState, 'currentItemId' | 'items'>;

export const EMPTY_QUEUE: OwnerQueue = Object.freeze({
	currentItemId: null,
	items: [],
	version: 0,
}) as OwnerQueue;

export const selectQueue = (
	state: { queues: Record<string, OwnerQueue> },
	ownerId: string | null
): OwnerQueue => (ownerId !== null && state.queues[ownerId]) || EMPTY_QUEUE;

export const selectPlaysPlaylist = (
	state: QueueItemsView,
	queueItemId: string | null,
	playlistId: string
): boolean =>
	queueItemId !== null &&
	state.items.some(item => item.id === queueItemId && item.sourcePlaylistId === playlistId);

export const playPlaylistError = (error: unknown): string => {
	if (error instanceof ApiError) {
		if (error.code === 'PLAYLIST_EMPTY') return 'Cette playlist est vide';
		if (error.code === 'PLAYLIST_ACCESS_DENIED') return "Vous n'avez pas accès à cette playlist";
		if (error.code === 'PLAYLIST_NOT_FOUND') return "Cette playlist n'existe plus";
	}
	return 'Impossible de lire cette playlist';
};
