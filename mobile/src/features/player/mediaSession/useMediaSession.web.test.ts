import { act, renderHook } from '@testing-library/react-native';
import type { NowPlaying } from '@/features/player/types';
import { useMediaSession } from './useMediaSession.web';

jest.mock('expo-media-control', () => {
	throw new Error('the web variant must not load expo-media-control');
});

let mockNowPlaying: NowPlaying;
const mockSeekTo = jest.fn();

jest.mock('@/features/player/hooks/useNowPlaying', () => ({ useNowPlaying: () => mockNowPlaying }));
jest.mock('@/features/player/context/PlayerContext', () => ({
	usePlayer: () => ({ seekTo: mockSeekTo }),
}));

type Handler = ((details: { seekTime?: number }) => void) | null;

const session = {
	metadata: null as unknown,
	playbackState: 'none',
	handlers: new Map<string, Handler>(),
	setActionHandler: jest.fn((action: string, handler: Handler) => {
		if (action === 'seekto' && unsupportedSeek) throw new Error('unsupported');
		session.handlers.set(action, handler);
	}),
	setPositionState: jest.fn(),
};
let unsupportedSeek = false;

class FakeMetadata {
	constructor(readonly init: object) {}
}

const globals = globalThis as unknown as { navigator: object; MediaMetadata?: unknown };
const originalNavigator = globals.navigator;

beforeAll(() => {
	globals.navigator = { ...originalNavigator, mediaSession: session };
	globals.MediaMetadata = FakeMetadata;
});

afterAll(() => {
	globals.navigator = originalNavigator;
	delete globals.MediaMetadata;
});

function nowPlaying(overrides: Partial<NowPlaying> = {}): NowPlaying {
	return {
		isRemote: false,
		track: {
			id: 1,
			title: 'Song',
			artist: 'Artist',
			artworkUrl: 'https://i1.sndcdn.com/artworks-abc-large.jpg',
		},
		isPlaying: true,
		isLoading: false,
		canToggle: true,
		positionMs: 61_500,
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

beforeEach(() => {
	jest.clearAllMocks();
	session.handlers.clear();
	session.metadata = null;
	session.playbackState = 'none';
	unsupportedSeek = false;
	mockNowPlaying = nowPlaying();
});

describe('useMediaSession (web)', () => {
	it('shows the track, its artwork, its state, and its position to the browser', () => {
		renderHook(() => useMediaSession());

		expect(session.metadata).toEqual(
			new FakeMetadata({
				title: 'Song',
				artist: 'Artist',
				artwork: [{ src: 'https://i1.sndcdn.com/artworks-abc-t500x500.jpg' }],
			})
		);
		expect(session.playbackState).toBe('playing');
		expect(session.setPositionState).toHaveBeenCalledWith({
			duration: 180,
			position: 61,
			playbackRate: 1,
		});
	});

	it('drives the player from the media keys', () => {
		renderHook(() => useMediaSession());

		act(() => session.handlers.get('pause')?.({}));
		act(() => session.handlers.get('play')?.({}));
		act(() => session.handlers.get('nexttrack')?.({}));
		act(() => session.handlers.get('previoustrack')?.({}));
		act(() => session.handlers.get('seekto')?.({ seekTime: 30 }));

		expect(mockNowPlaying.toggle).toHaveBeenCalledTimes(1);
		expect(mockNowPlaying.next).toHaveBeenCalled();
		expect(mockNowPlaying.previous).toHaveBeenCalled();
		expect(mockSeekTo).toHaveBeenCalledWith(30);
	});

	it('offers no seek on a remote device, nor next at the end of the queue', () => {
		mockNowPlaying = nowPlaying({ isRemote: true, hasNext: false, isPlaying: false });
		renderHook(() => useMediaSession());

		expect(session.handlers.get('seekto')).toBeNull();
		expect(session.handlers.get('nexttrack')).toBeNull();
		expect(session.playbackState).toBe('paused');
	});

	it('clears the session without a track, and survives an unsupported action', () => {
		unsupportedSeek = true;
		const { rerender, unmount } = renderHook(() => useMediaSession());
		expect(session.handlers.get('play')).toEqual(expect.any(Function));

		mockNowPlaying = nowPlaying({ track: null, durationMs: null });
		rerender({});
		expect(session.metadata).toBeNull();
		expect(session.playbackState).toBe('none');
		expect(session.handlers.get('play')).toBeNull();

		unmount();
		expect(session.playbackState).toBe('none');
	});
});
