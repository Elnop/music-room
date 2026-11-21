import React, { useEffect } from 'react';
import { act, render } from '@testing-library/react-native';
import { PlayerProvider } from '@/features/playback/components/PlayerProvider';
import { usePlayer } from '@/features/playback/shared/player/lib/PlayerContext';
import {
	readPositionMs,
	usePlayerStore,
} from '@/features/playback/shared/player/stores/playerStore';
import { useConnectStore } from '@/features/playback/shared/player/stores/connectStore';
import { useQueueStore } from '@/features/playback/shared/player/stores/queueStore';
import { registerAuthSession } from '@/shared/backend/lib/authSession';
import type { SessionView } from '@/shared/backend/lib/authSession';
import { createStore } from 'zustand';
import { streamPrefetch } from '@/features/playback/shared/player/lib/streamPrefetch';
import { apiRequest } from '@/shared/backend/lib/api';
import { trackToSoundCloud } from '@/features/playback/shared/player/lib/trackToSoundCloud';
import type { SoundCloudTrack, StreamUrlResponse } from '@/shared/tracks/lib/soundcloud.types';
import type { QueueItem } from '@/shared/playback/lib/queue.types';
import type { UserProfile } from '@/shared/users/user.types';
import { noop } from '@test-utils/noop';

type MockPlayer = {
	id: number;
	url: string;
	isLoaded: boolean;
	duration: number;
	playing: boolean;
	currentTime: number;
	play: jest.Mock;
	pause: jest.Mock;
	seekTo: jest.Mock;
};

type MockStatus = {
	id: number;
	playbackState: string;
	isLoaded: boolean;
	currentTime: number;
	didJustFinish: boolean;
	duration?: number;
	playing?: boolean;
	isBuffering?: boolean;
};

const mockPlayers = new Map<string, MockPlayer>();
const mockStatuses = new Map<number, MockStatus>();
let mockNextId = 1;

function mockPlayerFor(url: string): MockPlayer {
	let player = mockPlayers.get(url);
	if (!player) {
		const created: MockPlayer = {
			id: mockNextId++,
			url,
			isLoaded: url !== '',
			duration: url !== '' ? 200 : 0,
			playing: false,
			currentTime: 0,
			play: jest.fn(() => {
				created.playing = true;
			}),
			pause: jest.fn(() => {
				created.playing = false;
			}),
			seekTo: jest.fn((seconds: number) => {
				created.currentTime = seconds;
				return Promise.resolve();
			}),
		};
		mockPlayers.set(url, created);
		player = created;
	}
	return player;
}

jest.mock('@/features/playback/features/media-session/MediaSessionBridgeContainer', () => ({
	MediaSessionBridgeContainer: () => null,
}));

jest.mock('expo-audio', () => ({
	useAudioPlayer: (url: string) => mockPlayerFor(url),
	useAudioPlayerStatus: (player: { id: number }) =>
		mockStatuses.get(player.id) ?? {
			id: player.id,
			playbackState: 'idle',
			isLoaded: false,
			currentTime: 0,
			didJustFinish: false,
		},
	setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/shared/backend/lib/api', () => {
	class ApiError extends Error {
		code: string;
		details?: unknown;
		status?: number;
		constructor(message: string, code: string, details?: unknown, status?: number) {
			super(message);
			this.name = 'ApiError';
			this.code = code;
			this.details = details;
			this.status = status;
		}
	}
	return { ApiError, apiRequest: jest.fn() };
});

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/shared/backend/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

const mockApiRequest = apiRequest as jest.Mock;
const { ApiError: MockApiError } = jest.requireMock('@/shared/backend/lib/api') as {
	ApiError: new (message: string, code: string, details?: unknown, status?: number) => Error;
};

const track: SoundCloudTrack = {
	id: 7,
	title: 'Long song',
	description: null,
	duration: 200000,
	genre: null,
	artwork_url: null,
	permalink_url: 'https://soundcloud.com/artist/long-song',
	user: { id: 1, username: 'artist', avatar_url: null, permalink_url: '' },
	playable: true,
};

const MINUTE_MS = 60 * 1000;
function inMinutes(minutes: number) {
	return new Date(Date.now() + minutes * MINUTE_MS).toISOString();
}

let seekRef: ((seconds: number) => void) | null = null;
function setSeekRef(seekTo: (seconds: number) => void) {
	seekRef = seekTo;
}
function SeekProbe() {
	const { seekTo } = usePlayer();
	useEffect(() => setSeekRef(seekTo), [seekTo]);
	return null;
}

const testSessionStore = createStore<SessionView>(() => ({
	user: { id: 'me' } as UserProfile,
	accessToken: 'test-token',
	isAuthenticated: true,
}));

registerAuthSession({
	store: testSessionStore,
	isTokenExpiringSoon: () => false,
	refreshAccessToken: async () => true,
});

let mockNext = jest.fn(async () => 'played' as const);

const initialPlayerState = usePlayerStore.getState();
const initialAuthState = testSessionStore.getState();
const initialConnectState = useConnectStore.getState();
const initialQueueState = useQueueStore.getState();

function answerStreams(
	...urls: { streamUrl: string; expiresAt: string; protocol?: StreamUrlResponse['protocol'] }[]
) {
	for (const data of urls) mockApiRequest.mockResolvedValueOnce(data);
}

async function flush() {
	await act(async () => {
		await Promise.resolve();
		await Promise.resolve();
	});
}

function setStatus(player: MockPlayer, status: Partial<MockStatus>) {
	mockStatuses.set(player.id, {
		id: player.id,
		playbackState: 'ready',
		isLoaded: true,
		currentTime: player.currentTime,
		didJustFinish: false,
		...mockStatuses.get(player.id),
		...status,
	});
}

async function rerender(view: ReturnType<typeof render>) {
	await act(async () =>
		view.rerender(
			<PlayerProvider>
				<SeekProbe />
			</PlayerProvider>
		)
	);
}

async function startPlaying(expiresAt: string) {
	answerStreams({ streamUrl: 'u1', expiresAt });
	const view = render(
		<PlayerProvider>
			<SeekProbe />
		</PlayerProvider>
	);
	await act(async () => usePlayerStore.getState().playTrack(track, 'q1'));
	await flush();
	return view;
}

beforeEach(() => {
	mockPlayers.clear();
	mockStatuses.clear();
	mockApiRequest.mockReset();
	seekRef = null;
	usePlayerStore.setState(initialPlayerState, true);
	useQueueStore.setState(initialQueueState, true);
	useQueueStore.setState({ next: () => mockNext() });
	testSessionStore.setState(initialAuthState, true);
	streamPrefetch.clear();
	useConnectStore.setState(initialConnectState, true);
	mockNext = jest.fn(async () => 'played' as const);
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('PlayerProvider stream renewal (#313)', () => {
	it('plays a fresh URL and stores its expiry', async () => {
		const expiresAt = inMinutes(30);
		await startPlaying(expiresAt);

		const state = usePlayerStore.getState();
		expect(state.playbackState).toBe('playing');
		expect(state.streamUrl).toBe('u1');
		expect(state.streamExpiresAt).toBe(Date.parse(expiresAt));
		expect(mockPlayerFor('u1').play).toHaveBeenCalled();
	});

	it('keeps the protocol of the stream, and of the URL that renews it', async () => {
		answerStreams({ streamUrl: 'u1', expiresAt: inMinutes(1), protocol: 'progressive' });
		render(
			<PlayerProvider>
				<SeekProbe />
			</PlayerProvider>
		);
		await act(async () => usePlayerStore.getState().playTrack(track, 'q1'));
		await flush();
		expect(usePlayerStore.getState().streamProtocol).toBe('progressive');
		act(() => usePlayerStore.getState().pause());
		answerStreams({ streamUrl: 'u2', expiresAt: inMinutes(30) });

		await act(async () => usePlayerStore.getState().resume());
		await flush();

		expect(usePlayerStore.getState().streamUrl).toBe('u2');
		expect(usePlayerStore.getState().streamProtocol).toBe('hls');
	});

	it('acts on the player directly when seeking a fresh URL', async () => {
		await startPlaying(inMinutes(30));

		act(() => seekRef?.(90));

		expect(mockPlayerFor('u1').seekTo).toHaveBeenCalledWith(90);
		expect(mockApiRequest).toHaveBeenCalledTimes(1);
		expect(usePlayerStore.getState().seekCount).toBe(1);
	});

	it('resumes a track paused past its expiry at the paused position, with no error', async () => {
		await startPlaying(inMinutes(1));
		const u1 = mockPlayerFor('u1');
		act(() => usePlayerStore.getState().pause());
		u1.currentTime = 42;
		answerStreams({ streamUrl: 'u2', expiresAt: inMinutes(30) });

		await act(async () => usePlayerStore.getState().resume());
		await flush();

		const u2 = mockPlayerFor('u2');
		expect(mockApiRequest).toHaveBeenCalledTimes(2);
		expect(u2.seekTo).toHaveBeenCalledWith(42);
		expect(u2.play).toHaveBeenCalled();
		const state = usePlayerStore.getState();
		expect(state.playbackState).toBe('playing');
		expect(state.currentTrack).toStrictEqual(track);
		expect(state.queueItemId).toBe('q1');
		expect(state.error).toBeNull();
	});

	it.each([
		['playing', true],
		['paused', false],
	])(
		'reloads at the seek position on a stale URL, keeping the %s state',
		async (expected, playing) => {
			await startPlaying(inMinutes(1));
			if (!playing) act(() => usePlayerStore.getState().pause());
			answerStreams({ streamUrl: 'u2', expiresAt: inMinutes(30) });

			await act(async () => seekRef?.(90));
			await flush();

			const u2 = mockPlayerFor('u2');
			expect(mockPlayerFor('u1').seekTo).not.toHaveBeenCalled();
			expect(u2.seekTo).toHaveBeenCalledWith(90);
			expect(u2.play).toHaveBeenCalledTimes(playing ? 1 : 0);
			expect(usePlayerStore.getState().playbackState).toBe(expected);
			expect(usePlayerStore.getState().error).toBeNull();
		}
	);

	it('renews once at the last known position when the player fails mid-track', async () => {
		const view = await startPlaying(inMinutes(30));
		const u1 = mockPlayerFor('u1');
		answerStreams({ streamUrl: 'u2', expiresAt: inMinutes(30) });

		setStatus(u1, { playbackState: 'ready', isLoaded: true, currentTime: 30 });
		view.rerender(
			<PlayerProvider>
				<SeekProbe />
			</PlayerProvider>
		);
		setStatus(u1, { playbackState: 'idle', isLoaded: false, currentTime: 0 });
		await act(async () =>
			view.rerender(
				<PlayerProvider>
					<SeekProbe />
				</PlayerProvider>
			)
		);
		await flush();

		const u2 = mockPlayerFor('u2');
		expect(mockApiRequest).toHaveBeenCalledTimes(2);
		expect(u2.seekTo).toHaveBeenCalledWith(30);
		expect(usePlayerStore.getState().playbackState).toBe('playing');
		expect(usePlayerStore.getState().error).toBeNull();

		setStatus(u2, { playbackState: 'ready', isLoaded: true, currentTime: 31 });
		view.rerender(
			<PlayerProvider>
				<SeekProbe />
			</PlayerProvider>
		);
		setStatus(u2, { playbackState: 'failed', isLoaded: false });
		await act(async () =>
			view.rerender(
				<PlayerProvider>
					<SeekProbe />
				</PlayerProvider>
			)
		);
		await flush();

		expect(mockApiRequest).toHaveBeenCalledTimes(2);
		expect(usePlayerStore.getState().error).toBe('Impossible de charger ce titre');
		expect(usePlayerStore.getState().currentTrack).toBeNull();
	});

	it('renews again once the renewed stream has played 30 s past its start', async () => {
		const view = await startPlaying(inMinutes(30));
		const u1 = mockPlayerFor('u1');
		answerStreams(
			{ streamUrl: 'u2', expiresAt: inMinutes(30) },
			{ streamUrl: 'u3', expiresAt: inMinutes(30) }
		);

		setStatus(u1, { playbackState: 'ready', isLoaded: true, currentTime: 30 });
		await rerender(view);
		setStatus(u1, { playbackState: 'idle', isLoaded: false, currentTime: 0 });
		await rerender(view);
		await flush();
		expect(usePlayerStore.getState().streamRenewed).toBe(true);

		const u2 = mockPlayerFor('u2');
		setStatus(u2, { playbackState: 'ready', isLoaded: true, currentTime: 60 });
		await rerender(view);
		expect(usePlayerStore.getState().streamRenewed).toBe(false);

		setStatus(u2, { playbackState: 'idle', isLoaded: false, currentTime: 0 });
		await rerender(view);
		await flush();

		expect(mockApiRequest).toHaveBeenCalledTimes(3);
		expect(mockPlayerFor('u3').seekTo).toHaveBeenCalledWith(60);
		expect(usePlayerStore.getState().playbackState).toBe('playing');
		expect(usePlayerStore.getState().error).toBeNull();
	});

	it('ignores a player that never loaded', async () => {
		const view = await startPlaying(inMinutes(30));
		expect(usePlayerStore.getState().playbackState).toBe('playing');
		const u1 = mockPlayerFor('u1');

		setStatus(u1, { playbackState: 'idle', isLoaded: false });
		await rerender(view);
		setStatus(u1, { playbackState: 'idle', isLoaded: false, currentTime: 0 });
		await rerender(view);
		await flush();

		expect(mockApiRequest).toHaveBeenCalledTimes(1);
		expect(usePlayerStore.getState().loadCounter).toBe(1);
		expect(usePlayerStore.getState().error).toBeNull();
	});

	it('reports the resume position while a renewal reloads', async () => {
		await startPlaying(inMinutes(1));
		act(() => usePlayerStore.getState().pause());
		mockPlayerFor('u1').currentTime = 42;
		let answer: (data: { streamUrl: string; expiresAt: string }) => void = noop;
		mockApiRequest.mockReturnValueOnce(new Promise(resolve => (answer = resolve)));

		await act(async () => usePlayerStore.getState().resume());

		expect(usePlayerStore.getState().playbackState).toBe('loading');
		expect(readPositionMs()).toBe(42000);

		await act(async () => answer({ streamUrl: 'u2', expiresAt: inMinutes(30) }));
		await flush();
		expect(usePlayerStore.getState().playbackState).toBe('playing');
		expect(readPositionMs()).toBe(42000);
	});

	it('ignores a paused player', async () => {
		const view = await startPlaying(inMinutes(30));
		const u1 = mockPlayerFor('u1');
		setStatus(u1, { playbackState: 'ready', isLoaded: true });
		view.rerender(
			<PlayerProvider>
				<SeekProbe />
			</PlayerProvider>
		);
		act(() => usePlayerStore.getState().pause());
		setStatus(u1, { playbackState: 'idle', isLoaded: false });
		await act(async () =>
			view.rerender(
				<PlayerProvider>
					<SeekProbe />
				</PlayerProvider>
			)
		);

		expect(mockApiRequest).toHaveBeenCalledTimes(1);
		expect(usePlayerStore.getState().error).toBeNull();
	});

	it('shows the error when the renewal request answers 404', async () => {
		await startPlaying(inMinutes(1));
		act(() => usePlayerStore.getState().pause());
		mockApiRequest.mockRejectedValueOnce(
			new MockApiError('Track stream not available', 'STREAM_NOT_FOUND', undefined, 404)
		);

		await act(async () => usePlayerStore.getState().resume());
		await flush();

		expect(mockApiRequest).toHaveBeenCalledTimes(2);
		expect(usePlayerStore.getState().error).toBe("Ce titre n'est plus disponible");
		expect(usePlayerStore.getState().playbackState).toBe('idle');
	});

	it('does not renew in remote mode', async () => {
		await startPlaying(inMinutes(1));
		act(() => usePlayerStore.getState().pause());
		act(() => {
			useConnectStore.setState({
				target: { kind: 'remote', ownerId: 'o', deviceId: 'd' },
				remoteStatus: null,
				controlPending: false,
			});
		});

		await act(async () => seekRef?.(90));

		expect(mockApiRequest).toHaveBeenCalledTimes(1);
		expect(mockPlayerFor('u1').seekTo).toHaveBeenCalledWith(90);
	});
});

describe('PlayerProvider audio interruptions (#310)', () => {
	async function playingNatively() {
		const view = await startPlaying(inMinutes(30));
		const u1 = mockPlayerFor('u1');
		setStatus(u1, { playing: true });
		await rerender(view);
		return { view, u1 };
	}

	async function nativeSets(
		view: ReturnType<typeof render>,
		player: MockPlayer,
		playing: boolean,
		extra: Partial<MockStatus> = {}
	) {
		player.playing = playing;
		setStatus(player, { playing, ...extra });
		await rerender(view);
	}

	it('pauses the store when the system stops the player (headset unplugged)', async () => {
		const { view, u1 } = await playingNatively();

		await nativeSets(view, u1, false);

		const state = usePlayerStore.getState();
		expect(state.playbackState).toBe('paused');
		expect(state.isPlaying).toBe(false);
		expect(state.pausedBySystem).toBe(true);
	});

	it('resumes the store when the system resumes the player after a call', async () => {
		const { view, u1 } = await playingNatively();
		u1.currentTime = 42;

		await nativeSets(view, u1, false);
		expect(usePlayerStore.getState().playbackState).toBe('paused');
		await nativeSets(view, u1, true);

		const state = usePlayerStore.getState();
		expect(state.playbackState).toBe('playing');
		expect(state.pausedBySystem).toBe(false);
		expect(mockApiRequest).toHaveBeenCalledTimes(1);
		expect(u1.seekTo).not.toHaveBeenCalled();
	});

	it('stays paused when the user paused during the interruption', async () => {
		const { view, u1 } = await playingNatively();
		await nativeSets(view, u1, false);
		act(() => usePlayerStore.getState().pause());
		u1.pause.mockClear();

		await nativeSets(view, u1, true);

		expect(usePlayerStore.getState().playbackState).toBe('paused');
		expect(u1.pause).toHaveBeenCalled();
		expect(u1.playing).toBe(false);
	});

	it('keeps playing when the volume is only ducked', async () => {
		const { view, u1 } = await playingNatively();

		await nativeSets(view, u1, true, { currentTime: 10 });

		expect(usePlayerStore.getState().playbackState).toBe('playing');
		expect(usePlayerStore.getState().pausedBySystem).toBe(false);
	});

	it.each([
		['buffering', { isBuffering: true }],
		['at the track end', { didJustFinish: true }],
	])('does not mirror a stop %s', async (_label, extra) => {
		const { view, u1 } = await playingNatively();
		answerStreams({ streamUrl: 'u2', expiresAt: inMinutes(30) });
		const next = jest.fn(async () => 'played' as const);
		mockNext = next;

		await nativeSets(view, u1, false, extra);

		expect(usePlayerStore.getState().pausedBySystem).toBe(false);
		expect(usePlayerStore.getState().playbackState).not.toBe('paused');
	});

	it.each(['failed', 'idle'])(
		'does not mirror a stop when the player is %s',
		async playbackState => {
			const view = await startPlaying(inMinutes(30));
			const u1 = mockPlayerFor('u1');
			setStatus(u1, { playing: true, isLoaded: false });
			await rerender(view);

			await nativeSets(view, u1, false, { isLoaded: true, playbackState });

			expect(usePlayerStore.getState().playbackState).toBe('playing');
			expect(usePlayerStore.getState().pausedBySystem).toBe(false);
		}
	);

	it('ignores a late event that no longer matches the player', async () => {
		const { view, u1 } = await playingNatively();

		setStatus(u1, { playing: false });
		await rerender(view);

		expect(u1.playing).toBe(true);
		expect(usePlayerStore.getState().playbackState).toBe('playing');
		expect(usePlayerStore.getState().pausedBySystem).toBe(false);
	});

	it('does not mirror a stop in remote mode', async () => {
		const { view, u1 } = await playingNatively();
		act(() => {
			useConnectStore.setState({
				target: { kind: 'remote', ownerId: 'o', deviceId: 'd' },
				remoteStatus: null,
				controlPending: false,
			});
		});

		await nativeSets(view, u1, false);

		expect(usePlayerStore.getState().playbackState).toBe('playing');
	});

	it('does not mirror a user pause', async () => {
		const { view, u1 } = await playingNatively();
		act(() => usePlayerStore.getState().pause());

		await nativeSets(view, u1, false);

		expect(usePlayerStore.getState().playbackState).toBe('paused');
		expect(usePlayerStore.getState().pausedBySystem).toBe(false);
	});
});

describe('PlayerProvider restored track (#312)', () => {
	async function renderRestored() {
		const view = render(
			<PlayerProvider>
				<SeekProbe />
			</PlayerProvider>
		);
		await act(async () => usePlayerStore.getState().restoreTrack(track, 'q1', 42_000));
		await flush();
		return view;
	}

	it('fetches no stream until play, and reports the saved position', async () => {
		await renderRestored();

		expect(mockApiRequest).not.toHaveBeenCalled();
		expect(usePlayerStore.getState().playbackState).toBe('paused');
		expect(readPositionMs()).toBe(42_000);
	});

	it('loads a fresh stream on play and starts at the saved position', async () => {
		await renderRestored();
		answerStreams({ streamUrl: 'u1', expiresAt: inMinutes(30) });

		await act(async () => usePlayerStore.getState().resume());
		await flush();

		const u1 = mockPlayerFor('u1');
		expect(mockApiRequest).toHaveBeenCalledTimes(1);
		expect(u1.seekTo).toHaveBeenCalledWith(42);
		expect(u1.play).toHaveBeenCalled();
		expect(usePlayerStore.getState().playbackState).toBe('playing');
		expect(usePlayerStore.getState().queueItemId).toBe('q1');
	});

	it('moves the start position on a seek before play', async () => {
		await renderRestored();

		act(() => seekRef?.(90));

		expect(mockApiRequest).not.toHaveBeenCalled();
		expect(usePlayerStore.getState().startPositionMs).toBe(90_000);
		expect(usePlayerStore.getState().seekCount).toBe(1);
	});

	it('shows the existing error on play when the track is gone', async () => {
		await renderRestored();
		mockApiRequest.mockRejectedValueOnce(
			new MockApiError('Track stream not available', 'STREAM_NOT_FOUND', undefined, 404)
		);

		await act(async () => usePlayerStore.getState().resume());
		await flush();

		const state = usePlayerStore.getState();
		expect(mockApiRequest).toHaveBeenCalledTimes(1);
		expect(state.error).toBe("Ce titre n'est plus disponible");
		expect(state.currentTrack).toBeNull();
		expect(state.playbackState).toBe('idle');
	});
});

describe('PlayerProvider next track prefetch (#314)', () => {
	function queueItem(id: string, slug: string): QueueItem {
		return {
			id,
			rank: id,
			track: {
				trackUri: `https://soundcloud.com/artist/${slug}`,
				title: slug,
				artist: 'artist',
				album: null,
				albumArt: null,
				durationMs: 200000,
			},
			sourcePlaylistId: null,
			blockId: null,
			blockDetached: false,
		};
	}
	const A = queueItem('qa', 'a');
	const B = queueItem('qb', 'b');
	const C = queueItem('qc', 'c');
	const D = queueItem('qd', 'd');

	function setQueue(currentItemId: string | null, items: QueueItem[]) {
		act(() => {
			useQueueStore.setState({ queues: { me: { currentItemId, items, version: 1 } } });
		});
	}

	async function playQueueItem(item: QueueItem, items: QueueItem[]) {
		answerStreams({ streamUrl: `u-${item.id}`, expiresAt: inMinutes(30) });
		setQueue(item.id, items);
		const view = render(
			<PlayerProvider>
				<SeekProbe />
			</PlayerProvider>
		);
		await act(async () => usePlayerStore.getState().playTrack(trackToSoundCloud(item), item.id));
		await flush();
		return { view, player: mockPlayerFor(`u-${item.id}`) };
	}

	async function reach(view: ReturnType<typeof render>, player: MockPlayer, currentTime: number) {
		setStatus(player, { currentTime, duration: 200, playing: true });
		await rerender(view);
		await flush();
	}

	async function stepTo(item: QueueItem, items: QueueItem[]) {
		setQueue(item.id, items);
		await act(async () => usePlayerStore.getState().playTrack(trackToSoundCloud(item), item.id));
		await flush();
	}

	function streamCallFor(item: QueueItem) {
		return mockApiRequest.mock.calls.filter(([endpoint]) =>
			String(endpoint).includes(encodeURIComponent(item.track.trackUri))
		).length;
	}

	beforeEach(() => {
		testSessionStore.setState({ user: { id: 'me' } as UserProfile });
	});

	it('fetches the next stream once after 3 s of play and plays it with no request', async () => {
		const { view, player } = await playQueueItem(A, [A, B, C]);

		await reach(view, player, 2);
		expect(mockApiRequest).toHaveBeenCalledTimes(1);

		answerStreams({ streamUrl: 'u-qb', expiresAt: inMinutes(30), protocol: 'progressive' });
		await reach(view, player, 3);
		await reach(view, player, 150);
		await reach(view, player, 190);
		expect(mockApiRequest).toHaveBeenCalledTimes(2);
		expect(streamCallFor(B)).toBe(1);

		await stepTo(B, [A, B, C]);

		expect(mockApiRequest).toHaveBeenCalledTimes(2);
		expect(usePlayerStore.getState().streamUrl).toBe('u-qb');
		expect(usePlayerStore.getState().streamProtocol).toBe('progressive');
		expect(mockPlayerFor('u-qb').play).toHaveBeenCalled();
		expect(usePlayerStore.getState().playbackState).toBe('playing');
		expect(streamPrefetch.peek()).toBeNull();
	});

	it('does not prefetch in remote mode', async () => {
		const { view, player } = await playQueueItem(A, [A, B]);
		act(() => {
			useConnectStore.setState({
				target: { kind: 'remote', ownerId: 'me', deviceId: 'd' },
				remoteStatus: null,
				controlPending: false,
			});
		});

		await reach(view, player, 190);

		expect(mockApiRequest).toHaveBeenCalledTimes(1);
	});

	it('does not prefetch without a next item', async () => {
		const { view, player } = await playQueueItem(B, [A, B]);

		await reach(view, player, 190);

		expect(mockApiRequest).toHaveBeenCalledTimes(1);
	});

	it('does not prefetch while paused', async () => {
		const { view, player } = await playQueueItem(A, [A, B]);
		act(() => usePlayerStore.getState().pause());

		await reach(view, player, 190);

		expect(mockApiRequest).toHaveBeenCalledTimes(1);
	});

	it('switches to the new next item after a reorder', async () => {
		const { view, player } = await playQueueItem(A, [A, B, C]);
		answerStreams({ streamUrl: 'u-qb', expiresAt: inMinutes(30) });
		await reach(view, player, 185);
		expect(streamPrefetch.peek()?.queueItemId).toBe('qb');

		answerStreams({ streamUrl: 'u-qc', expiresAt: inMinutes(30) });
		setQueue('qa', [A, C, B]);
		await reach(view, player, 186);
		expect(streamCallFor(C)).toBe(1);
		expect(streamPrefetch.peek()?.queueItemId).toBe('qc');

		await stepTo(C, [A, C, B]);

		expect(mockApiRequest).toHaveBeenCalledTimes(3);
		expect(usePlayerStore.getState().streamUrl).toBe('u-qc');
	});

	it('ignores a prefetch answered after the next item changed', async () => {
		const { view, player } = await playQueueItem(A, [A, B, C]);
		let answer: (data: { streamUrl: string; expiresAt: string }) => void = noop;
		mockApiRequest.mockReturnValueOnce(new Promise(resolve => (answer = resolve)));
		await reach(view, player, 185);

		mockApiRequest.mockReturnValueOnce(new Promise(() => undefined));
		setQueue('qa', [A, C, B]);
		await rerender(view);
		await act(async () => answer({ streamUrl: 'u-qb', expiresAt: inMinutes(30) }));
		await flush();

		expect(streamPrefetch.peek()).toBeNull();
	});

	it('fetches another item played meanwhile normally', async () => {
		const { view, player } = await playQueueItem(A, [A, B, C, D]);
		answerStreams({ streamUrl: 'u-qb', expiresAt: inMinutes(30) });
		await reach(view, player, 185);

		answerStreams({ streamUrl: 'u-qd', expiresAt: inMinutes(30) });
		await stepTo(D, [A, B, C, D]);

		expect(streamCallFor(D)).toBe(1);
		expect(usePlayerStore.getState().streamUrl).toBe('u-qd');
		expect(streamPrefetch.peek()).toBeNull();
	});

	it('fetches again when the prefetched URL is about to expire', async () => {
		const { view, player } = await playQueueItem(A, [A, B]);
		answerStreams({ streamUrl: 'u-qb', expiresAt: inMinutes(1) });
		await reach(view, player, 185);

		answerStreams({ streamUrl: 'u-qb-fresh', expiresAt: inMinutes(30) });
		await stepTo(B, [A, B]);

		expect(streamCallFor(B)).toBe(2);
		expect(usePlayerStore.getState().streamUrl).toBe('u-qb-fresh');
	});

	it('shows nothing when the prefetch fails, and fetches on load', async () => {
		const { view, player } = await playQueueItem(A, [A, B]);
		mockApiRequest.mockRejectedValueOnce(new Error('Network request failed'));
		await reach(view, player, 185);

		expect(usePlayerStore.getState().error).toBeNull();
		expect(usePlayerStore.getState().playbackState).toBe('playing');

		answerStreams({ streamUrl: 'u-qb', expiresAt: inMinutes(30) });
		await stepTo(B, [A, B]);

		expect(streamCallFor(B)).toBe(2);
		expect(usePlayerStore.getState().streamUrl).toBe('u-qb');
		expect(usePlayerStore.getState().error).toBeNull();
	});
});
