import type { Socket } from 'socket.io-client';
import type { StoreApi } from 'zustand';

export type SocketStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

export type SocketState = {
	socket: Socket | null;
	isConnected: boolean;
	status: SocketStatus;

	connect: () => void;
	disconnect: () => void;
	retry: () => void;
};

export type SocketAttempts = {
	hasRefreshed: boolean;
	deviceRetries: number;
};

export type WatchedSocket = {
	store: StoreApi<SocketState>;
	socket: Socket;
	attempts: SocketAttempts;
};
