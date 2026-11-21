import { useCallback } from 'react';
import { useSocketState } from '@/shared/backend/hooks/useSocketState';

export function useRemoteActions(
	targetUserId: string | null,
	isControllable: (deviceId: string) => boolean
) {
	const socket = useSocketState(state => state.socket);
	const isConnected = useSocketState(state => state.isConnected);

	const sendAction = useCallback(
		(targetDeviceId: string, action: 'play' | 'pause') => {
			if (!socket || !isConnected || !targetUserId) return;
			if (!isControllable(targetDeviceId)) return;
			socket.emit('control:action', { targetUserId, targetDeviceId, action });
		},
		[socket, isConnected, targetUserId, isControllable]
	);

	const remotePlay = useCallback(
		(targetDeviceId: string) => sendAction(targetDeviceId, 'play'),
		[sendAction]
	);
	const remotePause = useCallback(
		(targetDeviceId: string) => sendAction(targetDeviceId, 'pause'),
		[sendAction]
	);

	return { remotePlay, remotePause };
}
