import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { deviceService, getAppVersion } from '@/shared/services/deviceService';
import { getBackendUrl, onBackendUrlChange } from '@/shared/services/backendUrl';
import { getAuthSession, getSession, onSessionEnd } from '@/shared/services/authSession';
import { logger } from '@/shared/utils/logger';

const NO_TOKEN = 'NO_TOKEN';
const INVALID_HANDSHAKE = 'INVALID_HANDSHAKE';
const INVALID_TOKEN = 'INVALID_TOKEN';
const DEVICE_REGISTRATION_FAILED = 'DEVICE_REGISTRATION_FAILED';
const TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS';

const HANDSHAKE_CODES = [
	NO_TOKEN,
	INVALID_HANDSHAKE,
	INVALID_TOKEN,
	DEVICE_REGISTRATION_FAILED,
	TOO_MANY_ATTEMPTS,
];

// Socket.io never retries a middleware refusal, so a failed device registration is retried here.
export const DEVICE_RETRY_DELAY_MS = 5000;
export const DEVICE_RETRY_MAX = 3;

async function buildHandshake(): Promise<Record<string, string>> {
	const token = getSession().accessToken ?? '';
	const appVersion = getAppVersion();
	try {
		const device = await deviceService.getDeviceInfo();
		return { token, ...device, appVersion };
	} catch (error) {
		logger.error('[Socket] Could not read device info for the handshake:', error);
		return { token, deviceId: '', deviceName: '', platform: '', model: '', appVersion };
	}
}

export type SocketStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

interface SocketState {
	socket: Socket | null;
	isConnected: boolean;
	status: SocketStatus;

	connect: () => void;
	disconnect: () => void;
	retry: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
	socket: null,
	isConnected: false,
	status: 'idle',

	connect: () => {
		const existingSocket = get().socket;

		if (existingSocket?.connected) {
			return;
		}

		existingSocket?.disconnect();

		const socketUrl = getBackendUrl();

		const socket = io(socketUrl, {
			transports: ['websocket', 'polling'],
			autoConnect: true,
			reconnection: true,
			reconnectionAttempts: 10,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000,
			timeout: 20000,
			forceNew: true,
			// A function, so every attempt sends the current session's token.
			auth: cb => {
				void buildHandshake().then(cb);
			},
		});

		let hasRefreshed = false;
		let deviceRetries = 0;

		const stop = () => {
			if (get().socket === socket) get().disconnect();
			else socket.disconnect();
		};

		const handleRefusal = async (code: string) => {
			if (code === DEVICE_REGISTRATION_FAILED && deviceRetries < DEVICE_RETRY_MAX) {
				deviceRetries += 1;
				setTimeout(() => {
					if (get().socket !== socket || socket.connected) return;
					socket.connect();
				}, DEVICE_RETRY_DELAY_MS);
				return;
			}
			if (code === INVALID_TOKEN && !hasRefreshed) {
				hasRefreshed = true;
				const refreshed = (await getAuthSession()?.refreshAccessToken()) ?? false;
				if (get().socket !== socket) return;
				if (refreshed) {
					socket.connect();
					return;
				}
				logger.error('[Socket] Token refresh failed, staying disconnected');
				stop();
				return;
			}
			logger.error('[Socket] Handshake refused, staying disconnected:', code);
			stop();
		};

		socket.on('connect', () => {
			hasRefreshed = false;
			deviceRetries = 0;
			if (get().socket === socket) set({ isConnected: true, status: 'connected' });
		});

		socket.on('disconnect', reason => {
			if (get().socket !== socket) return;
			if (reason === 'io client disconnect') {
				// disconnect() and connect() set the status themselves.
				set({ isConnected: false });
				return;
			}
			// The Manager retries every loss but a server kick.
			set({
				isConnected: false,
				status: reason === 'io server disconnect' ? 'failed' : 'reconnecting',
			});
		});

		socket.on('connect_error', error => {
			logger.error('[Socket] ❌ Connection error:', error.message);
			if (HANDSHAKE_CODES.includes(error.message)) {
				void handleRefusal(error.message);
				return;
			}
			const transport = socket.io?.engine?.transport?.name ?? 'unknown';
			logger.error('[Socket] Error details:', {
				url: socketUrl,
				transport,
			});
		});

		// reconnect* events fire on the Manager, never on the socket.
		const manager = socket.io;

		manager.on('reconnect_attempt', () => {
			if (get().socket === socket) set({ status: 'reconnecting' });
		});

		manager.on('reconnect_error', error => {
			logger.error('[Socket] ❌ Reconnect error:', error.message);
		});

		manager.on('reconnect_failed', () => {
			logger.error('[Socket] ❌ Reconnect failed after all attempts');
			if (get().socket === socket) set({ isConnected: false, status: 'failed' });
		});

		set({ socket, status: 'connecting' });
	},

	disconnect: () => {
		const { socket } = get();

		socket?.disconnect();
		set({ socket: null, isConnected: false, status: 'idle' });
	},

	retry: () => {
		get().connect();
		// A retry follows a lost connection: the banner stays on « Reconnexion… ».
		if (get().status === 'connecting') set({ status: 'reconnecting' });
	},
}));

onSessionEnd(() => {
	useSocketStore.getState().disconnect();
});

onBackendUrlChange(() => {
	const { socket, connect, disconnect } = useSocketStore.getState();
	if (!socket) return;
	disconnect();
	connect();
});
