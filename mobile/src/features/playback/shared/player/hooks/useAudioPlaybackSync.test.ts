import { act, renderHook } from '@testing-library/react-native';
import type { useAudioPlayer } from 'expo-audio';
import { playerStore } from '@/features/playback/shared/player/stores/playerStore';
import { connectStore } from '@/features/playback/shared/player/stores/connectStore';
import { PLAYER_LOAD_TIMEOUT_MS } from '@/features/playback/shared/player/configs/playerConfig';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';
import { useAudioPlaybackSync } from '@/features/playback/shared/player/hooks/useAudioPlaybackSync';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const track = {
	id: 7,
	title: 'Track 7',
	permalink_url: 'https://soundcloud.com/artist/track-7',
} as SoundCloudTrack;

const neverLoadingPlayer = {
	isLoaded: false,
	duration: 0,
	playing: false,
	play: jest.fn(),
	pause: jest.fn(),
	seekTo: jest.fn(),
} as unknown as ReturnType<typeof useAudioPlayer>;

function startLoading() {
	act(() => {
		playerStore.getState().playTrack(track, 'q7');
		playerStore.getState().setStreamUrl('https://stream/7', Date.now() + 1_800_000);
	});
}

describe('useAudioPlaybackSync', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		playerStore.setState(playerStore.getInitialState());
		connectStore.setState({ target: { kind: 'local' } });
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('renews the stream once when it does not load in time', () => {
		renderHook(() => useAudioPlaybackSync(neverLoadingPlayer));
		startLoading();
		const loadCounter = playerStore.getState().loadCounter;

		act(() => jest.advanceTimersByTime(PLAYER_LOAD_TIMEOUT_MS));

		const state = playerStore.getState();
		expect(state.error).toBeNull();
		expect(state.streamRenewed).toBe(true);
		expect(state.loadCounter).toBe(loadCounter + 1);
		expect(state.currentTrack).toStrictEqual(track);
	});

	it('shows the error when the renewed stream does not load either', () => {
		renderHook(() => useAudioPlaybackSync(neverLoadingPlayer));
		startLoading();
		act(() => playerStore.setState({ streamRenewed: true }));

		act(() => jest.advanceTimersByTime(PLAYER_LOAD_TIMEOUT_MS));

		expect(playerStore.getState().error).toBe('Impossible de charger ce titre');
	});
});
