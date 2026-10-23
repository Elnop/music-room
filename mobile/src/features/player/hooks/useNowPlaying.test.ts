import { act, renderHook } from '@testing-library/react-native';
import { createStore } from 'zustand';
import { useNowPlaying } from './useNowPlaying';
import { registerAuthSession, type SessionView } from '@/shared/services/authSession';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { registerConnectBridge, type ConnectSnapshot } from '@/shared/services/connectBridge';
import { registerPlaybackBridge, type OwnerQueue } from '@/shared/services/playbackBridge';
import type { ListeningStatus } from '@/types/listening.types';
import type { QueueItem } from '@/types/queue.types';
import type { SoundCloudTrack } from '@/types/soundcloud.types';
import type { UserProfile } from '@/types/user.types';

const mockSocket = { connected: true, on: jest.fn(), off: jest.fn(), emit: jest.fn() };
const mockSeekTo = jest.fn();
let mockProgress = { currentTime: 0, duration: 0, progress: 0 };

jest.mock('@/shared/stores/socketStore', () => ({
	useSocketStore: { getState: () => ({ socket: mockSocket }) },
}));

jest.mock('@/features/player/context/PlayerContext', () => ({
	usePlayer: () => ({ player: {}, seekTo: mockSeekTo }),
}));

jest.mock('./usePlayerProgress', () => ({
	usePlayerProgress: () => mockProgress,
}));

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/shared/services/deviceService', () => ({
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

let testQueue: OwnerQueue = {
	currentItemId: null,
	items: [],
	version: 0,
};

let testConnectState: ConnectSnapshot = {
	target: { kind: 'local' },
	remoteStatus: null,
	controlPending: false,
};

const mockNext = jest.fn(async () => 'played' as const);
const mockPrevious = jest.fn(async () => 'played' as const);

registerPlaybackBridge({
	usePlaylistPlayback: () => ({ playingUri: null, state: null }),
	usePlayerHeight: () => 0,
	useActiveQueue: () => testQueue,
	addToQueue: jest.fn(async () => true),
	playNext: jest.fn(async () => true),
	playPlaylist: jest.fn(async () => 'ok'),
	next: mockNext,
	previous: mockPrevious,
	playListTrack: jest.fn(async () => undefined),
	playTrack: jest.fn(),
	pause: jest.fn(),
	resume: jest.fn(),
	stop: jest.fn(),
	getPlayerState: () => ({ currentTrack: null, queueItemId: null, loadCounter: 0, positionMs: 0 }),
});

registerConnectBridge({
	useConnect: selector => selector(testConnectState),
	useIsLocal: () => testConnectState.target.kind === 'local',
	getConnectState: () => testConnectState,
	setRemoteStatus: status => {
		testConnectState.remoteStatus = status;
	},
	setControlPending: pending => {
		testConnectState.controlPending = pending;
	},
	setLocal: () => {
		testConnectState.target = { kind: 'local' };
	},
	setRemote: target => {
		testConnectState.target = { kind: 'remote', ...target };
	},
});

beforeEach(() => {
	jest.clearAllMocks();
	jest.useFakeTimers({ now: NOW });
	mockProgress = { currentTime: 0, duration: 0, progress: 0 };
	testSessionStore.setState({
		user: { id: 'me' } as UserProfile,
		accessToken: 'test-token',
		isAuthenticated: true,
	});
	testConnectState = { target: { kind: 'local' }, remoteStatus: null, controlPending: false };
	testQueue = { currentItemId: null, items: [], version: 0 };
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
		testConnectState = {
			target: { kind: 'remote', ownerId, deviceId: 'tablet', ownerUsername },
			remoteStatus: null,
			controlPending: false,
		};
	};

	it("shows the device's track, estimated progress and the queue item's duration", () => {
		const { hashStringToNumber } = jest.requireActual('@/shared/utils/trackToSoundCloud');
		goRemote('friend', 'Léa');
		testQueue = {
			version: 1,
			currentItemId: 'b',
			items: [item('a'), item('b'), item('c')],
		};
		const status = remoteStatus({
			track: {
				id: hashStringToNumber(item('b').track.trackUri),
				title: 'Title b',
				artist: 'Artist',
				artworkUrl: null,
			},
		});
		testConnectState.remoteStatus = status;
		// Local audio is ignored in remote mode.
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
		testConnectState.remoteStatus = remoteStatus({
			track: { id: 1, title: 'X', artist: 'Y', artworkUrl: null },
		});
		const { result } = renderHook(() => useNowPlaying());
		expect(result.current.durationMs).toBeNull();
	});

	it('names my own device without my username', () => {
		goRemote('me', 'Moi');
		testConnectState.remoteStatus = remoteStatus({ ownerId: 'me' });
		const { result } = renderHook(() => useNowPlaying());
		expect(result.current.deviceLabel).toBe('Tablette');
	});

	it('sends play/pause as control:action', () => {
		goRemote();
		testConnectState.remoteStatus = remoteStatus();
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
		testConnectState.remoteStatus = remoteStatus();
		const { result } = renderHook(() => useNowPlaying());
		await act(async () => result.current.previous());
		expect(mockPrevious).toHaveBeenCalledTimes(1);
		expect(mockSeekTo).not.toHaveBeenCalled();
	});
});
