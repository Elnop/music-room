import { act, renderHook } from '@testing-library/react-native';
import { createStore } from 'zustand';
import { useNowPlaying } from './useNowPlaying';
import { registerAuthSession, type SessionView } from '@/shared/backend/lib/authSession';
import { usePlayerStore } from '@/features/playback/shared/player/stores/playerStore';
import { useConnectStore } from '@/features/playback/shared/player/stores/connectStore';
import { useQueueStore } from '@/features/playback/shared/player/stores/queueStore';
import type { ListeningStatus } from '@/features/playback/shared/player/lib/listening.types';
import type { QueueItem } from '@/shared/playback/lib/queue.types';
import type { SoundCloudTrack } from '@/shared/tracks/lib/soundcloud.types';
import type { UserProfile } from '@/shared/users/user.types';

const mockSocket = { connected: true, on: jest.fn(), off: jest.fn(), emit: jest.fn() };
const mockSeekTo = jest.fn();
let mockProgress = { currentTime: 0, duration: 0, progress: 0 };

jest.mock('@/shared/backend/socketStore', () => ({
	useSocketStore: { getState: () => ({ socket: mockSocket }) },
}));

jest.mock('@/features/playback/shared/player/lib/PlayerContext', () => ({
	usePlayer: () => ({ player: {}, seekTo: mockSeekTo }),
}));

jest.mock('./usePlayerProgress', () => ({
	usePlayerProgress: () => mockProgress,
}));

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/shared/backend/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

const localTrack: SoundCloudTrack = {
	id: 7,
	title: 'Local',
	description: null,
	duration: 1000,
	genre: null,
	artwork_url: null,
	permalink_url: 'https://soundcloud.com/artist/local',
	user: { id: 1, username: 'Me', avatar_url: 'avatar', permalink_url: '' },
	playable: true,
};

const item = (id: string, durationMs = 200_000): QueueItem => ({
	id,
	rank: id,
	track: {
		trackUri: `https://soundcloud.com/artist/${id}`,
		title: `Title ${id}`,
		artist: 'Artist',
		album: null,
		albumArt: null,
		durationMs,
	},
	sourcePlaylistId: null,
	blockId: null,
	blockDetached: false,
});

const NOW = Date.parse('2026-10-15T12:00:00Z');

const remoteStatus = (overrides: Partial<ListeningStatus> = {}): ListeningStatus => ({
	ownerId: 'friend',
	device: { deviceId: 'tablet', deviceName: 'Tablette', platform: 'android', model: 'Tab' },
	track: { id: 0, title: 'Title b', artist: 'Artist', artworkUrl: null },
	isPlaying: true,
	positionMs: 10_000,
	updatedAt: new Date(NOW - 5000).toISOString(),
	...overrides,
});

const testSessionStore = createStore<SessionView>(() => ({
	user: { id: 'me' } as UserProfile,
	accessToken: 'test-token',
	isAuthenticated: true,
}));

registerAuthSession({
	store: testSessionStore,
	isTokenExpiringSoon: () => false,
	refreshAccessToken: async () => true,
});

const mockNext = jest.fn(async () => 'played' as const);
const mockPrevious = jest.fn(async () => 'played' as const);

beforeEach(() => {
	jest.clearAllMocks();
	jest.useFakeTimers({ now: NOW });
	mockProgress = { currentTime: 0, duration: 0, progress: 0 };
	testSessionStore.setState({
		user: { id: 'me' } as UserProfile,
		accessToken: 'test-token',
		isAuthenticated: true,
	});
	useConnectStore.setState({
		target: { kind: 'local' },
		remoteStatus: null,
		controlPending: false,
	});
	useQueueStore.setState({ queues: {}, next: mockNext, previous: mockPrevious });
	usePlayerStore.setState({
		currentTrack: null,
		playbackState: 'idle',
		queueItemId: null,
		needsStreamLoad: false,
		startPositionMs: null,
	});
});

afterEach(() => {
	jest.useRealTimers();
	jest.restoreAllMocks();
});

describe('useNowPlaying local', () => {
	it("reads the phone's player", () => {
		mockProgress = { currentTime: 30, duration: 120, progress: 25 };
		usePlayerStore.setState({ currentTrack: localTrack, playbackState: 'playing' });
		const { result } = renderHook(() => useNowPlaying());

		expect(result.current).toMatchObject({
			isRemote: false,
			track: { id: 7, title: 'Local', artist: 'Me', artworkUrl: 'avatar' },
			isPlaying: true,
			canToggle: true,
			positionMs: 30_000,
			durationMs: 120_000,
			deviceLabel: null,
		});
	});

	it('pauses the phone on toggle', () => {
		usePlayerStore.setState({ currentTrack: localTrack, playbackState: 'playing' });
		const { result } = renderHook(() => useNowPlaying());
		act(() => result.current.toggle());
		expect(usePlayerStore.getState().playbackState).toBe('paused');
		expect(mockSocket.emit).not.toHaveBeenCalled();
	});

	it('restarts the track on previous past a few seconds', () => {
		mockProgress = { currentTime: 10, duration: 120, progress: 8 };
		usePlayerStore.setState({ currentTrack: localTrack, playbackState: 'playing' });
		const { result } = renderHook(() => useNowPlaying());
		act(() => result.current.previous());
		expect(mockSeekTo).toHaveBeenCalledWith(0);
		expect(mockPrevious).not.toHaveBeenCalled();
	});
});

describe('useNowPlaying restored track (#312)', () => {
	beforeEach(() => {
		usePlayerStore.getState().restoreTrack(localTrack, null, 30_000);
	});

	it('shows the saved position and the track length, with no player loaded', () => {
		const { result } = renderHook(() => useNowPlaying());

		expect(result.current).toMatchObject({
			track: { id: 7 },
			isPlaying: false,
			canToggle: true,
			positionMs: 30_000,
			durationMs: 1000,
		});
	});

	it('loads the stream on toggle', () => {
		const { result } = renderHook(() => useNowPlaying());
		act(() => result.current.toggle());

		const state = usePlayerStore.getState();
		expect(state.playbackState).toBe('loading');
		expect(state.startPositionMs).toBe(30_000);
		expect(state.needsStreamLoad).toBe(false);
	});

	it('restarts from the saved position on previous', () => {
		const { result } = renderHook(() => useNowPlaying());
		act(() => result.current.previous());
		expect(mockSeekTo).toHaveBeenCalledWith(0);
	});
});

describe('useNowPlaying remote', () => {
	const goRemote = (ownerId = 'friend', ownerUsername?: string) => {
		useConnectStore.setState({
			target: { kind: 'remote', ownerId, deviceId: 'tablet', ownerUsername },
			remoteStatus: null,
			controlPending: false,
		});
	};

	it("shows the device's track, estimated progress and the queue item's duration", () => {
		const { hashStringToNumber } = jest.requireActual(
			'@/features/playback/shared/player/lib/trackToSoundCloud'
		);
		goRemote('friend', 'Léa');
		useQueueStore.setState({
			queues: {
				friend: { version: 1, currentItemId: 'b', items: [item('a'), item('b'), item('c')] },
			},
		});
		const status = remoteStatus({
			track: {
				id: hashStringToNumber(item('b').track.trackUri),
				title: 'Title b',
				artist: 'Artist',
				artworkUrl: null,
			},
		});
		useConnectStore.setState({ remoteStatus: status });
		usePlayerStore.setState({ currentTrack: localTrack, playbackState: 'playing' });

		const { result } = renderHook(() => useNowPlaying());

		expect(result.current).toMatchObject({
			isRemote: true,
			track: { title: 'Title b' },
			isPlaying: true,
			positionMs: 15_000,
			durationMs: 200_000,
			deviceLabel: 'Tablette de Léa',
			hasNext: true,
			hasPrevious: true,
		});

		act(() => jest.advanceTimersByTime(2000));
		expect(result.current.positionMs).toBe(17_000);
	});

	it('has no duration for a track off the queue', () => {
		goRemote();
		useConnectStore.setState({
			remoteStatus: remoteStatus({
				track: { id: 1, title: 'X', artist: 'Y', artworkUrl: null },
			}),
		});
		const { result } = renderHook(() => useNowPlaying());
		expect(result.current.durationMs).toBeNull();
	});

	it('names my own device without my username', () => {
		goRemote('me', 'Moi');
		useConnectStore.setState({ remoteStatus: remoteStatus({ ownerId: 'me' }) });
		const { result } = renderHook(() => useNowPlaying());
		expect(result.current.deviceLabel).toBe('Tablette');
	});

	it('sends play/pause as control:action', () => {
		goRemote();
		useConnectStore.setState({ remoteStatus: remoteStatus() });
		const { result } = renderHook(() => useNowPlaying());
		act(() => result.current.toggle());
		expect(mockSocket.emit).toHaveBeenCalledWith('control:action', {
			targetUserId: 'friend',
			targetDeviceId: 'tablet',
			action: 'pause',
		});
	});

	it('steps the remote queue with its device and never restarts locally', async () => {
		goRemote();
		mockProgress = { currentTime: 10, duration: 120, progress: 8 };
		useConnectStore.setState({ remoteStatus: remoteStatus() });
		const { result } = renderHook(() => useNowPlaying());
		await act(async () => result.current.previous());
		expect(mockPrevious).toHaveBeenCalledTimes(1);
		expect(mockSeekTo).not.toHaveBeenCalled();
	});
});
