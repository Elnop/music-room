import { act, renderHook } from '@testing-library/react-native';
import type * as Zustand from 'zustand';
import { useFriendListening } from '@/features/playback/features/control-delegation/hooks/useFriendListening';
import { useMusicControlEmitter } from '@/features/playback/features/control-delegation/hooks/useMusicControlEmitter';
import { controlErrorMessage } from '@/shared/control-error/controlErrorMessage';
import { musicControlApi } from '@/features/playback/features/control-delegation/shared/delegation/musicControlApi';
import { logger } from '@/shared/logging/logger';
import { playerStore } from '@/features/playback/shared/player/stores/playerStore';

const mockSocket = {
	connected: true,
	on: jest.fn(),
	off: jest.fn(),
	emit: jest.fn(),
};

const mockSocketState = { socket: mockSocket, isConnected: true };
const mockAuthState = { user: { id: 'user-1' }, accessToken: 'token', isAuthenticated: true };
const mockPause = jest.fn();
const mockResume = jest.fn();
const mockPlayTrack = jest.fn();
const mockSetCurrentItem = jest.fn();
const mockSetLocal = jest.fn();

let mockReader: (() => number) | null = null;

jest.mock('@/shared/backend/hooks/useSocketState', () => ({
	useSocketState: (selector: (state: typeof mockSocketState) => unknown) =>
		selector(mockSocketState),
}));

jest.mock('@/shared/backend/hooks/useSession', () => ({
	useSession: (selector: (state: typeof mockAuthState) => unknown) => selector(mockAuthState),
}));
jest.mock('@/shared/backend/lib/authSession', () => ({
	getSession: () => mockAuthState,
}));

jest.mock('@/features/playback/shared/player/stores/playerStore', () => {
	const { createStore } = jest.requireActual<typeof Zustand>('zustand');
	return {
		playerStore: createStore(() => ({
			currentTrack: null,
			isPlaying: true,
			seekCount: 0,
			pause: (...args: unknown[]) => mockPause(...args),
			resume: (...args: unknown[]) => mockResume(...args),
			playTrack: (...args: unknown[]) => mockPlayTrack(...args),
		})),
	};
});

jest.mock('@/features/playback/shared/player/lib/positionReader', () => ({
	readPositionMs: () => (mockReader ? mockReader() : null),
}));

jest.mock('@/features/playback/shared/player/stores/queueStore', () => ({
	queueStore: { getState: () => ({ setCurrentItem: mockSetCurrentItem }) },
}));

jest.mock('@/features/playback/shared/player/stores/connectStore', () => ({
	connectStore: { getState: () => ({ setLocal: mockSetLocal }) },
}));

jest.mock('@/shared/backend/deviceService', () => ({
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

jest.mock(
	'@/features/playback/features/control-delegation/shared/delegation/musicControlApi',
	() => ({
		musicControlApi: { getControllableDevices: jest.fn() },
	})
);

const mockGetControllable = musicControlApi.getControllableDevices as jest.Mock;

beforeEach(() => {
	jest.clearAllMocks();
	jest.useFakeTimers();
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
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
			positionMs: 0,
		});

		unmount();
	});

	it('sends the rounded position of the registered reader', async () => {
		mockReader = () => 12_345.6;
		const { unmount } = renderHook(() => useMusicControlEmitter());
		await act(async () => {
			await Promise.resolve();
		});
		await act(async () => {
			jest.advanceTimersByTime(500);
		});

		expect(mockSocket.emit).toHaveBeenCalledWith('listening:update', {
			track: null,
			isPlaying: true,
			positionMs: 12_346,
		});

		unmount();
		mockReader = null;
	});

	it('sends 0 when the reader returns a non-finite position', async () => {
		mockReader = () => Number.NaN;
		const { unmount } = renderHook(() => useMusicControlEmitter());
		await act(async () => {
			await Promise.resolve();
		});
		await act(async () => {
			jest.advanceTimersByTime(500);
		});

		expect(mockSocket.emit).toHaveBeenCalledWith('listening:update', {
			track: null,
			isPlaying: true,
			positionMs: 0,
		});

		unmount();
		mockReader = null;
	});

	it('emits again with the new position when a seek happens', async () => {
		let position = 1000;
		mockReader = () => position;
		const { unmount } = renderHook(() => useMusicControlEmitter());
		await act(async () => {
			await Promise.resolve();
		});
		await act(async () => {
			jest.advanceTimersByTime(500);
		});
		mockSocket.emit.mockClear();

		position = 60_000;
		await act(async () => {
			playerStore.setState({ seekCount: 1 });
		});
		await act(async () => {
			jest.advanceTimersByTime(200);
		});

		expect(mockSocket.emit).toHaveBeenCalledWith('listening:update', {
			track: null,
			isPlaying: true,
			positionMs: 60_000,
		});

		unmount();
		playerStore.setState({ seekCount: 0 });
		mockReader = null;
	});
});

describe('useMusicControlEmitter control:command', () => {
	const queueTrack = {
		trackUri: 'https://soundcloud.com/artist/song',
		title: 'Song',
		artist: 'Artist',
		album: null,
		albumArt: null,
		durationMs: 200_000,
	};

	async function commandHandler() {
		const rendered = renderHook(() => useMusicControlEmitter());
		await act(async () => {
			await Promise.resolve();
		});
		const calls = mockSocket.on.mock.calls.filter(call => call[0] === 'control:command');
		return { ...rendered, handle: calls[calls.length - 1][1] as (data: unknown) => void };
	}

	it('plays a play-item from its position, marks it current and goes back to local', async () => {
		const { handle, unmount } = await commandHandler();
		const item = {
			id: 'item-1',
			rank: 'a',
			track: queueTrack,
			sourcePlaylistId: null,
			blockId: null,
			blockDetached: false,
		};
		handle({ action: 'play-item', fromUserId: 'friend', item, positionMs: 42_000, version: 7 });

		expect(mockPlayTrack).toHaveBeenCalledWith(
			expect.objectContaining({ title: 'Song', permalink_url: queueTrack.trackUri }),
			'item-1',
			42_000
		);
		expect(mockSetCurrentItem).toHaveBeenCalledWith('user-1', 'item-1', 7);
		expect(mockSetLocal).toHaveBeenCalledWith();
		unmount();
	});

	it('plays a play-track from its position, with no queue item', async () => {
		const { handle, unmount } = await commandHandler();
		handle({ action: 'play-track', fromUserId: 'friend', track: queueTrack, positionMs: 5000 });

		expect(mockPlayTrack).toHaveBeenCalledWith(
			expect.objectContaining({ title: 'Song' }),
			undefined,
			5000
		);
		expect(mockSetCurrentItem).not.toHaveBeenCalled();
		expect(mockSetLocal).toHaveBeenCalledWith();
		unmount();
	});

	it('still pauses and resumes', async () => {
		const { handle, unmount } = await commandHandler();
		handle({ action: 'pause', fromUserId: 'friend' });
		handle({ action: 'play', fromUserId: 'friend' });
		expect(mockPause).toHaveBeenCalledWith();
		expect(mockResume).toHaveBeenCalledWith();
		expect(mockSetLocal).not.toHaveBeenCalled();
		unmount();
	});
});

const FRIEND = 'friend-1';

function status(deviceId: string) {
	return {
		ownerId: FRIEND,
		device: { deviceId, deviceName: deviceId, platform: 'android', model: 'Pixel' },
		track: { id: 1, title: 'Song', artist: 'Artist', artworkUrl: null },
		isPlaying: true,
		positionMs: 0,
		updatedAt: '2026-10-09T00:00:00Z',
	};
}

function controllable(ids: string[], allDevices = false) {
	return {
		allDevices,
		devices: ids.map(deviceId => ({
			deviceId,
			deviceName: deviceId,
			platform: 'android',
			model: 'Pixel',
			lastSeenAt: '2026-10-09T00:00:00Z',
			access: 'license' as const,
		})),
	};
}

function emitted(event: string) {
	return mockSocket.emit.mock.calls.filter(call => call[0] === event);
}

async function renderFriend() {
	const hook = renderHook(() => useFriendListening(FRIEND));
	await act(async () => {
		await Promise.resolve();
	});
	await act(async () => {
		jest.advanceTimersByTime(500);
	});
	return hook;
}

async function receive(event: string, data: unknown) {
	const calls = mockSocket.on.mock.calls.filter(call => call[0] === event);
	const handle = calls[calls.length - 1]?.[1] as (data: unknown) => void;
	await act(async () => {
		handle(data);
	});
}

describe('useFriendListening', () => {
	it('license on A only: subscribes, A controllable, B not, no command to B', async () => {
		mockGetControllable.mockResolvedValue(controllable(['A']));
		const { result, unmount } = await renderFriend();

		expect(mockGetControllable).toHaveBeenCalledWith(FRIEND);
		expect(mockSocket.emit).toHaveBeenCalledWith('listening:subscribe', FRIEND);

		await receive('listening:status', { ownerId: FRIEND, devices: [status('A'), status('B')] });

		expect(result.current.canControl).toBe(true);
		expect(result.current.devices.map(d => [d.device.deviceId, d.controllable])).toStrictEqual([
			['A', true],
			['B', false],
		]);

		act(() => result.current.remotePlay('B'));
		act(() => result.current.remotePause('B'));
		expect(emitted('control:action')).toHaveLength(0);

		act(() => result.current.remotePlay('A'));
		expect(mockSocket.emit).toHaveBeenCalledWith('control:action', {
			targetUserId: FRIEND,
			targetDeviceId: 'A',
			action: 'play',
		});

		unmount();
	});

	it('all devices: every device controllable', async () => {
		mockGetControllable.mockResolvedValue(controllable(['A', 'B'], true));
		const { result, unmount } = await renderFriend();

		await receive('listening:status', { ownerId: FRIEND, devices: [status('A'), status('B')] });

		expect(result.current.devices.every(d => d.controllable)).toBe(true);
		unmount();
	});

	it('all devices: a device absent from the loaded list is controllable and commanded', async () => {
		mockGetControllable.mockResolvedValue(controllable(['A'], true));
		const { result, unmount } = await renderFriend();

		await receive('listening:status', { ownerId: FRIEND, devices: [status('A'), status('NEW')] });

		expect(result.current.devices.find(d => d.device.deviceId === 'NEW')?.controllable).toBe(true);

		act(() => result.current.remotePause('NEW'));
		expect(mockSocket.emit).toHaveBeenCalledWith('control:action', {
			targetUserId: FRIEND,
			targetDeviceId: 'NEW',
			action: 'pause',
		});
		unmount();
	});

	it('all devices without device rows: still subscribes', async () => {
		mockGetControllable.mockResolvedValue(controllable([], true));
		const { result, unmount } = await renderFriend();

		expect(result.current.canControl).toBe(true);
		expect(mockSocket.emit).toHaveBeenCalledWith('listening:subscribe', FRIEND);
		unmount();
	});

	it('no access: no subscription, no devices, canControl false', async () => {
		mockGetControllable.mockResolvedValue(controllable([]));
		const { result, unmount } = await renderFriend();

		expect(emitted('listening:subscribe')).toHaveLength(0);
		expect(result.current.devices).toStrictEqual([]);
		expect(result.current.canControl).toBe(false);
		unmount();
	});

	it('load fails: treated as no access and logged', async () => {
		mockGetControllable.mockRejectedValue(new Error('network'));
		const { result, unmount } = await renderFriend();

		expect(emitted('listening:subscribe')).toHaveLength(0);
		expect(result.current.canControl).toBe(false);
		expect(logger.error).toHaveBeenCalledWith(
			'[MusicControl] Load controllable devices failed:',
			expect.any(Error)
		);
		unmount();
	});

	it('NOT_AUTHORIZED: sets controlError and reloads the controllable list', async () => {
		mockGetControllable.mockResolvedValue(controllable(['A']));
		const { result, unmount } = await renderFriend();

		act(() => result.current.remotePlay('A'));
		await receive('control:error', { code: 'NOT_AUTHORIZED', message: 'Not authorized' });

		expect(result.current.controlError).toStrictEqual({
			code: 'NOT_AUTHORIZED',
			message: 'Not authorized',
		});
		expect(mockGetControllable).toHaveBeenCalledTimes(2);
		unmount();
	});

	it('DEVICE_OFFLINE: sets controlError without reloading', async () => {
		mockGetControllable.mockResolvedValue(controllable(['A']));
		const { result, unmount } = await renderFriend();

		await receive('control:error', { code: 'DEVICE_OFFLINE', message: 'offline' });

		expect(result.current.controlError?.code).toBe('DEVICE_OFFLINE');
		expect(mockGetControllable).toHaveBeenCalledTimes(1);
		unmount();
	});

	it('permission:changed for this friend: reloads and unsubscribes when empty', async () => {
		mockGetControllable.mockResolvedValueOnce(controllable(['A']));
		const { result, unmount } = await renderFriend();
		expect(emitted('listening:subscribe')).toHaveLength(1);

		mockGetControllable.mockResolvedValueOnce(controllable([]));
		await receive('permission:changed', {
			ownerId: 'someone-else',
			targetUserId: 'user-1',
			canControl: false,
		});
		expect(mockGetControllable).toHaveBeenCalledTimes(1);

		await receive('permission:changed', {
			ownerId: FRIEND,
			targetUserId: 'user-1',
			canControl: false,
		});
		await act(async () => {
			await Promise.resolve();
		});

		expect(mockGetControllable).toHaveBeenCalledTimes(2);
		expect(result.current.canControl).toBe(false);
		expect(mockSocket.emit).toHaveBeenCalledWith('listening:unsubscribe', FRIEND);
		unmount();
	});
});

describe('controlErrorMessage', () => {
	it('maps server codes to French toast texts', () => {
		expect(controlErrorMessage({ code: 'NOT_AUTHORIZED', message: 'x' })).toBe(
			'Vous ne pouvez pas contrôler cet appareil'
		);
		expect(controlErrorMessage({ code: 'DEVICE_OFFLINE', message: 'x' })).toBe(
			"Cet appareil n'est plus en ligne"
		);
		expect(controlErrorMessage({ code: 'OTHER', message: 'Server says no' })).toBe(
			'La commande a échoué, réessayez'
		);
	});
});
