import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { StoreApi } from 'zustand';
import { getBackendUrl } from '@/shared/backend/lib/backendUrl';
import { buildHandshake } from '@/shared/backend/lib/buildHandshake';
import { watchSocket } from '@/shared/backend/lib/watchSocket';
import type { SocketState } from '@/shared/backend/types/socketTypes';

function openSocket(url: string): Socket {
	return io(url, {
		transports: ['websocket', 'polling'],
		autoConnect: true,
		reconnection: true,
		reconnectionAttempts: 10,
		reconnectionDelay: 1000,
		reconnectionDelayMax: 5000,
		timeout: 20000,
		forceNew: true,
		auth: (cb) => {
			void buildHandshake().then(cb);
		},
	});
}

export function connectSocket(store: StoreApi<SocketState>): void {
	const existingSocket = store.getState().socket;
	if (existingSocket?.connected) {
		return;
	}
	existingSocket?.disconnect();

	const url = getBackendUrl();
	const socket = openSocket(url);
	watchSocket({ store, socket, attempts: { hasRefreshed: false, deviceRetries: 0 } }, url);
	store.setState({ socket, status: 'connecting' });
}
