import { getSession } from '@/shared/backend/lib/authSession';
import { logger } from '@/shared/logging/logger';
import { queueApi } from '@/features/playback/shared/player/lib/queueApi';
import { connectStore } from '@/features/playback/shared/player/stores/connectStore';
import type {
	QueueGet,
	QueueSet,
	QueueState,
	QueueStoreState,
} from '@/features/playback/shared/player/types/queueTypes';

type QueueHoldActions = Pick<QueueStoreState, 'load' | 'applyState'>;

type QueueOwnerActions = Pick<QueueStoreState, 'setCurrentItem' | 'forget'>;

function isHeldOwner(ownerId: string): boolean {
	const { target } = connectStore.getState();
	const remoteOwner = target.kind === 'remote' ? target.ownerId : null;
	return ownerId === getSession().user?.id || ownerId === remoteOwner;
}

function applyQueueState(set: QueueSet, get: QueueGet, state: QueueState): void {
	if (!isHeldOwner(state.ownerId)) return;
	const held = get().queues[state.ownerId];
	if (held && state.version <= held.version) return;
	set((current) => ({
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
}

export function queueHoldActions(set: QueueSet, get: QueueGet): QueueHoldActions {
	return {
		load: async (ownerId) => {
			const me = getSession().user?.id;
			try {
				get().applyState(await queueApi.getQueue(ownerId && ownerId !== me ? { ownerId } : {}));
			} catch (error) {
				logger.error('[queueStore] Load failed:', error);
			}
		},
		applyState: (state) => applyQueueState(set, get, state),
	};
}

export function queueOwnerActions(set: QueueSet, get: QueueGet): QueueOwnerActions {
	return {
		setCurrentItem: (ownerId, itemId, version) => {
			const held = get().queues[ownerId];
			if (!held || held.version >= version || held.currentItemId === itemId) return;
			if (!held.items.some((item) => item.id === itemId)) return;
			set((current) => ({
				queues: { ...current.queues, [ownerId]: { ...held, currentItemId: itemId } },
			}));
		},
		forget: (ownerId) => {
			if (!(ownerId in get().queues)) return;
			set((current) => {
				const queues = { ...current.queues };
				delete queues[ownerId];
				return { queues };
			});
		},
	};
}
