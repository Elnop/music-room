import { AppState, type AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';
import {
	LAST_TRACK_PLAY_SAVE_DELAY_MS,
	LAST_TRACK_SAVE_INTERVAL_MS,
	useLastTrackPersistence,
} from '@/hooks/useLastTrackPersistence';
import { lastTrackStorage, type LastTrackEntry } from '@/services/lastTrackStorage';
import { usePlayerStore, setPositionReader } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import { useConnectStore } from '@/store/connectStore';
import { queueTrackToSoundCloud } from '@utils/trackToSoundCloud';
import type { UserProfile } from '@/types/user.types';

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

const saved: LastTrackEntry = {
	track: {
		trackUri: 'https://soundcloud.com/artist/song',
		title: 'Song',
		artist: 'Artist',
		album: null,
		albumArt: 'https://img/art.jpg',
		durationMs: 200_000,
	},
	queueItemId: 'q1',
	positionMs: 42_000,
};

const other = queueTrackToSoundCloud({
	...saved.track,
	trackUri: 'https://soundcloud.com/artist/other',
	title: 'Other',
});

const initialPlayerState = usePlayerStore.getState();
let position = 0;
let appStateListener: ((state: AppStateStatus) => void) | null = null;

async function flush() {
	await act(async () => {
		for (let i = 0; i < 5; i++) await Promise.resolve();
	});
}

async function mount() {
	const view = renderHook(() => useLastTrackPersistence());
	await flush();
	return view;
}

const stored = () => lastTrackStorage.load('me');

beforeEach(async () => {
	await AsyncStorage.clear();
	position = 0;
	appStateListener = null;
	setPositionReader(() => position);
	jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
		appStateListener = listener as (state: AppStateStatus) => void;
		return { remove: jest.fn() } as unknown as ReturnType<typeof AppState.addEventListener>;
	});
	usePlayerStore.setState(initialPlayerState, true);
	useConnectStore.getState().setLocal();
	useAuthStore.setState({ user: { id: 'me' } as UserProfile, isAuthenticated: true });
});

afterEach(() => {
	setPositionReader(null);
	jest.useRealTimers();
	jest.restoreAllMocks();
});

describe('useLastTrackPersistence restore', () => {
	it('restores the saved track, paused, without loading it', async () => {
		await lastTrackStorage.save('me', saved);
		await mount();

		const state = usePlayerStore.getState();
		expect(state.currentTrack?.permalink_url).toBe(saved.track.trackUri);
		expect(state.currentTrack?.title).toBe('Song');
		expect(state.queueItemId).toBe('q1');
		expect(state.startPositionMs).toBe(42_000);
		expect(state.playbackState).toBe('paused');
		expect(state.needsStreamLoad).toBe(true);
		expect(state.streamUrl).toBeNull();
	});

	it('leaves the player empty without an entry', async () => {
		await mount();
		expect(usePlayerStore.getState().currentTrack).toBeNull();
	});

	it("does not restore another user's entry", async () => {
		await lastTrackStorage.save('someone-else', saved);
		await mount();
		expect(usePlayerStore.getState().currentTrack).toBeNull();
	});

	it('does not restore in remote mode', async () => {
		await lastTrackStorage.save('me', saved);
		useConnectStore.setState({ target: { kind: 'remote', ownerId: 'me', deviceId: 'tablet' } });
		await mount();
		expect(usePlayerStore.getState().currentTrack).toBeNull();
	});

	it('keeps a track the user started before the restore resolved', async () => {
		await lastTrackStorage.save('me', saved);
		renderHook(() => useLastTrackPersistence());
		act(() => usePlayerStore.getState().playTrack(other, null));
		await flush();

		expect(usePlayerStore.getState().currentTrack?.title).toBe('Other');
		expect((await stored())?.track.title).toBe('Other');
	});

	it('deletes a corrupt entry and starts empty', async () => {
		await AsyncStorage.setItem('zumik:lastTrack:me', '{oops');
		await mount();

		expect(usePlayerStore.getState().currentTrack).toBeNull();
		expect(await AsyncStorage.getItem('zumik:lastTrack:me')).toBeNull();
	});

	it('does nothing without a user', async () => {
		useAuthStore.setState({ user: null, isAuthenticated: false });
		await lastTrackStorage.save('me', saved);
		await mount();
		expect(usePlayerStore.getState().currentTrack).toBeNull();
	});
});

describe('useLastTrackPersistence save', () => {
	it('saves on track change, with no stream URL', async () => {
		await mount();
		act(() => usePlayerStore.getState().playTrack(other, 'q2'));
		await flush();

		expect(await stored()).toEqual({
			track: {
				trackUri: other.permalink_url,
				title: 'Other',
				artist: 'Artist',
				album: null,
				albumArt: 'https://img/art.jpg',
				durationMs: 200_000,
			},
			queueItemId: 'q2',
			positionMs: 0,
		});
		act(() => usePlayerStore.getState().setStreamUrl('https://cf-media/stream'));
		await flush();
		expect(await AsyncStorage.getItem('zumik:lastTrack:me')).not.toContain('cf-media');
	});

	it('saves the position on pause', async () => {
		await mount();
		act(() => {
			usePlayerStore.getState().playTrack(other, null);
			usePlayerStore.getState().setPlaybackPlaying();
		});
		position = 75_000;
		act(() => usePlayerStore.getState().pause());
		await flush();

		expect((await stored())?.positionMs).toBe(75_000);
	});

	it('saves every interval while playing', async () => {
		jest.useFakeTimers();
		await mount();
		act(() => {
			usePlayerStore.getState().playTrack(other, null);
			usePlayerStore.getState().setPlaybackPlaying();
		});
		await flush();
		act(() => jest.advanceTimersByTime(LAST_TRACK_PLAY_SAVE_DELAY_MS));
		await flush();
		position = 12_000;

		act(() =>
			jest.advanceTimersByTime(LAST_TRACK_SAVE_INTERVAL_MS - LAST_TRACK_PLAY_SAVE_DELAY_MS)
		);
		await flush();

		expect((await stored())?.positionMs).toBe(12_000);
	});

	it('saves the position after the start seek once playing', async () => {
		jest.useFakeTimers();
		await lastTrackStorage.save('me', saved);
		await mount();
		// Play loads the restored track; the store says playing before the seek lands.
		act(() => {
			usePlayerStore.getState().resume();
			usePlayerStore.getState().setPlaybackPlaying();
		});
		await flush();
		position = 0;
		act(() => jest.advanceTimersByTime(LAST_TRACK_PLAY_SAVE_DELAY_MS - 100));
		await flush();
		expect((await stored())?.positionMs).toBe(42_000);

		position = 42_500;
		act(() => jest.advanceTimersByTime(100));
		await flush();
		expect((await stored())?.positionMs).toBe(42_500);
	});

	it('saves a seek on a restored track', async () => {
		await lastTrackStorage.save('me', saved);
		await mount();
		act(() => usePlayerStore.getState().setRestoredPosition(90_000));
		await flush();

		expect((await stored())?.positionMs).toBe(90_000);
	});

	it('saves when the app goes to the background', async () => {
		await mount();
		act(() => {
			usePlayerStore.getState().playTrack(other, null);
			usePlayerStore.getState().setPlaybackPlaying();
		});
		await flush();
		position = 33_000;

		act(() => appStateListener?.('background'));
		await flush();

		expect((await stored())?.positionMs).toBe(33_000);
	});

	it('deletes the entry when the player is emptied', async () => {
		await lastTrackStorage.save('me', saved);
		await mount();
		act(() => usePlayerStore.getState().setTrackUnavailableError('gone'));
		await flush();

		expect(await stored()).toBeNull();
	});

	it('saves nothing in remote mode', async () => {
		useConnectStore.setState({ target: { kind: 'remote', ownerId: 'me', deviceId: 'tablet' } });
		await mount();
		act(() => usePlayerStore.getState().playTrack(other, null));
		await flush();

		expect(await stored()).toBeNull();
	});
});

describe('logout (#312)', () => {
	it('deletes the saved entry', async () => {
		await lastTrackStorage.save('me', saved);
		useAuthStore.setState({ accessToken: null });

		await useAuthStore.getState().logout();

		expect(await stored()).toBeNull();
	});

	it("restores the next user's entry, never saving the previous user's track for them", async () => {
		const bTrack = { ...saved.track, trackUri: 'https://soundcloud.com/b/song', title: 'B song' };
		await lastTrackStorage.save('b', { ...saved, track: bTrack });
		const view = await mount();
		act(() => {
			usePlayerStore.getState().playTrack(other, null);
			usePlayerStore.getState().setPlaybackPlaying();
		});
		await flush();
		useAuthStore.setState({ accessToken: null });

		await act(async () => useAuthStore.getState().logout());
		expect(usePlayerStore.getState().currentTrack).toBeNull();
		await act(async () =>
			useAuthStore.setState({ user: { id: 'b' } as UserProfile, isAuthenticated: true })
		);
		view.rerender({});
		await flush();

		expect(usePlayerStore.getState().currentTrack?.title).toBe('B song');
		expect((await lastTrackStorage.load('b'))?.track.title).toBe('B song');
		expect(await stored()).toBeNull();
	});
});
