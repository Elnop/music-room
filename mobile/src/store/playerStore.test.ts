import {
	usePlayerStore,
	readPositionMs,
	setPositionReader,
	type PlaybackState,
} from '@/store/playerStore';
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

	it('keeps the modal open for a queue item and closes it for a list tap', () => {
		usePlayerStore.setState({ isModalOpen: true });

		usePlayerStore.getState().playTrack(makeTrack(1), 'item-1');
		expect(usePlayerStore.getState().isModalOpen).toBe(true);
		expect(usePlayerStore.getState().queueItemId).toBe('item-1');

		usePlayerStore.getState().playTrack(makeTrack(2));
		expect(usePlayerStore.getState().isModalOpen).toBe(false);
		expect(usePlayerStore.getState().queueItemId).toBeNull();
	});
	it('keeps a start position for a transferred playback, and none otherwise (#297)', () => {
		usePlayerStore.getState().playTrack(makeTrack(1), 'item-1', 42_000);
		expect(usePlayerStore.getState().startPositionMs).toBe(42_000);

		usePlayerStore.getState().playTrack(makeTrack(2));
		expect(usePlayerStore.getState().startPositionMs).toBeNull();

		usePlayerStore.getState().playTrack(makeTrack(3), null, Number.NaN);
		expect(usePlayerStore.getState().startPositionMs).toBeNull();
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

describe('playerStore stream renewal (#313)', () => {
	it('setStreamUrl stores the expiry with the url, and clears it with the url', () => {
		usePlayerStore.getState().setStreamUrl('https://stream/1', 1234);
		expect(usePlayerStore.getState().streamExpiresAt).toBe(1234);

		usePlayerStore.getState().setStreamUrl(null, 1234);
		expect(usePlayerStore.getState().streamExpiresAt).toBeNull();
	});

	it('renewStream reloads the same track at the position, keeping queue item and modal', () => {
		const track = makeTrack(9);
		usePlayerStore.getState().playTrack(track, 'q9');
		usePlayerStore.getState().setStreamUrl('https://stream/9', 1000);
		usePlayerStore.getState().setPlaybackPlaying();
		usePlayerStore.setState({ isModalOpen: true });

		usePlayerStore.getState().renewStream(90000, true, true);

		const state = usePlayerStore.getState();
		expect(state.currentTrack).toEqual(track);
		expect(state.queueItemId).toBe('q9');
		expect(state.isModalOpen).toBe(true);
		expect(state.startPositionMs).toBe(90000);
		expect(state.loadCounter).toBe(2);
		expect(state.playbackState).toBe('loading');
		expect(state.streamUrl).toBeNull();
		expect(state.streamExpiresAt).toBeNull();
		expect(state.streamRenewed).toBe(true);
		expect(state.resumeAfterLoad).toBe(true);
		expect(state.isPlaying).toBe(true);
	});

	it('a renewal of an expiring URL keeps the retry for a later failure', () => {
		usePlayerStore.getState().playTrack(makeTrack(13));
		usePlayerStore.getState().renewStream(5000, true);
		expect(usePlayerStore.getState().streamRenewed).toBe(false);

		usePlayerStore.getState().renewStream(6000, true, true);
		usePlayerStore.getState().renewStream(7000, true);
		expect(usePlayerStore.getState().streamRenewed).toBe(true);
	});

	it('a stream renewed while paused comes back paused, and play resumes it', () => {
		usePlayerStore.getState().playTrack(makeTrack(10));
		usePlayerStore.getState().setPlaybackPlaying();
		usePlayerStore.getState().pause();

		usePlayerStore.getState().renewStream(0, false);
		expect(usePlayerStore.getState().startPositionMs).toBeNull();
		expect(usePlayerStore.getState().isPlaying).toBe(false);

		usePlayerStore.getState().setPlaybackReady();
		expect(usePlayerStore.getState().playbackState).toBe('paused');

		usePlayerStore.getState().resume();
		expect(usePlayerStore.getState().playbackState).toBe('playing');
	});

	it('playTrack resets the renewal flags', () => {
		usePlayerStore.getState().playTrack(makeTrack(11));
		usePlayerStore.getState().renewStream(5000, false, true);

		usePlayerStore.getState().playTrack(makeTrack(12));

		const state = usePlayerStore.getState();
		expect(state.streamRenewed).toBe(false);
		expect(state.resumeAfterLoad).toBe(true);
	});

	it('renewStream does nothing without a track', () => {
		usePlayerStore.getState().renewStream(5000, true);
		expect(usePlayerStore.getState().loadCounter).toBe(0);
		expect(usePlayerStore.getState().playbackState).toBe('idle');
	});
});

describe('playback position (#295)', () => {
	afterEach(() => setPositionReader(null));

	it('reads null without a reader and the reader value otherwise', () => {
		expect(readPositionMs()).toBeNull();
		setPositionReader(() => 4200);
		expect(readPositionMs()).toBe(4200);
		setPositionReader(null);
		expect(readPositionMs()).toBeNull();
	});

	it('markSeek increments seekCount', () => {
		const before = usePlayerStore.getState().seekCount;
		usePlayerStore.getState().markSeek();
		expect(usePlayerStore.getState().seekCount).toBe(before + 1);
	});
});

describe('pause by the system (#310)', () => {
	it('pauseBySystem pauses a playing track and marks it', () => {
		withState('playing');

		usePlayerStore.getState().pauseBySystem();

		const state = usePlayerStore.getState();
		expect(state.playbackState).toBe('paused');
		expect(state.isPlaying).toBe(false);
		expect(state.pausedBySystem).toBe(true);
	});

	it.each<PlaybackState>(['idle', 'loading', 'ready', 'paused'])(
		'pauseBySystem is a no-op from %s',
		from => {
			withState(from);
			usePlayerStore.getState().pauseBySystem();
			expect(usePlayerStore.getState().playbackState).toBe(from);
			expect(usePlayerStore.getState().pausedBySystem).toBe(false);
		}
	);

	it('a user pause during the interruption clears the mark and stays paused', () => {
		withState('playing');
		usePlayerStore.getState().pauseBySystem();

		usePlayerStore.getState().pause();

		expect(usePlayerStore.getState().playbackState).toBe('paused');
		expect(usePlayerStore.getState().pausedBySystem).toBe(false);
	});

	it('resume clears the mark', () => {
		withState('playing');
		usePlayerStore.getState().pauseBySystem();

		usePlayerStore.getState().resume();

		expect(usePlayerStore.getState().playbackState).toBe('playing');
		expect(usePlayerStore.getState().pausedBySystem).toBe(false);
	});

	it('renewStream clears the mark', () => {
		usePlayerStore.getState().playTrack(makeTrack(4));
		withState('playing');
		usePlayerStore.getState().pauseBySystem();

		usePlayerStore.getState().renewStream(1000, false);

		expect(usePlayerStore.getState().pausedBySystem).toBe(false);
	});

	it('setTrackUnavailableError clears the mark', () => {
		withState('playing');
		usePlayerStore.getState().pauseBySystem();

		usePlayerStore.getState().setTrackUnavailableError('gone');

		expect(usePlayerStore.getState().pausedBySystem).toBe(false);
	});

	it('playTrack clears the mark', () => {
		withState('playing');
		usePlayerStore.getState().pauseBySystem();

		usePlayerStore.getState().playTrack(makeTrack(4));

		expect(usePlayerStore.getState().pausedBySystem).toBe(false);
	});
});

describe('restored track (#312)', () => {
	const restore = (positionMs = 42_000) =>
		usePlayerStore.getState().restoreTrack(makeTrack(9), 'q9', positionMs);

	it('shows the track paused, with no stream and no load', () => {
		restore();

		const state = usePlayerStore.getState();
		expect(state.currentTrack?.id).toBe(9);
		expect(state.queueItemId).toBe('q9');
		expect(state.startPositionMs).toBe(42_000);
		expect(state.playbackState).toBe('paused');
		expect(state.isPlaying).toBe(false);
		expect(state.streamUrl).toBeNull();
		expect(state.needsStreamLoad).toBe(true);
		expect(state.loadCounter).toBe(0);
	});

	it.each(['play', 'resume'] as const)(
		'%s loads the stream at the saved position, keeping the modal',
		action => {
			restore();
			usePlayerStore.setState({ isModalOpen: true });

			usePlayerStore.getState()[action]();

			const state = usePlayerStore.getState();
			expect(state.playbackState).toBe('loading');
			expect(state.loadCounter).toBe(1);
			expect(state.startPositionMs).toBe(42_000);
			expect(state.queueItemId).toBe('q9');
			expect(state.needsStreamLoad).toBe(false);
			expect(state.isModalOpen).toBe(true);
		}
	);

	it('moves the start position on a seek before play', () => {
		restore();
		usePlayerStore.getState().setRestoredPosition(10_000);
		expect(usePlayerStore.getState().startPositionMs).toBe(10_000);

		usePlayerStore.getState().setRestoredPosition(0);
		expect(usePlayerStore.getState().startPositionMs).toBeNull();
	});

	it('ignores setRestoredPosition once the stream is loaded', () => {
		usePlayerStore.getState().playTrack(makeTrack(4), null, 5000);
		usePlayerStore.getState().setRestoredPosition(10_000);
		expect(usePlayerStore.getState().startPositionMs).toBe(5000);
	});

	it.each([
		['playTrack', () => usePlayerStore.getState().playTrack(makeTrack(4))],
		['stop', () => usePlayerStore.getState().stop()],
		['setTrackUnavailableError', () => usePlayerStore.getState().setTrackUnavailableError('x')],
	])('%s clears the flag', (_name, run) => {
		restore();
		run();
		expect(usePlayerStore.getState().needsStreamLoad).toBe(false);
	});
});
