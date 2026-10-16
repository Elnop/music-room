import { ApiError } from '@/services/api';
import type { QueueItem, QueueState } from '@/types/queue.types';

/** Past this many seconds played, "previous" restarts the track instead. */
export const RESTART_THRESHOLD_S = 3;

/** What the previous button does at `currentTime` seconds into the track. */
export function previousAction(currentTime: number, hasPrevious: boolean): 'restart' | 'previous' {
	return currentTime > RESTART_THRESHOLD_S || !hasPrevious ? 'restart' : 'previous';
}

/** One owner's queue as the store holds it. */
export interface OwnerQueue {
	currentItemId: string | null;
	items: QueueItem[];
	/** Version of the state held (#285). */
	version: number;
}

type QueueItemsView = Pick<QueueState, 'currentItemId' | 'items'>;

/** The queue of an owner not loaded (yet): stable, so selectors do not re-render. */
export const EMPTY_QUEUE: OwnerQueue = Object.freeze({
	currentItemId: null,
	items: [],
	version: 0,
}) as OwnerQueue;

const currentIndex = (state: QueueItemsView): number =>
	state.currentItemId === null
		? -1
		: state.items.findIndex(item => item.id === state.currentItemId);

export const currentItem = (state: QueueItemsView): QueueItem | undefined =>
	state.items.find(item => item.id === state.currentItemId);

/**
 * The item after the current one, or the first when nothing is current or the
 * current item is no longer in `items`.
 */
export const nextItem = (state: QueueItemsView): QueueItem | undefined =>
	state.items[currentIndex(state) + 1];

/** An owner's queue, or `EMPTY_QUEUE`. */
export const selectQueue = (
	state: { queues: Record<string, OwnerQueue> },
	ownerId: string | null
): OwnerQueue => (ownerId !== null && state.queues[ownerId]) || EMPTY_QUEUE;

/** An upcoming item exists (with nothing current, every item is upcoming). */
export const selectHasNext = (state: QueueItemsView): boolean =>
	currentIndex(state) < state.items.length - 1;

/** A history item exists before the current one. */
export const selectHasPrevious = (state: QueueItemsView): boolean => currentIndex(state) > 0;

/**
 * The queue item this device plays (`playerStore.queueItemId`) was queued from
 * `playlistId`. False for a list-tapped track or an item no longer in the queue.
 */
export const selectPlaysPlaylist = (
	state: QueueItemsView,
	queueItemId: string | null,
	playlistId: string
): boolean =>
	queueItemId !== null &&
	state.items.some(item => item.id === queueItemId && item.sourcePlaylistId === playlistId);

/** French toast for a failed play-playlist request. */
export const playPlaylistError = (error: unknown): string => {
	if (error instanceof ApiError) {
		if (error.code === 'PLAYLIST_EMPTY') return 'Cette playlist est vide';
		if (error.code === 'PLAYLIST_ACCESS_DENIED') return "Vous n'avez pas accès à cette playlist";
		if (error.code === 'PLAYLIST_NOT_FOUND') return "Cette playlist n'existe plus";
	}
	return 'Impossible de lire cette playlist';
};
