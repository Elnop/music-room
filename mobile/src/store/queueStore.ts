import { create } from 'zustand';
import { queueApi } from '@/services/queueApi';
import { usePlayerStore } from '@/store/playerStore';
import { trackToSoundCloud } from '@utils/trackToSoundCloud';
import type { QueueItem, QueueState, QueueStepResult } from '@/types/queue.types';

/** Past this many seconds played, "previous" restarts the track instead. */
export const RESTART_THRESHOLD_S = 3;

/** What the previous button does at `currentTime` seconds into the track. */
export function previousAction(currentTime: number, hasPrevious: boolean): 'restart' | 'previous' {
	return currentTime > RESTART_THRESHOLD_S || !hasPrevious ? 'restart' : 'previous';
}

/**
 * Outcome of a step: playing the new current item, at a queue boundary,
 * failed, or ignored because another step was still pending.
 */
export type QueueStepOutcome = 'played' | 'boundary' | 'error' | 'ignored';

/** True while a next/previous request is in flight. */
let stepPending = false;

interface QueueStoreState extends QueueState {
	/** True once the server queue was read at least once. */
	loaded: boolean;
	load: () => Promise<void>;
	applyState: (state: QueueState) => void;
	reset: () => void;
	/** Step to the next item and play it; at the queue end, stop playback. */
	next: () => Promise<QueueStepOutcome>;
	/** Step to the previous item and play it; nothing happens at the queue start. */
	previous: () => Promise<QueueStepOutcome>;
}

const initialState: QueueState & { loaded: boolean } = {
	currentItemId: null,
	items: [],
	loaded: false,
};

const currentIndex = (state: QueueState): number =>
	state.currentItemId === null
		? -1
		: state.items.findIndex(item => item.id === state.currentItemId);

/** An upcoming item exists (with nothing current, every item is upcoming). */
export const selectHasNext = (state: QueueState): boolean =>
	currentIndex(state) < state.items.length - 1;

/** A history item exists before the current one. */
export const selectHasPrevious = (state: QueueState): boolean => currentIndex(state) > 0;

const currentItem = (state: QueueState): QueueItem | undefined =>
	state.items.find(item => item.id === state.currentItemId);

/**
 * Mirror of the server play queue (#274). `queue:updated` and every step
 * replace it whole; only `next` / `previous` start audio, never an event.
 * Stream URLs are fetched by the player on demand, never kept here.
 */
export const useQueueStore = create<QueueStoreState>((set, get) => {
	/**
	 * Run a step, apply the returned state and play its current item. A track
	 * started elsewhere while the request ran (a list tap) wins over the step.
	 */
	const runStep = async (
		request: () => Promise<QueueStepResult>,
		label: string
	): Promise<QueueStepOutcome> => {
		// One step at a time: a second tap would move the server queue twice.
		if (stepPending) return 'ignored';
		stepPending = true;
		const loadCounter = usePlayerStore.getState().loadCounter;
		let result: QueueStepResult;
		try {
			result = await request();
		} catch (error) {
			console.error(`[queueStore] ${label} failed:`, error);
			return 'error';
		} finally {
			stepPending = false;
		}
		if (!result.ok) return 'boundary';

		get().applyState(result.state);
		const item = currentItem(result.state);
		const player = usePlayerStore.getState();
		if (item && player.loadCounter === loadCounter) {
			player.playTrack(trackToSoundCloud(item), item.id);
		}
		return 'played';
	};

	return {
		...initialState,

		load: async () => {
			try {
				get().applyState(await queueApi.getQueue());
			} catch (error) {
				console.error('[queueStore] Load failed:', error);
			}
		},

		applyState: state => {
			set({ currentItemId: state.currentItemId, items: state.items, loaded: true });
		},

		reset: () => {
			set(initialState);
		},

		next: async () => {
			const outcome = await runStep(queueApi.next, 'Next');
			if (outcome === 'boundary') usePlayerStore.getState().stop();
			return outcome;
		},

		previous: () => runStep(queueApi.previous, 'Previous'),
	};
});
