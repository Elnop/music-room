import type { Socket } from 'socket.io-client';
import { logger } from '@/shared/logging/logger';
import { showError } from '@/shared/theme/lib/toast';
import { controlErrorMessage } from '@/shared/control-error/controlErrorMessage';
import type { ControlError } from '@/shared/control-error/controlErrorTypes';
import {
	acquireListening,
	releaseListening,
} from '@/features/playback/shared/listening-rooms/listeningRooms';
import { connectStore } from '@/features/playback/shared/player/stores/connectStore';
import type { UserListeningStatus } from '@/features/playback/shared/player/types/listeningTypes';
import type { ControlRevokedPayload } from '@/features/playback/features/control-delegation/shared/delegation/types/deviceTypes';
import type { RemoteDevice } from '@/features/playback/playbackEngineTypes';

function applyListeningStatus(device: RemoteDevice, status: UserListeningStatus): void {
	if (status.ownerId !== device.ownerId) return;
	const listened = status.devices.find(d => d.device.deviceId === device.deviceId);
	if (!listened) {
		connectStore.getState().setLocal('Appareil hors ligne');
		return;
	}
	connectStore.getState().setRemoteStatus(listened);
}

function reportListeningError(err: { code: string; message: string }): void {
	logger.error('[RemoteTarget] Listening error:', err);
	if (err.code !== 'NOT_AUTHORIZED') return;
	connectStore.getState().setLocal('Accès refusé à cet appareil');
}

function reportControlError(err: ControlError): void {
	if (!connectStore.getState().controlPending) return;
	connectStore.getState().setControlPending(false);
	logger.error('[RemoteTarget] Control error:', err);
	showError(controlErrorMessage(err));
}

export function bindListening(socket: Socket, device: RemoteDevice): () => void {
	function handleStatus(status: UserListeningStatus) {
		applyListeningStatus(device, status);
	}
	function handleRevoked(payload: ControlRevokedPayload) {
		if (payload.ownerId === device.ownerId) connectStore.getState().setLocal('Accès retiré');
	}
	socket.on('listening:status', handleStatus);
	socket.on('listening:error', reportListeningError);
	socket.on('control:revoked', handleRevoked);
	acquireListening(socket, device.ownerId);
	return () => {
		socket.off('listening:status', handleStatus);
		socket.off('listening:error', reportListeningError);
		socket.off('control:revoked', handleRevoked);
		releaseListening(socket, device.ownerId);
	};
}

export function bindControl(socket: Socket, device: RemoteDevice): () => void {
	function handleControlSuccess(reply: { targetUserId: string; targetDeviceId: string }) {
		if (reply.targetUserId === device.ownerId && reply.targetDeviceId === device.deviceId) {
			connectStore.getState().setControlPending(false);
		}
	}
	socket.on('control:error', reportControlError);
	socket.on('control:success', handleControlSuccess);
	return () => {
		socket.off('control:error', reportControlError);
		socket.off('control:success', handleControlSuccess);
	};
}
