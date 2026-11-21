import { act, renderHook } from '@testing-library/react-native';
import type { AlertButton } from 'react-native';
import { useAutoplayStore } from '@/features/playback/shared/player/stores/autoplayStore';
import { usePlayerStore } from '@/features/playback/shared/player/stores/playerStore';
import type { AudioPlayer } from '@/features/playback/shared/player/lib/types';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';
import { showAlert } from '@/shared/alerts/showAlert';
import { useAutoplayPrompt } from '@/features/playback/shared/player/hooks/useAutoplayPrompt';

jest.mock('@/shared/alerts/showAlert', () => ({ showAlert: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const player = { play: jest.fn() } as unknown as AudioPlayer;
const track = {
	id: 7,
	title: 'Song',
	permalink_url: 'https://soundcloud.com/a/song',
} as SoundCloudTrack;

function shownButtons() {
	return (showAlert as jest.Mock).mock.calls[0][2] as AlertButton[];
}

beforeEach(() => {
	jest.clearAllMocks();
	useAutoplayStore.setState({ blocked: false });
	usePlayerStore.setState(usePlayerStore.getInitialState());
	usePlayerStore.getState().playTrack(track, 'q7');
	usePlayerStore.getState().setPlaybackPlaying();
	usePlayerStore.getState().pause();
});

describe('useAutoplayPrompt', () => {
	it('asks once per refusal, naming the track', () => {
		renderHook(() => useAutoplayPrompt(player));
		expect(showAlert).not.toHaveBeenCalled();

		act(() => useAutoplayStore.getState().setBlocked(true));
		act(() => useAutoplayStore.getState().setBlocked(true));

		expect(showAlert).toHaveBeenCalledTimes(1);
		expect(showAlert).toHaveBeenCalledWith(
			'Cliquer pour activer le son',
			'Le navigateur attend un clic pour lire « Song ».',
			expect.any(Array)
		);
	});

	it('plays inside the click, then resumes the store', () => {
		renderHook(() => useAutoplayPrompt(player));
		act(() => useAutoplayStore.getState().setBlocked(true));

		act(() => shownButtons()[1].onPress?.());

		expect(player.play).toHaveBeenCalled();
		expect(useAutoplayStore.getState().blocked).toBe(false);
		expect(usePlayerStore.getState().playbackState).toBe('playing');
	});

	it('stays paused when the listener declines', () => {
		renderHook(() => useAutoplayPrompt(player));
		act(() => useAutoplayStore.getState().setBlocked(true));

		act(() => shownButtons()[0].onPress?.());

		expect(player.play).not.toHaveBeenCalled();
		expect(useAutoplayStore.getState().blocked).toBe(false);
		expect(usePlayerStore.getState().playbackState).toBe('paused');
	});
});
