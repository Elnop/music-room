import { create } from 'zustand';
import { queueApi } from '@/services/queueApi';
import { usePlayerStore } from '@/store/playerStore';
import { trackToSoundCloud } from '@utils/trackToSoundCloud';
import { showError, showInfo, showSuccess } from '@utils/toast';
import type { AddQueueItemBody, QueueItem, QueueState, QueueStepResult } from '@/types/queue.types';

/** Past this many seconds played, "previous" restarts the track instead. */
export const RESTART_THRESHOLD_S = 3;

/** What the previous button does at `currentTime` seconds into the track. */
export function previousAction(currentTime: number, hasPrevious: boolean): 'restart' | 'previous' {
	return currentTime > RESTART_THRESHOLD_S || !hasPrevious ? 'restart' : 'previous';
}

/**
 * Outcome of a step: the new current item plays, the queue has no current
 * item left (playback stopped when asked), at a queue boundary, failed, or
 * ignored because another step was still pending.
 */
export type QueueStepOutcome = 'played' | 'stopped' | 'boundary' | 'error' | 'ignored';

/** True while a request that changes the current item is in flight. */
let stepPending = false;

interface StepOptions {
	/** Toast shown when the request fails; none for next/previous. */
	errorMessage?: string;
	/** Stop playback when the returned queue has no current item. */
	stopWhenEmpty?: boolean;
}

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
	/**
	 * Append a track to the end of the queue and toast the outcome; resolves
	 * true once added. Never changes what is playing.
	 */
	addItem: (track: AddQueueItemBody) => Promise<boolean>;
	/** Make an item current and play it on this device. */
	playItem: (itemId: string) => Promise<QueueStepOutcome>;
	/**
	 * Remove an item; resolves true once the server removed it. Removing the
	 * item this device plays starts the item the server makes current, or
	 * stops playback when none is left; otherwise playback is untouched.
	 */
	removeItem: (itemId: string) => Promise<boolean>;
	/** Move an upcoming item after `afterItemId` (null = right after the current item). */
	moveItem: (itemId: string, afterItemId: string | null) => Promise<boolean>;
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
 * Mirror of the server play queue (#274). `queue:updated` and every action
 * replace it whole. Actions of this device that change the current item
 * (next / previous, play or remove an item, #276) start audio; an event never does.
 * Stream URLs are fetched by the player on demand, never kept here.
 */
export const useQueueStore = create<QueueStoreState>((set, get) => {
	/**
	 * Run a step, apply the returned state and play its current item. A track
	 * started elsewhere while the request ran (a list tap) wins over the step.
	 */
	const runStep = async (
		request: () => Promise<QueueStepResult>,
		label: string,
		{ errorMessage, stopWhenEmpty = false }: StepOptions = {}
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
			if (errorMessage) showError(errorMessage);
			return 'error';
		} finally {
			stepPending = false;
		}
		if (!result.ok) return 'boundary';

		get().applyState(result.state);
		const item = currentItem(result.state);
		const player = usePlayerStore.getState();
		if (player.loadCounter !== loadCounter) return 'played';
		if (item) {
			player.playTrack(trackToSoundCloud(item), item.id);
			return 'played';
		}
		if (stopWhenEmpty) player.stop();
		return 'stopped';
	};

	/** A queue request that returns the whole state, as a step result. */
	const asStep = (request: () => Promise<QueueState>) => async (): Promise<QueueStepResult> => ({
		ok: true,
		state: await request(),
	});

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

		addItem: async track => {
			try {
				get().applyState(await queueApi.addItem(track));
			} catch (error) {
				console.error('[queueStore] Add failed:', error);
				showError(
					error instanceof Error && error.message
						? error.message
						: "Impossible d'ajouter à la file de lecture"
				);
				return false;
			}
			showSuccess('Ajouté à la file de lecture');
			return true;
		},

		playItem: itemId =>
			runStep(
				asStep(() => queueApi.playItem(itemId)),
				'Play item',
				{ errorMessage: 'Impossible de lire ce titre' }
			),

		removeItem: async itemId => {
			const errorMessage = 'Impossible de retirer ce titre';
			// Removing the item this device plays changes what it plays: it goes
			// through the step guard. A list-tapped track or another item keeps playing.
			if (usePlayerStore.getState().queueItemId === itemId) {
				const outcome = await runStep(
					asStep(() => queueApi.removeItem(itemId)),
					'Remove current item',
					{ errorMessage, stopWhenEmpty: true }
				);
				if (outcome === 'ignored') showInfo('Une action est déjà en cours');
				return outcome === 'played' || outcome === 'stopped';
			}
			try {
				get().applyState(await queueApi.removeItem(itemId));
				return true;
			} catch (error) {
				console.error('[queueStore] Remove item failed:', error);
				showError(errorMessage);
				return false;
			}
		},

		moveItem: async (itemId, afterItemId) => {
			try {
				get().applyState(await queueApi.moveItem(itemId, afterItemId));
				return true;
			} catch (error) {
				console.error('[queueStore] Move item failed:', error);
				showError('Impossible de déplacer ce titre');
				return false;
			}
		},
	};
});
