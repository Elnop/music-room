import React, { useEffect } from 'react';
import { act, render } from '@testing-library/react-native';
import { PlayerProvider } from './PlayerProvider';
import { usePlayer } from './PlayerContext';
import { readPositionMs, usePlayerStore } from '@/features/player/stores/playerStore';
import { registerConnectBridge, type ConnectSnapshot } from '@/shared/services/connectBridge';
import { registerPlaybackBridge, type OwnerQueue } from '@/shared/services/playbackBridge';
import { registerAuthSession, type SessionView } from '@/shared/services/authSession';
import { createStore } from 'zustand';
import { streamPrefetch } from '@/features/player/services/streamPrefetch';
import { apiRequest } from '@/shared/services/api';
import { trackToSoundCloud } from '@/shared/utils/trackToSoundCloud';
import type { SoundCloudTrack } from '@/types/soundcloud.types';
import type { QueueItem } from '@/types/queue.types';
import type { UserProfile } from '@/types/user.types';

interface MockPlayer {
	id: number;
	url: string;
	isLoaded: boolean;
	duration: number;
	playing: boolean;
	currentTime: number;
	play: jest.Mock;
	pause: jest.Mock;
	seekTo: jest.Mock;
}

interface MockStatus {
	id: number;
	playbackState: string;
	isLoaded: boolean;
	currentTime: number;
	didJustFinish: boolean;
	duration?: number;
	playing?: boolean;
	isBuffering?: boolean;
}

const mockPlayers = new Map<string, MockPlayer>();
const mockStatuses = new Map<number, MockStatus>();
let mockNextId = 1;

function mockPlayerFor(url: string): MockPlayer {
	let player = mockPlayers.get(url);
	if (!player) {
		const created: MockPlayer = {
			id: mockNextId++,
			url,
			// A real stream loads as soon as the player has it; the empty source never does.
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

// The system media controls are covered by MediaSessionBridge.test.tsx.
jest.mock('@/features/player/mediaSession/components/orchestrators/MediaSessionBridge', () => ({
	MediaSessionBridge: () => null,
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

jest.mock('@/shared/services/api', () => {
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

jest.mock('@/shared/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

const mockApiRequest = apiRequest as jest.Mock;
const { ApiError: MockApiError } = jest.requireMock('@/shared/services/api') as {
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
const inMinutes = (minutes: number) => new Date(Date.now() + minutes * MINUTE_MS).toISOString();

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

let testQueue: OwnerQueue = {
	currentItemId: null,
	items: [],
	version: 0,
};

let testConnectState: ConnectSnapshot = {
	target: { kind: 'local' },
	remoteStatus: null,
	controlPending: false,
};

let mockNext = jest.fn(async () => 'played' as const);

registerPlaybackBridge({
	usePlaylistPlayback: () => ({ playingUri: null, state: null }),
	usePlayerHeight: () => 0,
	useActiveQueue: () => testQueue,
	addToQueue: jest.fn(async () => true),
	playNext: jest.fn(async () => true),
	playPlaylist: jest.fn(async () => 'ok'),
	next: (...args) => mockNext(...args),
	previous: jest.fn(async () => 'played'),
	playListTrack: jest.fn(async () => undefined),
	playTrack: jest.fn(),
	pause: jest.fn(),
	resume: jest.fn(),
	stop: jest.fn(),
	getPlayerState: () => ({ currentTrack: null, queueItemId: null, loadCounter: 0, positionMs: 0 }),
});

registerConnectBridge({
	useConnect: selector => selector(testConnectState),
	useIsLocal: () => testConnectState.target.kind === 'local',
	getConnectState: () => testConnectState,
	setRemoteStatus: status => {
		testConnectState.remoteStatus = status;
	},
	setControlPending: pending => {
		testConnectState.controlPending = pending;
	},
	setLocal: () => {
		testConnectState.target = { kind: 'local' };
	},
	setRemote: target => {
		testConnectState.target = { kind: 'remote', ...target };
	},
});

const initialPlayerState = usePlayerStore.getState();
const initialAuthState = testSessionStore.getState();

function answerStreams(...urls: { streamUrl: string; expiresAt: string }[]) {
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
	testQueue = { currentItemId: null, items: [], version: 0 };
	testSessionStore.setState(initialAuthState, true);
	streamPrefetch.clear();
	testConnectState = { target: { kind: 'local' }, remoteStatus: null, controlPending: false };
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
		expect(state.currentTrack).toEqual(track);
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

		// The renewed stream fails too (iOS reports `failed`): final, no further request.
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
		let answer: (data: { streamUrl: string; expiresAt: string }) => void = () => undefined;
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
			testConnectState = {
				target: { kind: 'remote', ownerId: 'o', deviceId: 'd' },
				remoteStatus: null,
				controlPending: false,
			};
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
		// The player resumed itself at its position: no reload, no seek.
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
		// Auto-advance belongs to QueueAutoAdvance: keep it out of the way.
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
			// Never reported loaded, so StreamWatchdog leaves it: only this guard stops the mirror.
			setStatus(u1, { playing: true, isLoaded: false });
			await rerender(view);

			await nativeSets(view, u1, false, { isLoaded: true, playbackState });

			expect(usePlayerStore.getState().playbackState).toBe('playing');
			expect(usePlayerStore.getState().pausedBySystem).toBe(false);
		}
	);

	it('ignores a late event that no longer matches the player', async () => {
		const { view, u1 } = await playingNatively();

		// A stale `playing: false` from a fast pause/play: the player itself plays.
		setStatus(u1, { playing: false });
		await rerender(view);

		expect(u1.playing).toBe(true);
		expect(usePlayerStore.getState().playbackState).toBe('playing');
		expect(usePlayerStore.getState().pausedBySystem).toBe(false);
	});

	it('does not mirror a stop in remote mode', async () => {
		const { view, u1 } = await playingNatively();
		act(() => {
			testConnectState = {
				target: { kind: 'remote', ownerId: 'o', deviceId: 'd' },
				remoteStatus: null,
				controlPending: false,
			};
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
	const queueItem = (id: string, slug: string): QueueItem => ({
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
	});
	const A = queueItem('qa', 'a');
	const B = queueItem('qb', 'b');
	const C = queueItem('qc', 'c');
	const D = queueItem('qd', 'd');

	function setQueue(currentItemId: string | null, items: QueueItem[]) {
		act(() => {
			testQueue = { currentItemId, items, version: 1 };
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

	/** Step to `item` as the queue does: new current item, then playTrack. */
	async function stepTo(item: QueueItem, items: QueueItem[]) {
		setQueue(item.id, items);
		await act(async () => usePlayerStore.getState().playTrack(trackToSoundCloud(item), item.id));
		await flush();
	}

	const streamCallFor = (item: QueueItem) =>
		mockApiRequest.mock.calls.filter(([endpoint]) =>
			String(endpoint).includes(encodeURIComponent(item.track.trackUri))
		).length;

	beforeEach(() => {
		testSessionStore.setState({ user: { id: 'me' } as UserProfile });
	});

	it('fetches the next stream once in the last 20 s and plays it with no request', async () => {
		const { view, player } = await playQueueItem(A, [A, B, C]);

		await reach(view, player, 150);
		expect(mockApiRequest).toHaveBeenCalledTimes(1);

		answerStreams({ streamUrl: 'u-qb', expiresAt: inMinutes(30) });
		await reach(view, player, 181);
		await reach(view, player, 190);
		expect(mockApiRequest).toHaveBeenCalledTimes(2);
		expect(streamCallFor(B)).toBe(1);

		await stepTo(B, [A, B, C]);

		expect(mockApiRequest).toHaveBeenCalledTimes(2);
		expect(usePlayerStore.getState().streamUrl).toBe('u-qb');
		expect(mockPlayerFor('u-qb').play).toHaveBeenCalled();
		expect(usePlayerStore.getState().playbackState).toBe('playing');
		expect(streamPrefetch.peek()).toBeNull();
	});

	it('does not prefetch in remote mode', async () => {
		const { view, player } = await playQueueItem(A, [A, B]);
		act(() => {
			testConnectState = {
				target: { kind: 'remote', ownerId: 'me', deviceId: 'd' },
				remoteStatus: null,
				controlPending: false,
			};
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
		let answer: (data: { streamUrl: string; expiresAt: string }) => void = () => undefined;
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
