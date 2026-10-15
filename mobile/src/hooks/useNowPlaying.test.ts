import { act, renderHook } from '@testing-library/react-native';
import { useNowPlaying } from '@/hooks/useNowPlaying';
import { useConnectStore } from '@/store/connectStore';
import { useAuthStore } from '@/store/authStore';
import { usePlayerStore } from '@/store/playerStore';
import { useQueueStore } from '@/store/queueStore';
import { queueApi } from '@/services/queueApi';
import type { ListeningStatus } from '@/types/listening.types';
import type { QueueItem } from '@/types/queue.types';
import type { SoundCloudTrack } from '@/types/soundcloud.types';
import type { UserProfile } from '@/types/user.types';

const mockSocket = { connected: true, on: jest.fn(), off: jest.fn(), emit: jest.fn() };
const mockSeekTo = jest.fn();
let mockProgress = { currentTime: 0, duration: 0, progress: 0 };

jest.mock('@/store/socketStore', () => ({
	useSocketStore: { getState: () => ({ socket: mockSocket }) },
}));

jest.mock('@/contexts/PlayerContext', () => ({
	usePlayer: () => ({ player: { seekTo: mockSeekTo } }),
}));

jest.mock('@/hooks/usePlayerProgress', () => ({
	usePlayerProgress: () => mockProgress,
}));

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/lib/supabase', () => ({
	supabase: { auth: { signOut: jest.fn(), setSession: jest.fn() } },
}));

jest.mock('@services/oauth', () => ({
	signInWithGoogle: jest.fn(),
	signInWithFacebook: jest.fn(),
}));

jest.mock('@/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

jest.mock('@/services/queueApi', () => ({
	queueApi: { next: jest.fn(), previous: jest.fn() },
}));

jest.mock('@utils/toast', () => ({
	showInfo: jest.fn(),
	showError: jest.fn(),
	showSuccess: jest.fn(),
}));

const api = queueApi as jest.Mocked<typeof queueApi>;

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

beforeEach(() => {
	jest.clearAllMocks();
	jest.useFakeTimers({ now: NOW });
	jest.spyOn(console, 'log').mockImplementation(() => undefined);
	mockProgress = { currentTime: 0, duration: 0, progress: 0 };
	useAuthStore.setState({ user: { id: 'me' } as UserProfile, isAuthenticated: true });
	useConnectStore.setState({ target: { kind: 'local' }, remoteStatus: null });
	useQueueStore.getState().reset();
	usePlayerStore.setState({ currentTrack: null, playbackState: 'idle', queueItemId: null });
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
		expect(api.previous).not.toHaveBeenCalled();
	});
});

describe('useNowPlaying remote', () => {
	const goRemote = (ownerId = 'friend', ownerUsername?: string) =>
		useConnectStore.setState({
			target: { kind: 'remote', ownerId, deviceId: 'tablet', ownerUsername },
		});

	it("shows the device's track, estimated progress and the queue item's duration", () => {
		const { hashStringToNumber } = jest.requireActual('@utils/trackToSoundCloud');
		goRemote('friend', 'Léa');
		useQueueStore.getState().applyState({
			ownerId: 'friend',
			version: 1,
			currentItemId: 'b',
			items: [item('a'), item('b'), item('c')],
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
		useConnectStore.setState({
			remoteStatus: remoteStatus({ track: { id: 1, title: 'X', artist: 'Y', artworkUrl: null } }),
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
		api.previous.mockResolvedValue({ ok: false, code: 'QUEUE_START' });
		const { result } = renderHook(() => useNowPlaying());
		await act(async () => result.current.previous());
		expect(api.previous).toHaveBeenCalledWith({ ownerId: 'friend', deviceId: 'tablet' });
		expect(mockSeekTo).not.toHaveBeenCalled();
	});
});
