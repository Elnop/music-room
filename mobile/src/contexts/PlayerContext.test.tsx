import React, { useEffect } from 'react';
import { act, render } from '@testing-library/react-native';
import { PlayerProvider, usePlayer } from '@/contexts/PlayerContext';
import { readPositionMs, usePlayerStore } from '@/store/playerStore';
import { useConnectStore } from '@/store/connectStore';
import { apiRequest } from '@/services/api';
import type { SoundCloudTrack } from '@/types/soundcloud.types';

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

// The system media controls (#309) are covered by MediaSessionBridge.test.tsx.
jest.mock('@/components/player/MediaSessionBridge', () => ({ MediaSessionBridge: () => null }));

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

jest.mock('@/services/api', () => {
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
	return { ApiError, apiRequest: jest.fn(), registerAuthSession: jest.fn() };
});

jest.mock('@/lib/supabase', () => ({
	supabase: { auth: { signOut: jest.fn(), setSession: jest.fn() } },
}));

jest.mock('@services/oauth', () => ({
	signInWithGoogle: jest.fn(),
	signInWithFacebook: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

const mockApiRequest = apiRequest as jest.Mock;
const { ApiError: MockApiError } = jest.requireMock('@/services/api') as {
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

const initialPlayerState = usePlayerStore.getState();

/** Next stream responses, in order. */
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

/** Re-render so the mocked statuses reach the provider. */
async function rerender(view: ReturnType<typeof render>) {
	await act(async () =>
		view.rerender(
			<PlayerProvider>
				<SeekProbe />
			</PlayerProvider>
		)
	);
}

/** Render the provider and play `track` on the stream `u1`. */
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
	useConnectStore.getState().setLocal();
	jest.spyOn(console, 'log').mockImplementation(() => undefined);
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
		expect(usePlayerStore.getState().error).toBe('Unable to load this track');
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
		expect(usePlayerStore.getState().error).toBe(
			'This track is no longer available (rights are expensive)'
		);
		expect(usePlayerStore.getState().playbackState).toBe('idle');
	});

	it('does not renew in remote mode', async () => {
		await startPlaying(inMinutes(1));
		act(() => usePlayerStore.getState().pause());
		useConnectStore.setState({
			target: { kind: 'remote', ownerId: 'o', deviceId: 'd', ownerUsername: null },
		} as never);

		await act(async () => seekRef?.(90));

		expect(mockApiRequest).toHaveBeenCalledTimes(1);
		expect(mockPlayerFor('u1').seekTo).toHaveBeenCalledWith(90);
	});
});
