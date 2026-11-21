import {
	DEVICE_REGISTRATION_FAILED,
	DEVICE_RETRY_DELAY_MS,
	DEVICE_RETRY_MAX,
	INVALID_TOKEN,
} from '@/shared/backend/configs/socketConfig';
import { getAuthSession } from '@/shared/backend/lib/authSession';
import { reportBackendError } from '@/shared/backend/lib/backendErrors';
import type { WatchedSocket } from '@/shared/backend/types/socketTypes';

function stop({ store, socket }: WatchedSocket): void {
	if (store.getState().socket === socket) store.getState().disconnect();
	else socket.disconnect();
}

function retryDeviceRegistration({ store, socket, attempts }: WatchedSocket): void {
	attempts.deviceRetries += 1;
	setTimeout(() => {
		if (store.getState().socket !== socket || socket.connected) return;
		socket.connect();
	}, DEVICE_RETRY_DELAY_MS);
}

async function refreshAndReconnect(watched: WatchedSocket): Promise<void> {
	watched.attempts.hasRefreshed = true;
	const refreshed = (await getAuthSession()?.refreshAccessToken()) ?? false;
	if (watched.store.getState().socket !== watched.socket) return;
	if (refreshed) {
		watched.socket.connect();
		return;
	}
	reportBackendError('error', '[Socket] Token refresh failed, staying disconnected');
	stop(watched);
}

export async function handleRefusal(watched: WatchedSocket, code: string): Promise<void> {
	const { attempts } = watched;
	if (code === DEVICE_REGISTRATION_FAILED && attempts.deviceRetries < DEVICE_RETRY_MAX) {
		retryDeviceRegistration(watched);
		return;
	}
	if (code === INVALID_TOKEN && !attempts.hasRefreshed) {
		await refreshAndReconnect(watched);
		return;
	}
	reportBackendError('error', '[Socket] Handshake refused, staying disconnected:', code);
	stop(watched);
}
