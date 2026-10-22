import { useEffect } from 'react';
import { useSocketStore } from '@/shared/stores/socketStore';
import { useAuthStore } from '@/store/authStore';
import { useConnectStore } from '@/store/connectStore';
import { useQueueStore } from '@/store/queueStore';
import { controlErrorMessage, type ControlError } from './useMusicControl';
import { acquireListening, releaseListening } from '@/services/listeningRooms';
import { showError } from '@/shared/utils/toast';
import type { UserListeningStatus } from '@/types/listening.types';
import type { ControlRevokedPayload } from '@/types/device.types';
import { logger } from '@/shared/utils/logger';

/**
 * Follows the device the phone drives in remote mode (#297). Mounted once in
 * `AppNavigator`.
 *
 * While remote: subscribes to `listening:<owner>` and keeps the targeted
 * device's status in `connectStore.remoteStatus`; goes back to local when the
 * device leaves the status (offline), on `control:revoked`, or when the
 * subscription is refused (`listening:error`); toasts the `control:error`
 * answering a play / pause it sent. A friend's queue is loaded on entering remote on one of
 * their devices and forgotten on leaving; my own queue always stays.
 */
export function useRemoteTarget() {
	const socket = useSocketStore(state => state.socket);
	const isConnected = useSocketStore(state => state.isConnected);
	const userId = useAuthStore(state => state.user?.id ?? null);
	const ownerId = useConnectStore(state =>
		state.target.kind === 'remote' ? state.target.ownerId : null
	);
	const deviceId = useConnectStore(state =>
		state.target.kind === 'remote' ? state.target.deviceId : null
	);

	// A friend's queue lives in the store only while the phone drives their device.
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

		// listening:error names no owner: this hook subscribes to one owner at a time.
		const handleListeningError = (err: { code: string; message: string }) => {
			logger.error('[RemoteTarget] Listening error:', err);
			if (err.code === 'NOT_AUTHORIZED') setLocal('Accès refusé à cet appareil');
		};

		// control:error names no device: only the answer to this hook's own play / pause is shown.
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
		// Shared with the friend profile (useFriendListening): counted, not emitted directly.
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
