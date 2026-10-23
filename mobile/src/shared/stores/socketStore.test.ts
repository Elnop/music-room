import { io } from 'socket.io-client';
import { DEVICE_RETRY_DELAY_MS, DEVICE_RETRY_MAX, useSocketStore } from './socketStore';
import { DEFAULT_BACKEND_URL, resetBackendUrl, setBackendUrl } from '@/shared/services/backendUrl';
import { logger } from '@/shared/utils/logger';
import { createStore } from 'zustand';
import {
	notifySessionEnd,
	registerAuthSession,
	type SessionView,
} from '@/shared/services/authSession';

type Handler = (...args: unknown[]) => void;

interface FakeEmitter {
	handlers: Record<string, Handler[]>;
	on: jest.Mock;
	trigger: (event: string, ...args: unknown[]) => void;
}

interface FakeSocket {
	id: string;
	/** The Manager: emits the reconnect* events. */
	io: FakeEmitter;
	connected: boolean;
	handlers: Record<string, Handler[]>;
	on: jest.Mock;
	off: jest.Mock;
	emit: jest.Mock;
	connect: jest.Mock;
	disconnect: jest.Mock;
	trigger: (event: string, ...args: unknown[]) => void;
}

function createFakeEmitter(): FakeEmitter {
	const emitter: FakeEmitter = {
		handlers: {},
		on: jest.fn((event: string, handler: Handler) => {
			(emitter.handlers[event] ??= []).push(handler);
			return emitter;
		}),
		trigger: (event, ...args) => emitter.handlers[event]?.forEach(h => h(...args)),
	};
	return emitter;
}

function createFakeSocket(): FakeSocket {
	const socket: FakeSocket = {
		id: 'socket-1',
		io: createFakeEmitter(),
		connected: false,
		handlers: {},
		on: jest.fn((event: string, handler: Handler) => {
			(socket.handlers[event] ??= []).push(handler);
			return socket;
		}),
		off: jest.fn(),
		emit: jest.fn(),
		connect: jest.fn(),
		disconnect: jest.fn(),
		trigger: (event, ...args) => socket.handlers[event]?.forEach(h => h(...args)),
	};
	return socket;
}

const mockDevice = {
	deviceId: 'device-1',
	deviceName: 'Pixel',
	platform: 'android',
	model: 'Pixel 8',
};

const mockAuthState = {
	accessToken: 'token-1' as string | null,
	refreshAccessToken: jest.fn<Promise<boolean>, []>(),
};

jest.mock('socket.io-client', () => ({ io: jest.fn() }));

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// The session the auth store registers in the app (shared/services/authSession.ts).
registerAuthSession({
	// Reads the token at each call, like the auth store.
	store: {
		...createStore<SessionView>(() => ({ user: null, accessToken: null, isAuthenticated: true })),
		getState: () => ({ user: null, accessToken: mockAuthState.accessToken, isAuthenticated: true }),
	},
	isTokenExpiringSoon: () => false,
	refreshAccessToken: () => mockAuthState.refreshAccessToken(),
});

jest.mock('@/shared/services/deviceService', () => ({
	deviceService: { getDeviceInfo: jest.fn(() => Promise.resolve(mockDevice)) },
	getAppVersion: () => '1.2.3',
}));

const ioMock = io as unknown as jest.Mock;

type AuthCallback = (cb: (data: object) => void) => void;

let socket: FakeSocket;

function lastAuthOption(): AuthCallback {
	const options = ioMock.mock.calls[ioMock.mock.calls.length - 1][1] as { auth: AuthCallback };
	return options.auth;
}

function readHandshake(): Promise<object> {
	return new Promise(resolve => lastAuthOption()(resolve));
}

const flush = () => new Promise<void>(resolve => setImmediate(resolve));

beforeEach(async () => {
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
	useSocketStore.setState({ socket: null, isConnected: false, status: 'idle' });
	await resetBackendUrl();
	jest.clearAllMocks();
	mockAuthState.accessToken = 'token-1';
	mockAuthState.refreshAccessToken.mockResolvedValue(true);
	socket = createFakeSocket();
	ioMock.mockReturnValue(socket);
	useSocketStore.setState({ socket: null, isConnected: false, status: 'idle' });
	useSocketStore.getState().connect();
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('socketStore handshake', () => {
	it('sends the store token and the device fields on connect', async () => {
		await expect(readHandshake()).resolves.toEqual({
			token: 'token-1',
			...mockDevice,
			appVersion: '1.2.3',
		});
	});

	it('reads the current token on every (re)connection', async () => {
		await readHandshake();
		mockAuthState.accessToken = 'token-2';

		await expect(readHandshake()).resolves.toMatchObject({ token: 'token-2' });
	});
});

describe('socketStore connect_error', () => {
	it('refreshes the token once and reconnects on INVALID_TOKEN', async () => {
		socket.trigger('connect_error', new Error('INVALID_TOKEN'));
		await flush();

		expect(mockAuthState.refreshAccessToken).toHaveBeenCalledTimes(1);
		expect(socket.connect).toHaveBeenCalledTimes(1);
		expect(socket.disconnect).not.toHaveBeenCalled();
	});

	it('disconnects without retrying when the refresh fails', async () => {
		useSocketStore.setState({ isConnected: true });
		mockAuthState.refreshAccessToken.mockResolvedValue(false);

		socket.trigger('connect_error', new Error('INVALID_TOKEN'));
		await flush();

		expect(mockAuthState.refreshAccessToken).toHaveBeenCalledTimes(1);
		expect(socket.connect).not.toHaveBeenCalled();
		expect(socket.disconnect).toHaveBeenCalled();
		expect(useSocketStore.getState()).toMatchObject({ socket: null, isConnected: false });
	});

	it('disconnects without a second refresh when still refused after a refresh', async () => {
		socket.trigger('connect_error', new Error('INVALID_TOKEN'));
		await flush();
		socket.trigger('connect_error', new Error('INVALID_TOKEN'));
		await flush();

		expect(mockAuthState.refreshAccessToken).toHaveBeenCalledTimes(1);
		expect(socket.connect).toHaveBeenCalledTimes(1);
		expect(socket.disconnect).toHaveBeenCalled();
		expect(useSocketStore.getState().socket).toBeNull();
		expect(logger.error).toHaveBeenCalledWith(
			'[Socket] Handshake refused, staying disconnected:',
			'INVALID_TOKEN'
		);
	});

	it.each(['NO_TOKEN', 'INVALID_HANDSHAKE', 'TOO_MANY_ATTEMPTS'])(
		'disconnects without refresh on %s',
		async code => {
			socket.trigger('connect_error', new Error(code));
			await flush();

			expect(mockAuthState.refreshAccessToken).not.toHaveBeenCalled();
			expect(socket.connect).not.toHaveBeenCalled();
			expect(socket.disconnect).toHaveBeenCalled();
			expect(useSocketStore.getState().socket).toBeNull();
			expect(logger.error).toHaveBeenCalledWith(
				'[Socket] Handshake refused, staying disconnected:',
				code
			);
		}
	);
});

describe('socketStore DEVICE_REGISTRATION_FAILED', () => {
	const refuseDevice = () =>
		socket.trigger('connect_error', new Error('DEVICE_REGISTRATION_FAILED'));

	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('reconnects after the retry delay', () => {
		refuseDevice();

		jest.advanceTimersByTime(DEVICE_RETRY_DELAY_MS - 1);
		expect(socket.connect).not.toHaveBeenCalled();
		jest.advanceTimersByTime(1);
		expect(socket.connect).toHaveBeenCalledTimes(1);
		expect(socket.disconnect).not.toHaveBeenCalled();
		expect(mockAuthState.refreshAccessToken).not.toHaveBeenCalled();
	});

	it(`stops after ${DEVICE_RETRY_MAX} retries and stays disconnected`, () => {
		for (let i = 0; i < DEVICE_RETRY_MAX; i++) {
			refuseDevice();
			jest.advanceTimersByTime(DEVICE_RETRY_DELAY_MS);
		}
		expect(socket.connect).toHaveBeenCalledTimes(DEVICE_RETRY_MAX);

		refuseDevice();
		jest.advanceTimersByTime(DEVICE_RETRY_DELAY_MS);

		expect(socket.connect).toHaveBeenCalledTimes(DEVICE_RETRY_MAX);
		expect(socket.disconnect).toHaveBeenCalled();
		expect(useSocketStore.getState().socket).toBeNull();
		expect(logger.error).toHaveBeenCalledWith(
			'[Socket] Handshake refused, staying disconnected:',
			'DEVICE_REGISTRATION_FAILED'
		);
	});

	it('resets the retry counter after a successful connect', () => {
		for (let i = 0; i < DEVICE_RETRY_MAX; i++) {
			refuseDevice();
			jest.advanceTimersByTime(DEVICE_RETRY_DELAY_MS);
		}
		socket.trigger('connect');

		refuseDevice();
		jest.advanceTimersByTime(DEVICE_RETRY_DELAY_MS);

		expect(socket.connect).toHaveBeenCalledTimes(DEVICE_RETRY_MAX + 1);
		expect(socket.disconnect).not.toHaveBeenCalled();
	});

	it('does not reconnect a socket the store has replaced', () => {
		refuseDevice();
		useSocketStore.getState().disconnect();

		jest.advanceTimersByTime(DEVICE_RETRY_DELAY_MS);
		expect(socket.connect).not.toHaveBeenCalled();
	});
});

describe('socketStore backend address', () => {
	const lastUrl = () => ioMock.mock.calls[ioMock.mock.calls.length - 1][0];

	it('connects to the current backend address', () => {
		expect(lastUrl()).toBe(DEFAULT_BACKEND_URL);
	});

	it('disconnects and reconnects to the new address when a socket exists', async () => {
		const oldSocket = socket;
		const newSocket = createFakeSocket();
		ioMock.mockReturnValue(newSocket);

		await setBackendUrl('http://192.168.1.20:3000/');

		expect(oldSocket.disconnect).toHaveBeenCalled();
		expect(ioMock).toHaveBeenCalledTimes(2);
		expect(lastUrl()).toBe('http://192.168.1.20:3000');
		expect(useSocketStore.getState().socket).toBe(newSocket);
	});

	it('only records the address when no socket exists; the next connect uses it', async () => {
		useSocketStore.getState().disconnect();
		ioMock.mockClear();

		await setBackendUrl('http://192.168.1.20:3000');
		expect(ioMock).not.toHaveBeenCalled();

		useSocketStore.getState().connect();
		expect(lastUrl()).toBe('http://192.168.1.20:3000');
	});
});

describe('socketStore status', () => {
	const status = () => useSocketStore.getState().status;

	it('is connecting until the first connect, then connected', () => {
		expect(status()).toBe('connecting');
		socket.connected = true;
		socket.trigger('connect');
		expect(useSocketStore.getState()).toMatchObject({ status: 'connected', isConnected: true });
	});

	it('listens to the reconnect events on the Manager, not the socket', () => {
		const managerEvents = socket.io.on.mock.calls.map(([event]) => event);
		const socketEvents = socket.on.mock.calls.map(([event]) => event);
		for (const event of ['reconnect_attempt', 'reconnect_error', 'reconnect_failed']) {
			expect(managerEvents).toContain(event);
			expect(socketEvents).not.toContain(event);
		}
	});

	it('is reconnecting after a lost connection and on each reconnect attempt', () => {
		socket.trigger('connect');
		socket.trigger('disconnect', 'transport close');
		expect(useSocketStore.getState()).toMatchObject({ status: 'reconnecting', isConnected: false });

		socket.trigger('connect');
		socket.io.trigger('reconnect_attempt', 1);
		expect(status()).toBe('reconnecting');
	});

	it('is failed once the Manager gives up, and back to connected on connect', () => {
		socket.io.trigger('reconnect_attempt', 10);
		socket.io.trigger('reconnect_failed');
		expect(useSocketStore.getState()).toMatchObject({ status: 'failed', isConnected: false });

		socket.trigger('connect');
		expect(status()).toBe('connected');
	});

	it('is failed when the server closes the socket (no automatic reconnection)', () => {
		socket.trigger('connect');
		socket.trigger('disconnect', 'io server disconnect');
		expect(status()).toBe('failed');
	});

	it('is idle after disconnect()', () => {
		socket.trigger('connect');
		useSocketStore.getState().disconnect();
		expect(useSocketStore.getState()).toMatchObject({
			socket: null,
			isConnected: false,
			status: 'idle',
		});
	});

	it('is idle after a handshake refusal', async () => {
		socket.trigger('connect_error', new Error('NO_TOKEN'));
		await flush();
		expect(status()).toBe('idle');
	});

	it('ignores the events of a socket the store has replaced', () => {
		const oldSocket = socket;
		ioMock.mockReturnValue(createFakeSocket());
		useSocketStore.getState().retry();

		oldSocket.io.trigger('reconnect_failed');
		oldSocket.trigger('connect');
		expect(useSocketStore.getState()).toMatchObject({
			status: 'reconnecting',
			isConnected: false,
		});
	});
});

describe('socketStore retry', () => {
	it('replaces a socket that gave up with a new connection', () => {
		const oldSocket = socket;
		const newSocket = createFakeSocket();
		ioMock.mockReturnValue(newSocket);
		oldSocket.io.trigger('reconnect_failed');

		useSocketStore.getState().retry();

		expect(oldSocket.disconnect).toHaveBeenCalled();
		expect(ioMock).toHaveBeenCalledTimes(2);
		// Back to « Reconnexion… » right away, not to the banner-less 'connecting'.
		expect(useSocketStore.getState()).toMatchObject({ socket: newSocket, status: 'reconnecting' });

		newSocket.trigger('connect');
		expect(useSocketStore.getState().status).toBe('connected');
	});

	it('keeps a socket that is connected', () => {
		socket.connected = true;
		socket.trigger('connect');

		useSocketStore.getState().retry();

		expect(ioMock).toHaveBeenCalledTimes(1);
		expect(useSocketStore.getState().status).toBe('connected');
	});
});

describe('end of session', () => {
	it('closes the socket when the session ends', () => {
		notifySessionEnd();

		expect(socket.disconnect).toHaveBeenCalled();
		expect(useSocketStore.getState()).toMatchObject({ socket: null, status: 'idle' });
	});
});
