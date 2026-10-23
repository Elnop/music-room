import { useEffect } from 'react';
import { useSocketStore } from '@/shared/stores/socketStore';
import { useSession } from '@/shared/services/authSession';
import { useConnectStore } from '@/features/queue/stores/connectStore';
import { useQueueStore } from '@/features/queue/stores/queueStore';
import { controlErrorMessage, type ControlError } from '@/shared/utils/controlError';
import { acquireListening, releaseListening } from '@/services/listeningRooms';
import { showError } from '@/shared/utils/toast';
import type { UserListeningStatus } from '@/types/listening.types';
import type { ControlRevokedPayload } from '@/types/device.types';
import { logger } from '@/shared/utils/logger';

export function useRemoteTarget(): void {
	const socket = useSocketStore(state => state.socket);
	const isConnected = useSocketStore(state => state.isConnected);
	const userId = useSession(state => state?.user?.id ?? null);
	const ownerId = useConnectStore(state =>
		state.target.kind === 'remote' ? state.target.ownerId : null
	);
	const deviceId = useConnectStore(state =>
		state.target.kind === 'remote' ? state.target.deviceId : null
	);

	useEffect(() => {
		if (!ownerId || ownerId === userId) return;
		const { load, forget } = useQueueStore.getState();
		void load(ownerId);
		return () => forget(ownerId);
	}, [ownerId, userId]);

	useEffect(() => {
		if (!socket || !isConnected || !ownerId || !deviceId) return;
		const { setLocal, setRemoteStatus, setControlPending } = useConnectStore.getState();

		const handleStatus = (status: UserListeningStatus) => {
			if (status.ownerId !== ownerId) return;
			const device = status.devices.find(d => d.device.deviceId === deviceId);
			if (!device) {
				setLocal('Appareil hors ligne');
				return;
			}
			setRemoteStatus(device);
		};

		const handleRevoked = (payload: ControlRevokedPayload) => {
			if (payload.ownerId === ownerId) setLocal('Accès retiré');
		};

		const handleListeningError = (err: { code: string; message: string }) => {
			logger.error('[RemoteTarget] Listening error:', err);
			if (err.code === 'NOT_AUTHORIZED') setLocal('Accès refusé à cet appareil');
		};

		const handleControlError = (err: ControlError) => {
			if (!useConnectStore.getState().controlPending) return;
			setControlPending(false);
			logger.error('[RemoteTarget] Control error:', err);
			showError(controlErrorMessage(err));
		};

		const handleControlSuccess = (reply: { targetUserId: string; targetDeviceId: string }) => {
			if (reply.targetUserId === ownerId && reply.targetDeviceId === deviceId) {
				setControlPending(false);
			}
		};

		socket.on('listening:status', handleStatus);
		socket.on('listening:error', handleListeningError);
		socket.on('control:revoked', handleRevoked);
		socket.on('control:error', handleControlError);
		socket.on('control:success', handleControlSuccess);
		acquireListening(socket, ownerId);

		return () => {
			socket.off('listening:status', handleStatus);
			socket.off('listening:error', handleListeningError);
			socket.off('control:revoked', handleRevoked);
			socket.off('control:error', handleControlError);
			socket.off('control:success', handleControlSuccess);
			releaseListening(socket, ownerId);
		};
	}, [socket, isConnected, ownerId, deviceId]);
}
