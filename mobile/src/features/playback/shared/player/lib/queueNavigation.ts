import type { QueueItem } from '@/shared/playback/lib/playback';

export const RESTART_THRESHOLD_S = 3;

export function previousAction(currentTime: number, hasPrevious: boolean): 'restart' | 'previous' {
	return currentTime > RESTART_THRESHOLD_S || !hasPrevious ? 'restart' : 'previous';
}

interface QueueItemsView {
	currentItemId: string | null;
	items: QueueItem[];
}

function currentIndex(state: QueueItemsView): number {
	return state.currentItemId === null
		? -1
		: state.items.findIndex(item => item.id === state.currentItemId);
}

export function currentItem(state: QueueItemsView): QueueItem | undefined {
	return state.items.find(item => item.id === state.currentItemId);
}

export function nextItem(state: QueueItemsView): QueueItem | undefined {
	return state.items[currentIndex(state) + 1];
}

export function selectHasNext(state: QueueItemsView): boolean {
	return currentIndex(state) < state.items.length - 1;
}

export function selectHasPrevious(state: QueueItemsView): boolean {
	return currentIndex(state) > 0;
}
