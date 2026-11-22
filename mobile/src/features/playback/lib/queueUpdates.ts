import type { Socket } from 'socket.io-client';
import { connectStore } from '@/features/playback/shared/player/stores/connectStore';
import type {
	QueueState,
	QueueStoreState,
} from '@/features/playback/shared/player/types/queueTypes';

function remoteOwnerId(): string | null {
	const { target } = connectStore.getState();
	return target.kind === 'remote' ? target.ownerId : null;
}

export function reloadQueues(load: QueueStoreState['load'], userId: string | undefined): void {
	load();
	const remoteOwner = remoteOwnerId();
	if (remoteOwner && remoteOwner !== userId) load(remoteOwner);
}

export function watchQueueUpdates(
	socket: Socket,
	applyState: QueueStoreState['applyState'],
	currentUserId: () => string | undefined,
): () => void {
	function handleQueueUpdated(state: QueueState) {
		if (state.ownerId !== currentUserId() && state.ownerId !== remoteOwnerId()) return;
		applyState(state);
	}
	socket.on('queue:updated', handleQueueUpdated);
	return () => {
		socket.off('queue:updated', handleQueueUpdated);
	};
}
