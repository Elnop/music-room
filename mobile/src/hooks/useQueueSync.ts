import { useEffect, useRef } from 'react';
import { useSocketStore } from '@store/socketStore';
import { useQueueStore } from '@store/queueStore';
import { useAuthStore } from '@store/authStore';
import type { QueueState } from '@/types/queue.types';

/**
 * Keeps the queue store in sync with the server queue (#274).
 *
 * Loads the queue on mount and again on every socket reconnect, since events
 * sent while disconnected are lost, and replaces it on each `queue:updated` (sent
 * to all of the user's devices). An event never touches this device's audio.
 * Resets the store on unmount (sign-out). A state for another owner (the server
 * also sends a friend's queue to a delegate listening to them) is ignored: the
 * store holds only the signed-in user's queue until it becomes multi-owner (#297).
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
		if (connectedOnceRef.current) load();
		connectedOnceRef.current = true;

		const handleQueueUpdated = (state: QueueState) => {
			if (state.ownerId !== userIdRef.current) return;
			if (__DEV__) console.log('[Socket] Queue updated', state.currentItemId);
			applyState(state);
		};

		socket.on('queue:updated', handleQueueUpdated);
		return () => {
			socket.off('queue:updated', handleQueueUpdated);
		};
	}, [socket, isConnected, load, applyState]);
}
