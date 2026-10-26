import { create } from 'zustand';
import { getSession } from '@/shared/services/authSession';
import { getPlayback } from '@/shared/services/playbackBridge';
import { queueApi } from '@/features/queue/services/queueApi';
import { useConnectStore, useActiveOwnerId } from '@/features/queue/stores/connectStore';
import { asStep, mutate, runStep } from '@/features/queue/stores/queueStepRunner';
import {
	addItemAction,
	playListTrackAction,
	playNextAction,
	removeItemAction,
} from '@/features/queue/stores/queueItemActions';
import { playPlaylistError, selectQueue } from '@/features/queue/utils/queueSelectors';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { logger } from '@/shared/utils/logger';
import type { OwnerQueue, QueueState, QueueStepOutcome } from '@/features/queue/types';
import type { AddQueueItemBody } from '@/shared/types/playback';
import type { SoundCloudTrack } from '@/types/soundcloud.types';

interface QueueStoreState {
	queues: Record<string, OwnerQueue>;
	loaded: boolean;
	load: (ownerId?: string) => Promise<void>;
	applyState: (state: QueueState) => void;
	setCurrentItem: (ownerId: string, itemId: string, version: number) => void;
	forget: (ownerId: string) => void;
	reset: () => void;
	next: () => Promise<QueueStepOutcome>;
	previous: () => Promise<QueueStepOutcome>;
	addItem: (track: AddQueueItemBody) => Promise<boolean>;
	playNext: (track: AddQueueItemBody) => Promise<boolean>;
	playItem: (itemId: string) => Promise<QueueStepOutcome>;
	removeItem: (itemId: string) => Promise<boolean>;
	moveItem: (itemId: string, afterItemId: string | null) => Promise<boolean>;
	playPlaylist: (playlistId: string, startTrackId?: string) => Promise<QueueStepOutcome>;
	playListTrack: (track: SoundCloudTrack) => Promise<void>;
}

export function useActiveQueue(): OwnerQueue {
	const ownerId = useActiveOwnerId();
	return useQueueStore(state => selectQueue(state, ownerId));
}

export const useQueueStore = create<QueueStoreState>((set, get) => ({
	queues: {},
	loaded: false,

	load: async ownerId => {
		const me = getSession().user?.id;
		try {
			get().applyState(await queueApi.getQueue(ownerId && ownerId !== me ? { ownerId } : {}));
		} catch (error) {
			logger.error('[queueStore] Load failed:', error);
		}
	},

	applyState: state => {
		const me = getSession().user?.id;
		const { target } = useConnectStore.getState();
		const remoteOwner = target.kind === 'remote' ? target.ownerId : null;
		if (state.ownerId !== me && state.ownerId !== remoteOwner) return;
		const held = get().queues[state.ownerId];
		if (held && state.version <= held.version) return;
		set(current => ({
			queues: {
				...current.queues,
				[state.ownerId]: {
					currentItemId: state.currentItemId,
					items: state.items,
					version: state.version,
				},
			},
			loaded: true,
		}));
	},

	setCurrentItem: (ownerId, itemId, version) => {
		const held = get().queues[ownerId];
		if (!held || held.version >= version || held.currentItemId === itemId) return;
		if (!held.items.some(item => item.id === itemId)) return;
		set(current => ({
			queues: { ...current.queues, [ownerId]: { ...held, currentItemId: itemId } },
		}));
	},

	forget: ownerId => {
		if (!(ownerId in get().queues)) return;
		set(current => {
			const queues = { ...current.queues };
			delete queues[ownerId];
			return { queues };
		});
	},

	reset: () => set({ queues: {}, loaded: false }),

	next: async () => {
		const outcome = await runStep(call => queueApi.next(call), 'Next', get().applyState);
		if (outcome === 'boundary' && useConnectStore.getState().target.kind === 'local') {
			getPlayback().stop();
		}
		return outcome;
	},

	previous: () => runStep(call => queueApi.previous(call), 'Previous', get().applyState),

	addItem: track => addItemAction(track, get().applyState),

	playNext: track => playNextAction(track, get().applyState),

	playItem: itemId =>
		runStep(
			asStep(call => queueApi.playItem(itemId, call)),
			'Play item',
			get().applyState,
			{
				errorMessage: error => apiErrorMessage(error, 'Impossible de lire ce titre'),
			}
		),

	removeItem: itemId => removeItemAction(itemId, get().applyState),

	moveItem: (itemId, afterItemId) =>
		mutate(
			call => queueApi.moveItem(itemId, afterItemId, call),
			'Move item',
			get().applyState,
			'Impossible de déplacer ce titre'
		),

	playPlaylist: (playlistId, startTrackId) =>
		runStep(
			asStep(call => queueApi.playPlaylist(playlistId, call, startTrackId)),
			'Play playlist',
			get().applyState,
			{ errorMessage: playPlaylistError }
		),

	playListTrack: track => playListTrackAction(track, get().applyState),
}));
