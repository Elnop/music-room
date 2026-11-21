import { create } from 'zustand';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import { deviceService, getAppVersion } from '@/shared/backend/deviceService';
import { getBackendUrl, onBackendUrlChange } from '@/shared/backend/lib/backendUrl';
import { getAuthSession, getSession, onSessionEnd } from '@/shared/backend/lib/authSession';
import { reportBackendError } from '@/shared/backend/lib/backendErrors';

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

export const DEVICE_RETRY_DELAY_MS = 5000;
export const DEVICE_RETRY_MAX = 3;

async function buildHandshake(): Promise<Record<string, string>> {
	const token = getSession().accessToken ?? '';
	const appVersion = getAppVersion();
	try {
		const device = await deviceService.getDeviceInfo();
		return { token, ...device, appVersion };
	} catch (error) {
		reportBackendError('error', '[Socket] Could not read device info for the handshake:', error);
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
			auth: cb => {
				void buildHandshake().then(cb);
			},
		});

		let hasRefreshed = false;
		let deviceRetries = 0;

		function stop() {
			if (get().socket === socket) get().disconnect();
			else socket.disconnect();
		}

		async function handleRefusal(code: string) {
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
				reportBackendError('error', '[Socket] Token refresh failed, staying disconnected');
				stop();
				return;
			}
			reportBackendError('error', '[Socket] Handshake refused, staying disconnected:', code);
			stop();
		}

		socket.on('connect', () => {
			hasRefreshed = false;
			deviceRetries = 0;
			if (get().socket === socket) set({ isConnected: true, status: 'connected' });
		});

		socket.on('disconnect', reason => {
			if (get().socket !== socket) return;
			if (reason === 'io client disconnect') {
				set({ isConnected: false });
				return;
			}
			set({
				isConnected: false,
				status: reason === 'io server disconnect' ? 'failed' : 'reconnecting',
			});
		});

		socket.on('connect_error', error => {
			reportBackendError('error', '[Socket] ❌ Connection error:', error.message);
			if (HANDSHAKE_CODES.includes(error.message)) {
				void handleRefusal(error.message);
				return;
			}
			const transport = socket.io?.engine?.transport?.name ?? 'unknown';
			reportBackendError('error', '[Socket] Error details:', {
				url: socketUrl,
				transport,
			});
		});

		const manager = socket.io;

		manager.on('reconnect_attempt', () => {
			if (get().socket === socket) set({ status: 'reconnecting' });
		});

		manager.on('reconnect_error', error => {
			reportBackendError('error', '[Socket] ❌ Reconnect error:', error.message);
		});

		manager.on('reconnect_failed', () => {
			reportBackendError('error', '[Socket] ❌ Reconnect failed after all attempts');
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
