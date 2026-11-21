import { useEffect, useRef } from 'react';
import { useSession } from '@/shared/backend/hooks/useSession';
import { useSocketState } from '@/shared/backend/hooks/useSocketState';
import { reloadQueues, watchQueueUpdates } from '@/features/playback/lib/queueUpdates';
import type { QueueStoreState } from '@/features/playback/shared/player/types/queueTypes';

export function useQueueUpdates(
	load: QueueStoreState['load'],
	applyState: QueueStoreState['applyState']
): void {
	const socket = useSocketState(state => state.socket);
	const isConnected = useSocketState(state => state.isConnected);
	const userId = useSession(state => state?.user?.id);
	const userIdRef = useRef(userId);
	const connectedOnceRef = useRef(false);

	useEffect(() => {
		userIdRef.current = userId;
	}, [userId]);

	useEffect(() => {
		if (!socket || !isConnected) return;
		if (connectedOnceRef.current) reloadQueues(load, userIdRef.current);
		connectedOnceRef.current = true;
		return watchQueueUpdates(socket, applyState, () => userIdRef.current);
	}, [socket, isConnected, load, applyState]);
}
