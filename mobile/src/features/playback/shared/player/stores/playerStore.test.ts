import {
	readPositionMs,
	setPositionReader,
} from '@/features/playback/shared/player/lib/positionReader';
import { playerStore } from '@/features/playback/shared/player/stores/playerStore';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';
import type { PlaybackState } from '@/shared/playback/types/playbackTypes';

const initialState = playerStore.getState();

function makeTrack(id: number): SoundCloudTrack {
	return {
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
	};
}

function withState(playbackState: PlaybackState) {
	return playerStore.setState({ playbackState });
}

beforeEach(() => {
	playerStore.setState(initialState, true);
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('playerStore playTrack', () => {
	it('sets the current track and enters the loading state', () => {
		const track = makeTrack(42);
		playerStore.setState({
			streamUrl: 'https://stream/old',
			error: 'old error',
			isModalOpen: true,
			isPlaying: true,
		});

		playerStore.getState().playTrack(track);

		const state = playerStore.getState();
		expect(state.currentTrack).toStrictEqual(track);
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

		playerStore.getState().playTrack(track);
		playerStore.getState().playTrack(track);

		expect(playerStore.getState().loadCounter).toBe(2);
		expect(playerStore.getState().currentTrack).toStrictEqual(track);
	});

	it('replaces the current track with the new one', () => {
		playerStore.getState().playTrack(makeTrack(1));
		playerStore.getState().playTrack(makeTrack(2));

		expect(playerStore.getState().currentTrack?.id).toBe(2);
		expect(playerStore.getState().pendingTrackId).toBe(2);
	});

	it('keeps the modal open for a queue item and closes it for a list tap', () => {
		playerStore.setState({ isModalOpen: true });

		playerStore.getState().playTrack(makeTrack(1), 'item-1');
		expect(playerStore.getState().isModalOpen).toBe(true);
		expect(playerStore.getState().queueItemId).toBe('item-1');

		playerStore.getState().playTrack(makeTrack(2));
		expect(playerStore.getState().isModalOpen).toBe(false);
		expect(playerStore.getState().queueItemId).toBeNull();
	});
	it('keeps a start position for a transferred playback, and none otherwise (#297)', () => {
		playerStore.getState().playTrack(makeTrack(1), 'item-1', 42_000);
		expect(playerStore.getState().startPositionMs).toBe(42_000);

		playerStore.getState().playTrack(makeTrack(2));
		expect(playerStore.getState().startPositionMs).toBeNull();

		playerStore.getState().playTrack(makeTrack(3), null, Number.NaN);
		expect(playerStore.getState().startPositionMs).toBeNull();
	});
});

describe('playerStore state machine', () => {
	it('setPlaybackReady moves loading to ready and clears pending track', () => {
		playerStore.getState().playTrack(makeTrack(3));

		playerStore.getState().setPlaybackReady();

		const state = playerStore.getState();
		expect(state.playbackState).toBe('ready');
		expect(state.loading).toBe(false);
		expect(state.pendingTrackId).toBeNull();
	});

	it.each<PlaybackState>(['idle', 'ready', 'playing', 'paused'])(
		'setPlaybackReady is a no-op from %s',
		from => {
			withState(from);
			playerStore.getState().setPlaybackReady();
			expect(playerStore.getState().playbackState).toBe(from);
		}
	);

	it.each<PlaybackState>(['loading', 'ready', 'paused'])(
		'setPlaybackPlaying moves %s to playing',
		from => {
			playerStore.setState({ playbackState: from, loading: true, pendingTrackId: 9 });

			playerStore.getState().setPlaybackPlaying();

			const state = playerStore.getState();
			expect(state.playbackState).toBe('playing');
			expect(state.isPlaying).toBe(true);
			expect(state.loading).toBe(false);
			expect(state.pendingTrackId).toBeNull();
		}
	);

	it('setPlaybackPlaying is a no-op from idle', () => {
		playerStore.getState().setPlaybackPlaying();
		expect(playerStore.getState().playbackState).toBe('idle');
		expect(playerStore.getState().isPlaying).toBe(false);
	});

	it.each<PlaybackState>(['ready', 'paused'])('play moves %s to playing', from => {
		withState(from);
		playerStore.getState().play();
		expect(playerStore.getState().playbackState).toBe('playing');
		expect(playerStore.getState().isPlaying).toBe(true);
	});

	it.each<PlaybackState>(['idle', 'loading', 'playing'])('play is a no-op from %s', from => {
		withState(from);
		playerStore.getState().play();
		expect(playerStore.getState().playbackState).toBe(from);
	});

	it('pause moves playing to paused', () => {
		playerStore.setState({ playbackState: 'playing', isPlaying: true });
		playerStore.getState().pause();
		expect(playerStore.getState().playbackState).toBe('paused');
		expect(playerStore.getState().isPlaying).toBe(false);
	});

	it.each<PlaybackState>(['idle', 'loading', 'ready', 'paused'])(
		'pause is a no-op from %s',
		from => {
			withState(from);
			playerStore.getState().pause();
			expect(playerStore.getState().playbackState).toBe(from);
		}
	);

	it('resume moves paused to playing', () => {
		withState('paused');
		playerStore.getState().resume();
		expect(playerStore.getState().playbackState).toBe('playing');
		expect(playerStore.getState().isPlaying).toBe(true);
	});

	it.each<PlaybackState>(['idle', 'loading', 'ready', 'playing'])(
		'resume is a no-op from %s',
		from => {
			withState(from);
			playerStore.getState().resume();
			expect(playerStore.getState().playbackState).toBe(from);
		}
	);
});

describe('playerStore errors and stop', () => {
	it('setTrackUnavailableError clears the track and stream', () => {
		playerStore.getState().playTrack(makeTrack(6));
		playerStore.getState().setStreamUrl('https://stream/6');

		playerStore.getState().setTrackUnavailableError('Track unavailable');

		const state = playerStore.getState();
		expect(state.error).toBe('Track unavailable');
		expect(state.currentTrack).toBeNull();
		expect(state.streamUrl).toBeNull();
		expect(state.pendingTrackId).toBeNull();
		expect(state.playbackState).toBe('idle');
		expect(state.isPlaying).toBe(false);
		expect(state.loading).toBe(false);
	});

	it('clearError removes the error only', () => {
		playerStore.setState({ error: 'boom', playbackState: 'paused' });
		playerStore.getState().clearError();
		expect(playerStore.getState().error).toBeNull();
		expect(playerStore.getState().playbackState).toBe('paused');
	});

	it('stop clears the track, stream and error', () => {
		playerStore.getState().playTrack(makeTrack(8));
		playerStore.getState().setStreamUrl('https://stream/8');
		playerStore.getState().setPlaybackPlaying();
		playerStore.setState({ error: 'old' });

		playerStore.getState().stop();

		const state = playerStore.getState();
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
		playerStore.getState().setStreamUrl('https://stream/1');
		expect(playerStore.getState().streamUrl).toBe('https://stream/1');

		playerStore.getState().setStreamUrl(null);
		expect(playerStore.getState().streamUrl).toBeNull();
	});

	it('toggleModal flips isModalOpen', () => {
		playerStore.getState().toggleModal();
		expect(playerStore.getState().isModalOpen).toBe(true);

		playerStore.getState().toggleModal();
		expect(playerStore.getState().isModalOpen).toBe(false);
	});

	it('setModalOpen sets isModalOpen', () => {
		playerStore.getState().setModalOpen(true);
		expect(playerStore.getState().isModalOpen).toBe(true);

		playerStore.getState().setModalOpen(false);
		expect(playerStore.getState().isModalOpen).toBe(false);
	});
});

describe('playerStore stream renewal (#313)', () => {
	it('setStreamUrl stores the expiry with the url, and clears it with the url', () => {
		playerStore.getState().setStreamUrl('https://stream/1', 1234);
		expect(playerStore.getState().streamExpiresAt).toBe(1234);

		playerStore.getState().setStreamUrl(null, 1234);
		expect(playerStore.getState().streamExpiresAt).toBeNull();
	});

	it('renewStream reloads the same track at the position, keeping queue item and modal', () => {
		const track = makeTrack(9);
		playerStore.getState().playTrack(track, 'q9');
		playerStore.getState().setStreamUrl('https://stream/9', 1000);
		playerStore.getState().setPlaybackPlaying();
		playerStore.setState({ isModalOpen: true });

		playerStore.getState().renewStream(90000, true, true);

		const state = playerStore.getState();
		expect(state.currentTrack).toStrictEqual(track);
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
		playerStore.getState().playTrack(makeTrack(13));
		playerStore.getState().renewStream(5000, true);
		expect(playerStore.getState().streamRenewed).toBe(false);

		playerStore.getState().renewStream(6000, true, true);
		playerStore.getState().renewStream(7000, true);
		expect(playerStore.getState().streamRenewed).toBe(true);
	});

	it('a stream renewed while paused comes back paused, and play resumes it', () => {
		playerStore.getState().playTrack(makeTrack(10));
		playerStore.getState().setPlaybackPlaying();
		playerStore.getState().pause();

		playerStore.getState().renewStream(0, false);
		expect(playerStore.getState().startPositionMs).toBeNull();
		expect(playerStore.getState().isPlaying).toBe(false);

		playerStore.getState().setPlaybackReady();
		expect(playerStore.getState().playbackState).toBe('paused');

		playerStore.getState().resume();
		expect(playerStore.getState().playbackState).toBe('playing');
	});

	it('playTrack resets the renewal flags', () => {
		playerStore.getState().playTrack(makeTrack(11));
		playerStore.getState().renewStream(5000, false, true);

		playerStore.getState().playTrack(makeTrack(12));

		const state = playerStore.getState();
		expect(state.streamRenewed).toBe(false);
		expect(state.resumeAfterLoad).toBe(true);
	});

	it('renewStream does nothing without a track', () => {
		playerStore.getState().renewStream(5000, true);
		expect(playerStore.getState().loadCounter).toBe(0);
		expect(playerStore.getState().playbackState).toBe('idle');
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
		const before = playerStore.getState().seekCount;
		playerStore.getState().markSeek();
		expect(playerStore.getState().seekCount).toBe(before + 1);
	});
});

describe('pause by the system (#310)', () => {
	it('pauseBySystem pauses a playing track and marks it', () => {
		withState('playing');

		playerStore.getState().pauseBySystem();

		const state = playerStore.getState();
		expect(state.playbackState).toBe('paused');
		expect(state.isPlaying).toBe(false);
		expect(state.pausedBySystem).toBe(true);
	});

	it.each<PlaybackState>(['idle', 'loading', 'ready', 'paused'])(
		'pauseBySystem is a no-op from %s',
		from => {
			withState(from);
			playerStore.getState().pauseBySystem();
			expect(playerStore.getState().playbackState).toBe(from);
			expect(playerStore.getState().pausedBySystem).toBe(false);
		}
	);

	it('a user pause during the interruption clears the mark and stays paused', () => {
		withState('playing');
		playerStore.getState().pauseBySystem();

		playerStore.getState().pause();

		expect(playerStore.getState().playbackState).toBe('paused');
		expect(playerStore.getState().pausedBySystem).toBe(false);
	});

	it('resume clears the mark', () => {
		withState('playing');
		playerStore.getState().pauseBySystem();

		playerStore.getState().resume();

		expect(playerStore.getState().playbackState).toBe('playing');
		expect(playerStore.getState().pausedBySystem).toBe(false);
	});

	it('renewStream clears the mark', () => {
		playerStore.getState().playTrack(makeTrack(4));
		withState('playing');
		playerStore.getState().pauseBySystem();

		playerStore.getState().renewStream(1000, false);

		expect(playerStore.getState().pausedBySystem).toBe(false);
	});

	it('setTrackUnavailableError clears the mark', () => {
		withState('playing');
		playerStore.getState().pauseBySystem();

		playerStore.getState().setTrackUnavailableError('gone');

		expect(playerStore.getState().pausedBySystem).toBe(false);
	});

	it('playTrack clears the mark', () => {
		withState('playing');
		playerStore.getState().pauseBySystem();

		playerStore.getState().playTrack(makeTrack(4));

		expect(playerStore.getState().pausedBySystem).toBe(false);
	});
});

describe('restored track (#312)', () => {
	function restore(positionMs = 42_000) {
		return playerStore.getState().restoreTrack(makeTrack(9), 'q9', positionMs);
	}

	it('shows the track paused, with no stream and no load', () => {
		restore();

		const state = playerStore.getState();
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
			playerStore.setState({ isModalOpen: true });

			playerStore.getState()[action]();

			const state = playerStore.getState();
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
		playerStore.getState().setRestoredPosition(10_000);
		expect(playerStore.getState().startPositionMs).toBe(10_000);

		playerStore.getState().setRestoredPosition(0);
		expect(playerStore.getState().startPositionMs).toBeNull();
	});

	it('ignores setRestoredPosition once the stream is loaded', () => {
		playerStore.getState().playTrack(makeTrack(4), null, 5000);
		playerStore.getState().setRestoredPosition(10_000);
		expect(playerStore.getState().startPositionMs).toBe(5000);
	});

	it.each([
		['playTrack', () => playerStore.getState().playTrack(makeTrack(4))],
		['stop', () => playerStore.getState().stop()],
		['setTrackUnavailableError', () => playerStore.getState().setTrackUnavailableError('x')],
	])('%s clears the flag', (_name, run) => {
		restore();
		run();
		expect(playerStore.getState().needsStreamLoad).toBe(false);
	});
});
