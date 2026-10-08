import { act, renderHook } from '@testing-library/react-native';
import { useMusicControlEmitter } from '@/hooks/useMusicControl';

const mockSocket = {
	connected: true,
	on: jest.fn(),
	off: jest.fn(),
	emit: jest.fn(),
};

const mockSocketState = { socket: mockSocket, isConnected: true };
const mockAuthState = { user: { id: 'user-1' } };
const mockPlayerState = {
	currentTrack: null,
	isPlaying: true,
	pause: jest.fn(),
	resume: jest.fn(),
};

jest.mock('@store/socketStore', () => ({
	useSocketStore: (selector: (state: typeof mockSocketState) => unknown) =>
		selector(mockSocketState),
}));

jest.mock('@store/authStore', () => ({
	useAuthStore: (selector: (state: typeof mockAuthState) => unknown) => selector(mockAuthState),
}));

jest.mock('@store/playerStore', () => ({
	usePlayerStore: (selector: (state: typeof mockPlayerState) => unknown) =>
		selector(mockPlayerState),
}));

jest.mock('@/services/deviceService', () => ({
	deviceService: {
		getDeviceInfo: jest.fn(() =>
			Promise.resolve({
				deviceId: 'device-1',
				deviceName: 'Pixel',
				platform: 'android',
				model: 'Pixel 8',
			})
		),
	},
}));

beforeEach(() => {
	jest.clearAllMocks();
	jest.useFakeTimers();
	jest.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
	jest.useRealTimers();
	jest.restoreAllMocks();
});

describe('useMusicControlEmitter', () => {
	it('emits no auth:register and no device in listening:update', async () => {
		const { unmount } = renderHook(() => useMusicControlEmitter());
		await act(async () => {
			await Promise.resolve();
		});
		await act(async () => {
			jest.advanceTimersByTime(500);
		});

		const events = mockSocket.emit.mock.calls.map(call => call[0]);
		expect(events).not.toContain('auth:register');
		expect(mockSocket.emit).toHaveBeenCalledWith('listening:update', {
			track: null,
			isPlaying: true,
		});

		unmount();
	});
});
