import { HANDSHAKE_CODES } from '@/shared/backend/configs/socketConfig';
import { reportBackendError } from '@/shared/backend/lib/backendErrors';
import { handleRefusal } from '@/shared/backend/lib/handleRefusal';
import type { WatchedSocket } from '@/shared/backend/types/socketTypes';

function watchConnection({ store, socket, attempts }: WatchedSocket): void {
	socket.on('connect', () => {
		attempts.hasRefreshed = false;
		attempts.deviceRetries = 0;
		if (store.getState().socket === socket) {
			store.setState({ isConnected: true, status: 'connected' });
		}
	});

	socket.on('disconnect', reason => {
		if (store.getState().socket !== socket) return;
		if (reason === 'io client disconnect') {
			store.setState({ isConnected: false });
			return;
		}
		store.setState({
			isConnected: false,
			status: reason === 'io server disconnect' ? 'failed' : 'reconnecting',
		});
	});
}

function watchConnectError(watched: WatchedSocket, url: string): void {
	const { socket } = watched;
	socket.on('connect_error', error => {
		reportBackendError('error', '[Socket] ❌ Connection error:', error.message);
		if (HANDSHAKE_CODES.includes(error.message)) {
			void handleRefusal(watched, error.message);
			return;
		}
		const transport = socket.io?.engine?.transport?.name ?? 'unknown';
		reportBackendError('error', '[Socket] Error details:', { url, transport });
	});
}

function watchManager({ store, socket }: WatchedSocket): void {
	const manager = socket.io;

	manager.on('reconnect_attempt', () => {
		if (store.getState().socket === socket) store.setState({ status: 'reconnecting' });
	});

	manager.on('reconnect_error', error => {
		reportBackendError('error', '[Socket] ❌ Reconnect error:', error.message);
	});

	manager.on('reconnect_failed', () => {
		reportBackendError('error', '[Socket] ❌ Reconnect failed after all attempts');
		if (store.getState().socket === socket) {
			store.setState({ isConnected: false, status: 'failed' });
		}
	});
}

export function watchSocket(watched: WatchedSocket, url: string): void {
	watchConnection(watched);
	watchConnectError(watched, url);
	watchManager(watched);
}
