import type { QueueItem } from '@/shared/types/playback';

/** Past this many seconds played, "previous" restarts the track instead. */
export const RESTART_THRESHOLD_S = 3;

/** What the previous button does at `currentTime` seconds into the track. */
export function previousAction(currentTime: number, hasPrevious: boolean): 'restart' | 'previous' {
	return currentTime > RESTART_THRESHOLD_S || !hasPrevious ? 'restart' : 'previous';
}

interface QueueItemsView {
	currentItemId: string | null;
	items: QueueItem[];
}

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

/** An upcoming item exists (with nothing current, every item is upcoming). */
export const selectHasNext = (state: QueueItemsView): boolean =>
	currentIndex(state) < state.items.length - 1;

/** A history item exists before the current one. */
export const selectHasPrevious = (state: QueueItemsView): boolean => currentIndex(state) > 0;
