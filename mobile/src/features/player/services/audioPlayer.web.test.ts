import { act, renderHook } from '@testing-library/react-native';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { useAutoplayStore } from '@/features/player/stores/autoplayStore';
import type { SoundCloudTrack } from '@/types/soundcloud.types';
import { FakeMediaElement, autoplayRefusal, installFakeDocument } from '@/test/fakeMediaElement';
import { useAudioPlayer, useAudioPlayerStatus } from './audioPlayer.web';

const mockHls = {
	instances: [] as {
		loadSource: jest.Mock;
		attachMedia: jest.Mock;
		destroy: jest.Mock;
		on: jest.Mock;
	}[],
	supported: true,
};

jest.mock('hls.js', () => {
	const Hls = jest.fn(() => {
		const instance = {
			loadSource: jest.fn(),
			attachMedia: jest.fn(),
			destroy: jest.fn(),
			on: jest.fn(),
		};
		mockHls.instances.push(instance);
		return instance;
	});
	Object.assign(Hls, { isSupported: () => mockHls.supported, Events: { ERROR: 'hlsError' } });
	return { __esModule: true, default: Hls };
});

jest.mock('expo-audio', () => {
	throw new Error('the web variant must not load expo-audio');
});

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const media = new FakeMediaElement();
installFakeDocument(media);

const STREAM = 'https://playback.media-streaming.soundcloud.cloud/abc/playlist.m3u8';
const track = {
	id: 7,
	title: 'Song',
	permalink_url: 'https://soundcloud.com/a/song',
} as SoundCloudTrack;

function renderPlayer(source = STREAM) {
	return renderHook(
		({ url }: { url: string }) => {
			const player = useAudioPlayer(url);
			return { player, status: useAudioPlayerStatus(player) };
		},
		{ initialProps: { url: source } }
	);
}

beforeEach(() => {
	jest.clearAllMocks();
	mockHls.instances = [];
	mockHls.supported = true;
	Object.assign(media, { nativeHls: '', paused: true, ended: false, readyState: 0, duration: NaN });
	media.currentTime = 0;
	media.error = null;
	media.playResult = () => Promise.resolve();
	usePlayerStore.setState(usePlayerStore.getInitialState());
	useAutoplayStore.setState({ blocked: false });
});

describe('useAudioPlayer (web)', () => {
	it('feeds the HLS stream through hls.js when the browser cannot read it', () => {
		const { unmount } = renderPlayer();

		expect(mockHls.instances).toHaveLength(1);
		expect(mockHls.instances[0].loadSource).toHaveBeenCalledWith(STREAM);
		expect(mockHls.instances[0].attachMedia).toHaveBeenCalledWith(media);
		unmount();
		expect(mockHls.instances[0].destroy).toHaveBeenCalled();
	});

	it('hands the stream to a browser that reads HLS itself', () => {
		media.nativeHls = 'maybe';
		const { unmount } = renderPlayer();

		expect(mockHls.instances).toHaveLength(0);
		expect(media.src).toBe(STREAM);
		unmount();
		expect(media.src).toBe('');
	});

	it('reports load, position, and the end of the track', () => {
		const { result, unmount } = renderPlayer();
		expect(result.current.status).toMatchObject({ isLoaded: false, playbackState: 'loading' });

		act(() => media.loadStream(180));
		expect(result.current.player.isLoaded).toBe(true);
		expect(result.current.status).toMatchObject({
			isLoaded: true,
			duration: 180,
			playbackState: 'ready',
		});

		act(() => {
			void result.current.player.seekTo(42);
			media.emit('seeked');
		});
		expect(result.current.status.currentTime).toBe(42);

		act(() => media.finish());
		expect(result.current.status).toMatchObject({ didJustFinish: true, playbackState: 'ended' });
		unmount();
	});

	it('reports a fatal stream error as failed, for the watchdog to renew the URL', () => {
		const { result, unmount } = renderPlayer();
		act(() => media.loadStream(180));
		const onError = mockHls.instances[0].on.mock.calls[0][1] as (e: string, d: object) => void;

		act(() => onError('hlsError', { fatal: false }));
		expect(result.current.status.playbackState).toBe('ready');
		act(() => onError('hlsError', { fatal: true }));
		expect(result.current.status).toMatchObject({ playbackState: 'failed', isLoaded: false });
		unmount();
	});

	it('plays, pauses, and sets the volume of the element', async () => {
		const { result, unmount } = renderPlayer();
		act(() => media.loadStream(180));

		await act(async () => result.current.player.play());
		expect(result.current.status.playing).toBe(true);
		act(() => result.current.player.pause());
		expect(result.current.status.playing).toBe(false);
		result.current.player.volume = 1.5;
		expect(media.volume).toBe(1);
		unmount();
	});

	it('gives the element to the next stream, and the previous player lets go of it', async () => {
		const { result, rerender, unmount } = renderPlayer();
		const first = result.current.player;
		act(() => media.loadStream(180));
		await act(async () => first.play());

		rerender({ url: `${STREAM}?next` });

		expect(result.current.player.id).not.toBe(first.id);
		expect(mockHls.instances[0].destroy).toHaveBeenCalled();
		expect(mockHls.instances[1].loadSource).toHaveBeenCalledWith(`${STREAM}?next`);
		expect(first.playing).toBe(false);
		first.pause();
		expect(media.pause).toHaveBeenCalledTimes(1);
		unmount();
	});

	it('pauses the store and asks for a click when the browser refuses to play', async () => {
		act(() => {
			usePlayerStore.getState().playTrack(track, 'q7');
			usePlayerStore.getState().setPlaybackPlaying();
		});
		media.playResult = autoplayRefusal;
		const { result, unmount } = renderPlayer();
		act(() => media.loadStream(180));

		await act(async () => result.current.player.play());

		expect(useAutoplayStore.getState().blocked).toBe(true);
		expect(usePlayerStore.getState()).toMatchObject({ playbackState: 'paused', isPlaying: false });
		expect(result.current.status.playing).toBe(false);

		media.playResult = () => Promise.resolve();
		await act(async () => result.current.player.play());
		expect(useAutoplayStore.getState().blocked).toBe(false);
		unmount();
	});

	it('ignores a play() interrupted by a pause', async () => {
		act(() => {
			usePlayerStore.getState().playTrack(track, 'q7');
			usePlayerStore.getState().setPlaybackPlaying();
		});
		media.playResult = () =>
			Promise.reject(Object.assign(new Error('interrupted'), { name: 'AbortError' }));
		const { result, unmount } = renderPlayer();

		await act(async () => result.current.player.play());

		expect(useAutoplayStore.getState().blocked).toBe(false);
		expect(usePlayerStore.getState().playbackState).toBe('playing');
		unmount();
	});
});
