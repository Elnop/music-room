import { useEffect, useRef } from 'react';
import { useSocketStore } from '@/shared/backend/socketStore';
import { useQueueStore } from '@/features/playback/shared/player/stores/queueStore';
import { useSession } from '@/shared/backend/lib/authSession';
import { useConnectStore } from '@/features/playback/shared/player/stores/connectStore';
import type { QueueState } from '@/features/playback/shared/player/lib/queue.types';

function remoteOwnerId(): string | null {
	const { target } = useConnectStore.getState();
	return target.kind === 'remote' ? target.ownerId : null;
}

export function useQueueSync(): void {
	const socket = useSocketStore(state => state.socket);
	const isConnected = useSocketStore(state => state.isConnected);
	const load = useQueueStore(state => state.load);
	const applyState = useQueueStore(state => state.applyState);
	const reset = useQueueStore(state => state.reset);
	const userId = useSession(state => state?.user?.id);
	const userIdRef = useRef(userId);
	const connectedOnceRef = useRef(false);

	useEffect(() => {
		userIdRef.current = userId;
	}, [userId]);

	useEffect(() => {
		load();
		return () => reset();
	}, [load, reset]);

	useEffect(() => {
		if (!socket || !isConnected) return;

		if (connectedOnceRef.current) {
			load();
			const remoteOwner = remoteOwnerId();
			if (remoteOwner && remoteOwner !== userIdRef.current) load(remoteOwner);
		}
		connectedOnceRef.current = true;

		function handleQueueUpdated(state: QueueState) {
			if (state.ownerId !== userIdRef.current && state.ownerId !== remoteOwnerId()) return;
			applyState(state);
		}

		socket.on('queue:updated', handleQueueUpdated);
		return () => {
			socket.off('queue:updated', handleQueueUpdated);
		};
	}, [socket, isConnected, load, applyState]);
}
