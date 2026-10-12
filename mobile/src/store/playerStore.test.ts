import { usePlayerStore, type PlaybackState } from '@/store/playerStore';
import type { SoundCloudTrack } from '@/types/soundcloud.types';

const initialState = usePlayerStore.getState();

const makeTrack = (id: number): SoundCloudTrack => ({
	id,
	title: `Track ${id}`,
	description: null,
	duration: 180000,
	genre: null,
	artwork_url: null,
	permalink_url: `https://soundcloud.com/artist/track-${id}`,
	user: {
		id: 1,
		username: 'artist',
		avatar_url: null,
		permalink_url: 'https://soundcloud.com/artist',
	},
	playable: true,
});

const withState = (playbackState: PlaybackState) => usePlayerStore.setState({ playbackState });

beforeEach(() => {
	usePlayerStore.setState(initialState, true);
	jest.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('playerStore playTrack', () => {
	it('sets the current track and enters the loading state', () => {
		const track = makeTrack(42);
		usePlayerStore.setState({
			streamUrl: 'https://stream/old',
			error: 'old error',
			isModalOpen: true,
			isPlaying: true,
		});

		usePlayerStore.getState().playTrack(track);

		const state = usePlayerStore.getState();
		expect(state.currentTrack).toEqual(track);
		expect(state.pendingTrackId).toBe(42);
		expect(state.playbackState).toBe('loading');
		expect(state.loading).toBe(true);
		expect(state.isPlaying).toBe(false);
		expect(state.streamUrl).toBeNull();
		expect(state.error).toBeNull();
		expect(state.isModalOpen).toBe(false);
		expect(state.loadCounter).toBe(1);
	});

	it('increments loadCounter each time, even for the same track', () => {
		const track = makeTrack(7);

		usePlayerStore.getState().playTrack(track);
		usePlayerStore.getState().playTrack(track);

		expect(usePlayerStore.getState().loadCounter).toBe(2);
		expect(usePlayerStore.getState().currentTrack).toEqual(track);
	});

	it('replaces the current track with the new one', () => {
		usePlayerStore.getState().playTrack(makeTrack(1));
		usePlayerStore.getState().playTrack(makeTrack(2));

		expect(usePlayerStore.getState().currentTrack?.id).toBe(2);
		expect(usePlayerStore.getState().pendingTrackId).toBe(2);
	});
});

describe('playerStore state machine', () => {
	it('setPlaybackReady moves loading to ready and clears pending track', () => {
		usePlayerStore.getState().playTrack(makeTrack(3));

		usePlayerStore.getState().setPlaybackReady();

		const state = usePlayerStore.getState();
		expect(state.playbackState).toBe('ready');
		expect(state.loading).toBe(false);
		expect(state.pendingTrackId).toBeNull();
	});

	it.each<PlaybackState>(['idle', 'ready', 'playing', 'paused'])(
		'setPlaybackReady is a no-op from %s',
		from => {
			withState(from);
			usePlayerStore.getState().setPlaybackReady();
			expect(usePlayerStore.getState().playbackState).toBe(from);
		}
	);

	it.each<PlaybackState>(['loading', 'ready', 'paused'])(
		'setPlaybackPlaying moves %s to playing',
		from => {
			usePlayerStore.setState({ playbackState: from, loading: true, pendingTrackId: 9 });

			usePlayerStore.getState().setPlaybackPlaying();

			const state = usePlayerStore.getState();
			expect(state.playbackState).toBe('playing');
			expect(state.isPlaying).toBe(true);
			expect(state.loading).toBe(false);
			expect(state.pendingTrackId).toBeNull();
		}
	);

	it('setPlaybackPlaying is a no-op from idle', () => {
		usePlayerStore.getState().setPlaybackPlaying();
		expect(usePlayerStore.getState().playbackState).toBe('idle');
		expect(usePlayerStore.getState().isPlaying).toBe(false);
	});

	it.each<PlaybackState>(['ready', 'paused'])('play moves %s to playing', from => {
		withState(from);
		usePlayerStore.getState().play();
		expect(usePlayerStore.getState().playbackState).toBe('playing');
		expect(usePlayerStore.getState().isPlaying).toBe(true);
	});

	it.each<PlaybackState>(['idle', 'loading', 'playing'])('play is a no-op from %s', from => {
		withState(from);
		usePlayerStore.getState().play();
		expect(usePlayerStore.getState().playbackState).toBe(from);
	});

	it('pause moves playing to paused', () => {
		usePlayerStore.setState({ playbackState: 'playing', isPlaying: true });
		usePlayerStore.getState().pause();
		expect(usePlayerStore.getState().playbackState).toBe('paused');
		expect(usePlayerStore.getState().isPlaying).toBe(false);
	});

	it.each<PlaybackState>(['idle', 'loading', 'ready', 'paused'])(
		'pause is a no-op from %s',
		from => {
			withState(from);
			usePlayerStore.getState().pause();
			expect(usePlayerStore.getState().playbackState).toBe(from);
		}
	);

	it('resume moves paused to playing', () => {
		withState('paused');
		usePlayerStore.getState().resume();
		expect(usePlayerStore.getState().playbackState).toBe('playing');
		expect(usePlayerStore.getState().isPlaying).toBe(true);
	});

	it.each<PlaybackState>(['idle', 'loading', 'ready', 'playing'])(
		'resume is a no-op from %s',
		from => {
			withState(from);
			usePlayerStore.getState().resume();
			expect(usePlayerStore.getState().playbackState).toBe(from);
		}
	);

	it('setLoading(true) moves idle to loading', () => {
		usePlayerStore.getState().setLoading(true);
		expect(usePlayerStore.getState().loading).toBe(true);
		expect(usePlayerStore.getState().playbackState).toBe('loading');
	});

	it('setLoading only changes the flag outside idle', () => {
		withState('playing');
		usePlayerStore.getState().setLoading(true);
		expect(usePlayerStore.getState().loading).toBe(true);
		expect(usePlayerStore.getState().playbackState).toBe('playing');

		usePlayerStore.getState().setLoading(false);
		expect(usePlayerStore.getState().loading).toBe(false);
		expect(usePlayerStore.getState().playbackState).toBe('playing');
	});
});

describe('playerStore errors and stop', () => {
	it('setError resets to idle and clears the pending track', () => {
		usePlayerStore.getState().playTrack(makeTrack(5));

		usePlayerStore.getState().setError('Stream failed');

		const state = usePlayerStore.getState();
		expect(state.error).toBe('Stream failed');
		expect(state.loading).toBe(false);
		expect(state.playbackState).toBe('idle');
		expect(state.pendingTrackId).toBeNull();
	});

	it('setError(null) keeps playback state and pending track', () => {
		usePlayerStore.getState().playTrack(makeTrack(5));

		usePlayerStore.getState().setError(null);

		const state = usePlayerStore.getState();
		expect(state.error).toBeNull();
		expect(state.loading).toBe(false);
		expect(state.playbackState).toBe('loading');
		expect(state.pendingTrackId).toBe(5);
	});

	it('setTrackUnavailableError clears the track and stream', () => {
		usePlayerStore.getState().playTrack(makeTrack(6));
		usePlayerStore.getState().setStreamUrl('https://stream/6');

		usePlayerStore.getState().setTrackUnavailableError('Track unavailable');

		const state = usePlayerStore.getState();
		expect(state.error).toBe('Track unavailable');
		expect(state.currentTrack).toBeNull();
		expect(state.streamUrl).toBeNull();
		expect(state.pendingTrackId).toBeNull();
		expect(state.playbackState).toBe('idle');
		expect(state.isPlaying).toBe(false);
		expect(state.loading).toBe(false);
	});

	it('clearError removes the error only', () => {
		usePlayerStore.setState({ error: 'boom', playbackState: 'paused' });
		usePlayerStore.getState().clearError();
		expect(usePlayerStore.getState().error).toBeNull();
		expect(usePlayerStore.getState().playbackState).toBe('paused');
	});

	it('stop clears the track, stream and error', () => {
		usePlayerStore.getState().playTrack(makeTrack(8));
		usePlayerStore.getState().setStreamUrl('https://stream/8');
		usePlayerStore.getState().setPlaybackPlaying();
		usePlayerStore.setState({ error: 'old' });

		usePlayerStore.getState().stop();

		const state = usePlayerStore.getState();
		expect(state.currentTrack).toBeNull();
		expect(state.streamUrl).toBeNull();
		expect(state.pendingTrackId).toBeNull();
		expect(state.playbackState).toBe('idle');
		expect(state.isPlaying).toBe(false);
		expect(state.loading).toBe(false);
		expect(state.error).toBeNull();
	});
});

describe('playerStore stream and modal', () => {
	it('setStreamUrl stores and clears the url', () => {
		usePlayerStore.getState().setStreamUrl('https://stream/1');
		expect(usePlayerStore.getState().streamUrl).toBe('https://stream/1');

		usePlayerStore.getState().setStreamUrl(null);
		expect(usePlayerStore.getState().streamUrl).toBeNull();
	});

	it('toggleModal flips isModalOpen', () => {
		usePlayerStore.getState().toggleModal();
		expect(usePlayerStore.getState().isModalOpen).toBe(true);

		usePlayerStore.getState().toggleModal();
		expect(usePlayerStore.getState().isModalOpen).toBe(false);
	});

	it('setModalOpen sets isModalOpen', () => {
		usePlayerStore.getState().setModalOpen(true);
		expect(usePlayerStore.getState().isModalOpen).toBe(true);

		usePlayerStore.getState().setModalOpen(false);
		expect(usePlayerStore.getState().isModalOpen).toBe(false);
	});
});
