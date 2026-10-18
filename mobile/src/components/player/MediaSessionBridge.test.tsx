import React from 'react';
import { act, render } from '@testing-library/react-native';
import { MediaSessionBridge } from '@/components/player/MediaSessionBridge';
import type { NowPlaying } from '@/hooks/useNowPlaying';
import type { MediaControlEvent } from 'expo-media-control';

// No native module under Jest: the library is replaced by spies (#309).
const mockListeners: ((event: MediaControlEvent) => void)[] = [];
const mockRemoveListener = jest.fn();
jest.mock('expo-media-control', () => ({
	Command: {
		PLAY: 'play',
		PAUSE: 'pause',
		STOP: 'stop',
		NEXT_TRACK: 'nextTrack',
		PREVIOUS_TRACK: 'previousTrack',
		SKIP_FORWARD: 'skipForward',
		SKIP_BACKWARD: 'skipBackward',
		SEEK: 'seek',
		SET_RATING: 'setRating',
	},
	PlaybackState: { NONE: 0, STOPPED: 1, PLAYING: 2, PAUSED: 3, BUFFERING: 4, ERROR: 5 },
	enableMediaControls: jest.fn(() => Promise.resolve()),
	disableMediaControls: jest.fn(() => Promise.resolve()),
	updateMetadata: jest.fn(() => Promise.resolve()),
	updatePlaybackState: jest.fn(() => Promise.resolve()),
	addListener: jest.fn((listener: (event: MediaControlEvent) => void) => {
		mockListeners.push(listener);
		return mockRemoveListener;
	}),
}));

const mockSeekTo = jest.fn();
jest.mock('@/contexts/PlayerContext', () => ({
	usePlayer: () => ({ seekTo: mockSeekTo }),
}));

let mockNowPlaying: NowPlaying;
jest.mock('@/hooks/useNowPlaying', () => ({
	useNowPlaying: () => mockNowPlaying,
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const MediaControl = require('expo-media-control') as {
	enableMediaControls: jest.Mock;
	disableMediaControls: jest.Mock;
	updateMetadata: jest.Mock;
	updatePlaybackState: jest.Mock;
	addListener: jest.Mock;
};

const PLAYING = 2;
const PAUSED = 3;
const BUFFERING = 4;

function nowPlaying(overrides: Partial<NowPlaying> = {}): NowPlaying {
	return {
		isRemote: false,
		track: { id: 1, title: 'Song', artist: 'Artist', artworkUrl: 'https://img/1.jpg' },
		isPlaying: true,
		isLoading: false,
		canToggle: true,
		positionMs: 10_000,
		durationMs: 180_000,
		deviceLabel: null,
		toggle: jest.fn(),
		next: jest.fn(),
		previous: jest.fn(),
		hasNext: true,
		hasPrevious: true,
		...overrides,
	};
}

function emit(command: string, data?: unknown) {
	act(() => {
		mockListeners.forEach(listener =>
			listener({ command, data, timestamp: 0 } as MediaControlEvent)
		);
	});
}

beforeEach(() => {
	jest.useFakeTimers();
	jest.clearAllMocks();
	mockListeners.length = 0;
	mockNowPlaying = nowPlaying();
});

afterEach(() => {
	jest.useRealTimers();
});

describe('MediaSessionBridge', () => {
	it('enables the controls and sends the metadata and state of a local track', () => {
		render(<MediaSessionBridge />);

		expect(MediaControl.enableMediaControls).toHaveBeenCalledWith({
			capabilities: ['play', 'pause', 'previousTrack', 'nextTrack', 'seek'],
		});
		expect(MediaControl.updateMetadata).toHaveBeenCalledWith({
			title: 'Song',
			artist: 'Artist',
			artwork: { uri: 'https://img/1.jpg' },
			duration: 180,
		});
		expect(MediaControl.updatePlaybackState).toHaveBeenCalledWith(PLAYING, 10);
	});

	it('sends the metadata without artwork when the track has none', () => {
		mockNowPlaying = nowPlaying({
			track: { id: 1, title: 'Song', artist: 'Artist', artworkUrl: null },
		});
		render(<MediaSessionBridge />);

		expect(MediaControl.updateMetadata).toHaveBeenCalledWith({
			title: 'Song',
			artist: 'Artist',
			duration: 180,
		});
	});

	it('keeps previous in local mode without a previous item (it restarts the track)', () => {
		mockNowPlaying = nowPlaying({ hasPrevious: false });
		render(<MediaSessionBridge />);

		expect(MediaControl.enableMediaControls).toHaveBeenCalledWith({
			capabilities: ['play', 'pause', 'previousTrack', 'nextTrack', 'seek'],
		});
	});

	it('hides next when the queue has no next item', () => {
		mockNowPlaying = nowPlaying({ hasNext: false });
		render(<MediaSessionBridge />);

		expect(MediaControl.enableMediaControls).toHaveBeenCalledWith({
			capabilities: ['play', 'pause', 'previousTrack', 'seek'],
		});
	});

	it('updates the metadata on a track change', () => {
		const view = render(<MediaSessionBridge />);
		mockNowPlaying = nowPlaying({
			track: { id: 2, title: 'Other', artist: 'Someone', artworkUrl: null },
			positionMs: 0,
		});
		view.rerender(<MediaSessionBridge />);

		expect(MediaControl.updateMetadata).toHaveBeenLastCalledWith({
			title: 'Other',
			artist: 'Someone',
			duration: 180,
		});
		expect(MediaControl.updatePlaybackState).toHaveBeenLastCalledWith(PLAYING, 0);
	});

	it('routes play and pause to the in-app toggle only when the state differs', () => {
		render(<MediaSessionBridge />);

		emit('play');
		expect(mockNowPlaying.toggle).not.toHaveBeenCalled();
		emit('pause');
		expect(mockNowPlaying.toggle).toHaveBeenCalledTimes(1);
	});

	it('routes play to the toggle while paused and shows the paused state', () => {
		mockNowPlaying = nowPlaying({ isPlaying: false });
		render(<MediaSessionBridge />);

		expect(MediaControl.updatePlaybackState).toHaveBeenCalledWith(PAUSED, 10);
		emit('play');
		expect(mockNowPlaying.toggle).toHaveBeenCalledTimes(1);
	});

	it('sends the real state again when the app does not follow a pause (still loading)', () => {
		mockNowPlaying = nowPlaying({ isPlaying: false, isLoading: true, canToggle: false });
		render(<MediaSessionBridge />);
		expect(MediaControl.updatePlaybackState).toHaveBeenCalledWith(BUFFERING, 10);
		MediaControl.updatePlaybackState.mockClear();

		emit('pause');
		expect(mockNowPlaying.toggle).not.toHaveBeenCalled();
		expect(MediaControl.updatePlaybackState).not.toHaveBeenCalled();

		act(() => {
			jest.advanceTimersByTime(1000);
		});
		expect(MediaControl.updatePlaybackState).toHaveBeenCalledWith(BUFFERING, 10);
	});

	it('sends the real state again when the toggle is refused while playing', () => {
		render(<MediaSessionBridge />);
		MediaControl.updatePlaybackState.mockClear();

		emit('pause');
		act(() => {
			jest.advanceTimersByTime(1000);
		});
		expect(MediaControl.updatePlaybackState).toHaveBeenCalledWith(PLAYING, 10);
	});

	it('cancels the pending resend on unmount', () => {
		const view = render(<MediaSessionBridge />);
		emit('play');
		view.unmount();
		MediaControl.updatePlaybackState.mockClear();

		act(() => {
			jest.advanceTimersByTime(1000);
		});
		expect(MediaControl.updatePlaybackState).not.toHaveBeenCalled();
	});

	it('routes next and previous to the in-app actions', () => {
		render(<MediaSessionBridge />);

		emit('nextTrack');
		emit('previousTrack');
		expect(mockNowPlaying.next).toHaveBeenCalledTimes(1);
		expect(mockNowPlaying.previous).toHaveBeenCalledTimes(1);
	});

	it('routes a seek to the context seekTo in local mode', () => {
		render(<MediaSessionBridge />);

		emit('seek', { position: 42.5 });
		expect(mockSeekTo).toHaveBeenCalledWith(42.5);
	});

	it('sends the position again only on a jump, not on regular progress', () => {
		const view = render(<MediaSessionBridge />);
		MediaControl.updatePlaybackState.mockClear();

		mockNowPlaying = { ...mockNowPlaying, positionMs: 10_100 };
		view.rerender(<MediaSessionBridge />);
		expect(MediaControl.updatePlaybackState).not.toHaveBeenCalled();

		mockNowPlaying = { ...mockNowPlaying, positionMs: 90_000 };
		view.rerender(<MediaSessionBridge />);
		expect(MediaControl.updatePlaybackState).toHaveBeenCalledWith(PLAYING, 90);
	});

	describe('remote mode', () => {
		beforeEach(() => {
			mockNowPlaying = nowPlaying({
				isRemote: true,
				deviceLabel: 'Tablette',
				track: { id: 7, title: 'Remote', artist: 'Band', artworkUrl: 'https://img/7.jpg' },
				durationMs: null,
			});
		});

		it('shows the remote track without seek and without progress when its duration is unknown', () => {
			render(<MediaSessionBridge />);

			expect(MediaControl.enableMediaControls).toHaveBeenCalledWith({
				capabilities: ['play', 'pause', 'previousTrack', 'nextTrack'],
			});
			expect(MediaControl.updateMetadata).toHaveBeenCalledWith({
				title: 'Remote',
				artist: 'Band',
				artwork: { uri: 'https://img/7.jpg' },
			});
		});

		it('hides previous when the remote queue has no previous item', () => {
			mockNowPlaying = { ...mockNowPlaying, hasPrevious: false };
			render(<MediaSessionBridge />);

			expect(MediaControl.enableMediaControls).toHaveBeenCalledWith({
				capabilities: ['play', 'pause', 'nextTrack'],
			});
		});

		it('sends play / pause and next to the remote device through useNowPlaying, and ignores seek', () => {
			render(<MediaSessionBridge />);

			emit('pause');
			emit('nextTrack');
			emit('seek', { position: 30 });
			expect(mockNowPlaying.toggle).toHaveBeenCalledTimes(1);
			expect(mockNowPlaying.next).toHaveBeenCalledTimes(1);
			expect(mockSeekTo).not.toHaveBeenCalled();
		});
	});

	it('removes the controls when playback stops', () => {
		const view = render(<MediaSessionBridge />);
		expect(MediaControl.disableMediaControls).not.toHaveBeenCalled();

		mockNowPlaying = nowPlaying({ track: null, isPlaying: false, positionMs: 0 });
		view.rerender(<MediaSessionBridge />);
		expect(MediaControl.disableMediaControls).toHaveBeenCalled();
	});

	it('removes the controls and its listener on unmount (logout)', () => {
		const view = render(<MediaSessionBridge />);
		view.unmount();

		expect(mockRemoveListener).toHaveBeenCalled();
		expect(MediaControl.disableMediaControls).toHaveBeenCalled();
	});
});
