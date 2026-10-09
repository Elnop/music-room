import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@store/authStore';
import { deviceService, getAppVersion } from '@/services/deviceService';
import { getBackendUrl, onBackendUrlChange } from '@/services/backendUrl';

/**
 * Handshake refusal codes sent by the server as the `connect_error` message
 * (backend/src/realtime/socket-auth.ts).
 */
const NO_TOKEN = 'NO_TOKEN';
const INVALID_HANDSHAKE = 'INVALID_HANDSHAKE';
const INVALID_TOKEN = 'INVALID_TOKEN';
const DEVICE_REGISTRATION_FAILED = 'DEVICE_REGISTRATION_FAILED';

const HANDSHAKE_CODES = [NO_TOKEN, INVALID_HANDSHAKE, INVALID_TOKEN, DEVICE_REGISTRATION_FAILED];

/**
 * DEVICE_REGISTRATION_FAILED is a transient server error, but Socket.io never
 * retries a middleware refusal: retry it ourselves, a bounded number of times.
 */
export const DEVICE_RETRY_DELAY_MS = 5000;
export const DEVICE_RETRY_MAX = 3;

/**
 * Builds the Socket.io handshake `auth` payload. Called on every connection
 * attempt, so the token is always the one currently in the auth store.
 * The auth store is read lazily (never at import time) to avoid an import cycle.
 */
async function buildHandshake(): Promise<Record<string, string>> {
	const token = useAuthStore.getState().accessToken ?? '';
	const appVersion = getAppVersion();
	try {
		const device = await deviceService.getDeviceInfo();
		return { token, ...device, appVersion };
	} catch (error) {
		console.error('[Socket] Could not read device info for the handshake:', error);
		return { token, deviceId: '', deviceName: '', platform: '', model: '', appVersion };
	}
}

/**
 * Socket State Interface
 */
interface SocketState {
	socket: Socket | null;
	isConnected: boolean;

	// Actions
	connect: () => void;
	disconnect: () => void;
}

/**
 * Socket Store
 * Manages the global Socket.io connection
 *
 * Usage:
 * - Call connect() when user authenticates
 * - Call disconnect() when user logs out
 * - Use socket and isConnected in feature-specific hooks
 */
export const useSocketStore = create<SocketState>((set, get) => ({
	socket: null,
	isConnected: false,

	/**
	 * Connect to the Socket.io server
	 */
	connect: () => {
		const existingSocket = get().socket;

		if (existingSocket?.connected) {
			if (__DEV__) console.log('[Socket] Already connected:', existingSocket.id);
			return;
		}

		if (existingSocket) {
			if (__DEV__) console.log('[Socket] Socket exists but not connected, reconnecting...');
			existingSocket.disconnect();
		}

		const socketUrl = getBackendUrl();
		if (__DEV__) console.log('[Socket] Connecting to:', socketUrl);

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

		// One token refresh per handshake refusal and at most DEVICE_RETRY_MAX
		// device registration retries; both reset once a connection succeeds.
		let hasRefreshed = false;
		let deviceRetries = 0;

		const stop = () => {
			if (get().socket === socket) get().disconnect();
			else socket.disconnect();
		};

		const handleRefusal = async (code: string) => {
			if (code === DEVICE_REGISTRATION_FAILED && deviceRetries < DEVICE_RETRY_MAX) {
				deviceRetries += 1;
				if (__DEV__) {
					console.log(
						`[Socket] Device registration failed, retry ${deviceRetries}/${DEVICE_RETRY_MAX} in ${DEVICE_RETRY_DELAY_MS} ms`
					);
				}
				setTimeout(() => {
					if (get().socket !== socket || socket.connected) return;
					socket.connect();
				}, DEVICE_RETRY_DELAY_MS);
				return;
			}
			if (code === INVALID_TOKEN && !hasRefreshed) {
				hasRefreshed = true;
				if (__DEV__) console.log('[Socket] Token refused, refreshing it once');
				const refreshed = await useAuthStore.getState().refreshAccessToken();
				if (get().socket !== socket) return;
				if (refreshed) {
					socket.connect();
					return;
				}
				console.error('[Socket] Token refresh failed, staying disconnected');
				stop();
				return;
			}
			console.error('[Socket] Handshake refused, staying disconnected:', code);
			stop();
		};

		socket.on('connect', () => {
			if (__DEV__) console.log('[Socket] ✅ Connected successfully:', socket.id);
			hasRefreshed = false;
			deviceRetries = 0;
			set({ isConnected: true });
		});

		socket.on('disconnect', reason => {
			if (__DEV__) console.log('[Socket] ❌ Disconnected:', reason);
			set({ isConnected: false });
		});

		socket.on('connect_error', error => {
			console.error('[Socket] ❌ Connection error:', error.message);
			if (HANDSHAKE_CODES.includes(error.message)) {
				void handleRefusal(error.message);
				return;
			}
			const transport = socket.io?.engine?.transport?.name ?? 'unknown';
			console.error('[Socket] Error details:', {
				url: socketUrl,
				transport,
			});
		});

		socket.on('reconnect', attemptNumber => {
			if (__DEV__) console.log('[Socket] 🔄 Reconnected after', attemptNumber, 'attempts');
		});

		socket.on('reconnect_attempt', attemptNumber => {
			if (__DEV__) console.log('[Socket] 🔄 Reconnect attempt', attemptNumber);
		});

		socket.on('reconnect_error', error => {
			console.error('[Socket] ❌ Reconnect error:', error.message);
		});

		socket.on('reconnect_failed', () => {
			console.error('[Socket] ❌ Reconnect failed after all attempts');
		});

		set({ socket });
	},

	/**
	 * Disconnect from the Socket.io server
	 */
	disconnect: () => {
		const { socket } = get();

		if (socket) {
			if (__DEV__) console.log('[Socket] Disconnecting...');
			socket.disconnect();
			set({ socket: null, isConnected: false });
		}
	},
}));

/**
 * A backend address change (services/backendUrl.ts) moves a live socket to the
 * new server; without a socket, the next connect() reads the new address.
 */
onBackendUrlChange(() => {
	const { socket, connect, disconnect } = useSocketStore.getState();
	if (!socket) return;
	if (__DEV__) console.log('[Socket] Backend address changed, reconnecting');
	disconnect();
	connect();
});
