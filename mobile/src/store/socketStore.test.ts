import { io } from 'socket.io-client';
import { useSocketStore } from '@store/socketStore';

type Handler = (...args: unknown[]) => void;

interface FakeSocket {
	id: string;
	connected: boolean;
	handlers: Record<string, Handler[]>;
	on: jest.Mock;
	off: jest.Mock;
	emit: jest.Mock;
	connect: jest.Mock;
	disconnect: jest.Mock;
	trigger: (event: string, ...args: unknown[]) => void;
}

function createFakeSocket(): FakeSocket {
	const socket: FakeSocket = {
		id: 'socket-1',
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

jest.mock('@store/authStore', () => ({
	useAuthStore: { getState: () => mockAuthState },
}));

jest.mock('@/services/deviceService', () => ({
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

beforeEach(() => {
	jest.clearAllMocks();
	jest.spyOn(console, 'log').mockImplementation(() => undefined);
	jest.spyOn(console, 'error').mockImplementation(() => undefined);
	mockAuthState.accessToken = 'token-1';
	mockAuthState.refreshAccessToken.mockResolvedValue(true);
	socket = createFakeSocket();
	ioMock.mockReturnValue(socket);
	useSocketStore.setState({ socket: null, isConnected: false });
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
		expect(console.error).toHaveBeenCalledWith(
			'[Socket] Handshake refused, staying disconnected:',
			'INVALID_TOKEN'
		);
	});

	it.each(['NO_TOKEN', 'INVALID_HANDSHAKE'])('disconnects without refresh on %s', async code => {
		socket.trigger('connect_error', new Error(code));
		await flush();

		expect(mockAuthState.refreshAccessToken).not.toHaveBeenCalled();
		expect(socket.connect).not.toHaveBeenCalled();
		expect(socket.disconnect).toHaveBeenCalled();
		expect(useSocketStore.getState().socket).toBeNull();
		expect(console.error).toHaveBeenCalledWith(
			'[Socket] Handshake refused, staying disconnected:',
			code
		);
	});
});
