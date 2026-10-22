import { useEffect, useRef } from 'react';
import { useSocketStore } from '@/shared/stores/socketStore';
import { useQueueStore } from '@/store/queueStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useConnectStore } from '@/store/connectStore';
import type { QueueState } from '@/types/queue.types';

/** The remote owner while the phone drives another user's device, else null. */
const remoteOwnerId = (): string | null => {
	const { target } = useConnectStore.getState();
	return target.kind === 'remote' ? target.ownerId : null;
};

/**
 * Keeps the queue store in sync with the server queues (#274).
 *
 * Loads my queue on mount and again on every socket reconnect, since events
 * sent while disconnected are lost (the remote owner's queue too, #297), and
 * applies each `queue:updated` (sent to all of the user's devices, and to the
 * delegates listening to them). An event never touches this device's audio.
 * Resets the store on unmount (sign-out). Only my queue and the queue of the
 * owner whose device the phone drives are kept; another owner's state is dropped.
 */
export function useQueueSync() {
	const socket = useSocketStore(state => state.socket);
	const isConnected = useSocketStore(state => state.isConnected);
	const load = useQueueStore(state => state.load);
	const applyState = useQueueStore(state => state.applyState);
	const reset = useQueueStore(state => state.reset);
	const userId = useAuthStore(state => state.user?.id);
	const userIdRef = useRef(userId);
	/** Set once the socket connected; a later connect is a reconnect. */
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

		// The mount load covers the first connect; a reconnect refetches.
		if (connectedOnceRef.current) {
			load();
			const remoteOwner = remoteOwnerId();
			if (remoteOwner && remoteOwner !== userIdRef.current) load(remoteOwner);
		}
		connectedOnceRef.current = true;

		const handleQueueUpdated = (state: QueueState) => {
			if (state.ownerId !== userIdRef.current && state.ownerId !== remoteOwnerId()) return;
			applyState(state);
		};

		socket.on('queue:updated', handleQueueUpdated);
		return () => {
			socket.off('queue:updated', handleQueueUpdated);
		};
	}, [socket, isConnected, load, applyState]);
}
