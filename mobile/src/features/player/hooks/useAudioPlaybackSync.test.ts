import { act, renderHook } from '@testing-library/react-native';
import type { useAudioPlayer } from 'expo-audio';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { PLAYER_LOAD_TIMEOUT_MS } from '@/features/player/constants';
import type { SoundCloudTrack } from '@/types/soundcloud.types';
import { useAudioPlaybackSync } from './useAudioPlaybackSync';

jest.mock('@/shared/services/connectBridge', () => ({ isLocalTarget: () => true }));

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
		usePlayerStore.getState().playTrack(track, 'q7');
		usePlayerStore.getState().setStreamUrl('https://stream/7', Date.now() + 1_800_000);
	});
}

describe('useAudioPlaybackSync', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		usePlayerStore.setState(usePlayerStore.getInitialState());
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('renews the stream once when it does not load in time', () => {
		renderHook(() => useAudioPlaybackSync(neverLoadingPlayer));
		startLoading();
		const loadCounter = usePlayerStore.getState().loadCounter;

		act(() => jest.advanceTimersByTime(PLAYER_LOAD_TIMEOUT_MS));

		const state = usePlayerStore.getState();
		expect(state.error).toBeNull();
		expect(state.streamRenewed).toBe(true);
		expect(state.loadCounter).toBe(loadCounter + 1);
		expect(state.currentTrack).toEqual(track);
	});

	it('shows the error when the renewed stream does not load either', () => {
		renderHook(() => useAudioPlaybackSync(neverLoadingPlayer));
		startLoading();
		act(() => usePlayerStore.setState({ streamRenewed: true }));

		act(() => jest.advanceTimersByTime(PLAYER_LOAD_TIMEOUT_MS));

		expect(usePlayerStore.getState().error).toBe('Impossible de charger ce titre');
	});
});
