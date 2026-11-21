import { createStore } from 'zustand';
import { onBackendUrlChange } from '@/shared/backend/lib/backendUrlListeners';
import { connectSocket } from '@/shared/backend/lib/connectSocket';
import { onSessionEnd } from '@/shared/backend/lib/sessionEnd';
import type { SocketState } from '@/shared/backend/types/socketTypes';

export const socketStore = createStore<SocketState>((set, get, store) => ({
	socket: null,
	isConnected: false,
	status: 'idle',

	connect: () => {
		connectSocket(store);
	},

	disconnect: () => {
		const { socket } = get();

		socket?.disconnect();
		set({ socket: null, isConnected: false, status: 'idle' });
	},

	retry: () => {
		get().connect();
		if (get().status === 'connecting') set({ status: 'reconnecting' });
	},
}));

onSessionEnd(() => {
	socketStore.getState().disconnect();
});

onBackendUrlChange(() => {
	const { socket, connect, disconnect } = socketStore.getState();
	if (!socket) return;
	disconnect();
	connect();
});
