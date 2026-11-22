import { createStore } from 'zustand';
import { queueApi } from '@/features/playback/shared/player/lib/queueApi';
import {
	queueHoldActions,
	queueOwnerActions,
} from '@/features/playback/shared/player/lib/queueHoldActions';
import { queueStepActions } from '@/features/playback/shared/player/lib/queueStepActions';
import { mutate } from '@/features/playback/shared/player/lib/queueStepRunner';
import {
	addItemAction,
	playListTrackAction,
	playNextAction,
	removeItemAction,
} from '@/features/playback/shared/player/lib/queueItemActions';
import type { QueueStoreState } from '@/features/playback/shared/player/types/queueTypes';

export const queueStore = createStore<QueueStoreState>((set, get) => ({
	queues: {},
	loaded: false,
	...queueHoldActions(set, get),
	...queueOwnerActions(set, get),
	...queueStepActions(get),
	reset: () => set({ queues: {}, loaded: false }),
	addItem: (track) => addItemAction(track, get().applyState),
	playNext: (track) => playNextAction(track, get().applyState),
	removeItem: (itemId) => removeItemAction(itemId, get().applyState),
	moveItem: (itemId, afterItemId) =>
		mutate(
			(call) => queueApi.moveItem(itemId, afterItemId, call),
			'Move item',
			get().applyState,
			'Impossible de déplacer ce titre',
		),
	playListTrack: (track) => playListTrackAction(track, get().applyState),
}));
