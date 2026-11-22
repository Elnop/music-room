import { useEffect, useState } from 'react';
import { useSocketState } from '@/shared/backend/hooks/useSocketState';
import { subscribeListening } from '@/features/playback/features/control-delegation/lib/subscribeListening';
import type { ListeningState } from '@/features/playback/features/control-delegation/controlDelegationTypes';

export function useListeningStatuses(targetUserId: string | null, canControl: boolean) {
	const socket = useSocketState((state) => state.socket);
	const isConnected = useSocketState((state) => state.isConnected);
	const [listening, setListening] = useState<ListeningState>({
		statuses: [],
		isLoading: false,
		error: null,
	});

	useEffect(() => {
		if (!socket || !isConnected || !targetUserId || !canControl) return;
		return subscribeListening(socket, targetUserId, setListening);
	}, [socket, isConnected, targetUserId, canControl]);

	return listening;
}
