import { useEffect, useCallback, useMemo, useState } from 'react';
import { useSocketStore } from '@/shared/stores/socketStore';
import { acquireListening, releaseListening } from '@/shared/services/listeningRooms';
import type { ListeningStatus, UserListeningStatus } from '@/types/listening.types';
import { logger } from '@/shared/utils/logger';
import type { FriendDeviceStatus, FriendListeningResult } from '@/features/music-control/types';
import { useControllableDevices } from './useControllableDevices';

export function useFriendListening(targetUserId: string | null): FriendListeningResult {
	const socket = useSocketStore(state => state.socket);
	const isConnected = useSocketStore(state => state.isConnected);

	const { canControl, isControllable, controlError } = useControllableDevices(targetUserId);

	const [rawStatuses, setRawStatuses] = useState<ListeningStatus[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const statuses = useMemo(() => (canControl ? rawStatuses : []), [canControl, rawStatuses]);

	useEffect(() => {
		if (!socket || !isConnected || !targetUserId || !canControl) {
			return;
		}

		let subscribed = false;
		const subscribeTimer = setTimeout(() => {
			setIsLoading(true);
			setError(null);
			acquireListening(socket, targetUserId);
			subscribed = true;
		}, 200);

		const handleStatus = (status: UserListeningStatus) => {
			if (status.ownerId === targetUserId) {
				setRawStatuses(status.devices);
				setIsLoading(false);
			}
		};

		const handleError = (err: { message: string; code: string }) => {
			logger.error('[MusicControl] Error:', err);
			setError(err.message);
			setIsLoading(false);
		};

		socket.on('listening:status', handleStatus);
		socket.on('listening:error', handleError);

		return () => {
			clearTimeout(subscribeTimer);
			socket.off('listening:status', handleStatus);
			socket.off('listening:error', handleError);
			if (subscribed) {
				releaseListening(socket, targetUserId);
			}
		};
	}, [socket, isConnected, targetUserId, canControl]);

	const devices = useMemo<FriendDeviceStatus[]>(
		() =>
			statuses.map(status => ({
				...status,
				controllable: isControllable(status.device.deviceId),
			})),
		[statuses, isControllable]
	);

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

	return {
		devices,
		canControl,
		isLoading,
		error,
		controlError,
		remotePlay,
		remotePause,
	};
}
