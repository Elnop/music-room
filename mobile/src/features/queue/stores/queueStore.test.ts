import { useQueueStore } from './queueStore';
import {
	EMPTY_QUEUE,
	nextItem,
	previousAction,
	selectHasNext,
	selectHasPrevious,
	selectPlaysPlaylist,
} from '@/features/queue/utils/queueSelectors';
import { createStore } from 'zustand';
import { registerPlaybackBridge } from '@/shared/services/playbackBridge';
import { registerAuthSession, type SessionView } from '@/shared/services/authSession';
import { deferred } from '@/test/deferred';
import { useConnectStore } from './connectStore';
import type { UserProfile } from '@/types/user.types';
import { queueApi } from '@/features/queue/services/queueApi';
import { ApiError } from '@/shared/services/api';
import { showError, showInfo, showSuccess } from '@/shared/utils/toast';
import { hapticSuccess } from '@/shared/utils/haptics';
import type { QueueItem, QueueState, QueueStepResult } from '@/types/queue.types';
import type { SoundCloudTrack } from '@/types/soundcloud.types';
import { logger } from '@/shared/utils/logger';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

jest.mock('@/features/queue/services/queueApi', () => ({
	queueApi: {
		getQueue: jest.fn(),
		next: jest.fn(),
		previous: jest.fn(),
		playItem: jest.fn(),
		addItem: jest.fn(),
		moveItem: jest.fn(),
		removeItem: jest.fn(),
		playPlaylist: jest.fn(),
		transfer: jest.fn(),
	},
}));

jest.mock('@/shared/utils/haptics', () => ({ hapticSuccess: jest.fn() }));

jest.mock('@/shared/utils/toast', () => ({
	showSuccess: jest.fn(),
	showError: jest.fn(),
	showInfo: jest.fn(),
}));

const api = queueApi as jest.Mocked<typeof queueApi>;

const item = (id: string): QueueItem => ({
	id,
	rank: id,
	track: {
		trackUri: `https://soundcloud.com/artist/${id}`,
		title: `Title ${id}`,
		artist: 'Artist',
		album: null,
		albumArt: null,
		durationMs: 1000,
	},
	sourcePlaylistId: null,
	blockId: null,
	blockDetached: false,
});

let nextVersion = 0;

const queue = (currentItemId: string | null, ids = ['a', 'b', 'c']): QueueState => ({
	ownerId: 'owner',
	version: ++nextVersion,
	currentItemId,
	items: ids.map(item),
});

const body = (id: string) => {
	const { trackUri, title, artist, durationMs } = item(id).track;
	return { trackUri, title, artist, durationMs };
};

const listTrack: SoundCloudTrack = {
	id: 99,
	title: 'Tapped',
	description: null,
	duration: 1000,
	genre: null,
	artwork_url: null,
	permalink_url: 'https://soundcloud.com/artist/tapped',
	user: { id: 1, username: 'x', avatar_url: null, permalink_url: '' },
	playable: true,
};

interface MockPlayerState {
	currentTrack: SoundCloudTrack | null;
	queueItemId: string | null;
	loadCounter: number;
	positionMs: number;
	playbackState: string;
	error: string | null;
	playTrack: (track: SoundCloudTrack, queueItemId?: string, startPositionMs?: number) => void;
	stop: () => void;
}

let mockPlayer: MockPlayerState;

const resetMockPlayer = () => {
	mockPlayer = {
		currentTrack: null,
		queueItemId: null,
		loadCounter: 0,
		positionMs: 0,
		playbackState: 'idle',
		error: null,
		playTrack: jest.fn((track: SoundCloudTrack, queueItemId?: string, startPositionMs?: number) => {
			mockPlayer.currentTrack = track;
			mockPlayer.queueItemId = queueItemId ?? null;
			mockPlayer.loadCounter += 1;
			mockPlayer.positionMs = startPositionMs ?? 0;
			mockPlayer.playbackState = 'loading';
			mockPlayer.error = null;
		}),
		stop: jest.fn(() => {
			mockPlayer.currentTrack = null;
			mockPlayer.queueItemId = null;
			mockPlayer.playbackState = 'idle';
			mockPlayer.error = null;
		}),
	};
};

resetMockPlayer();

registerPlaybackBridge({
	usePlaylistPlayback: () => ({ playingUri: null, state: null }),
	usePlayerHeight: () => 0,
	useActiveQueue: () => EMPTY_QUEUE,
	addToQueue: jest.fn(),
	playNext: jest.fn(),
	playPlaylist: jest.fn(),
	next: jest.fn(),
	previous: jest.fn(),
	playListTrack: jest.fn(),
	playTrack: (track, queueItemId, startPositionMs) =>
		mockPlayer.playTrack(track, queueItemId, startPositionMs),
	pause: jest.fn(),
	resume: jest.fn(),
	stop: () => mockPlayer.stop(),
	getPlayerState: () => mockPlayer,
});

const authSessionStore = createStore<SessionView>(() => ({
	user: { id: 'owner' } as UserProfile,
	accessToken: 'test-token',
	isAuthenticated: true,
}));

registerAuthSession({
	store: authSessionStore,
	isTokenExpiringSoon: () => false,
	refreshAccessToken: async () => true,
});

const initialPlayer = { loadCounter: 0 };
const player = () => mockPlayer;
const setAuthUser = (user: UserProfile | null) => {
	authSessionStore.setState({ user, isAuthenticated: user !== null });
};

const store = () => useQueueStore.getState();
/** The signed-in user's queue (the test user is `owner`). */
const mine = () => store().queues.owner ?? EMPTY_QUEUE;

beforeEach(() => {
	jest.resetAllMocks();
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
	resetMockPlayer();
	setAuthUser({ id: 'owner' } as UserProfile);
	useConnectStore.setState({ target: { kind: 'local' }, remoteStatus: null });
	store().reset();
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('queueStore load and events', () => {
	it('holds the server queue after load', async () => {
		api.getQueue.mockResolvedValue(queue('a'));
		await store().load();
		expect(mine().currentItemId).toBe('a');
		expect(mine().items.map(i => i.id)).toEqual(['a', 'b', 'c']);
		expect(store().loaded).toBe(true);
	});

	it('keeps its last state when the load fails', async () => {
		store().applyState(queue('b'));
		api.getQueue.mockRejectedValue(new ApiError('down', 'NETWORK_ERROR'));
		await store().load();
		expect(mine().currentItemId).toBe('b');
		expect(logger.error).toHaveBeenCalled();
	});

	it('replaces the store with a queue:updated payload without touching audio', () => {
		player().playTrack(listTrack);
		const before = player().loadCounter;
		store().applyState(queue('c', ['a', 'c']));
		expect(mine().currentItemId).toBe('c');
		expect(mine().items.map(i => i.id)).toEqual(['a', 'c']);
		expect(player().loadCounter).toBe(before);
		expect(player().currentTrack).toBe(listTrack);
	});

	it('reset empties the store', () => {
		store().applyState(queue('a'));
		store().reset();
		expect(mine().items).toEqual([]);
		expect(store().loaded).toBe(false);
	});
});

describe('queueStore next', () => {
	it('applies the new state and plays the new current item', async () => {
		store().applyState(queue('a'));
		api.next.mockResolvedValue({ ok: true, state: queue('b') });

		await expect(store().next()).resolves.toBe('played');

		expect(mine().currentItemId).toBe('b');
		expect(player().queueItemId).toBe('b');
		expect(player().currentTrack?.permalink_url).toBe('https://soundcloud.com/artist/b');
		expect(player().playbackState).toBe('loading');
	});

	it('plays the next queue item after a list-tapped track', async () => {
		player().playTrack(listTrack);
		api.next.mockResolvedValue({ ok: true, state: queue('a') });

		await store().next();

		expect(player().queueItemId).toBe('a');
		expect(player().currentTrack?.title).toBe('Title a');
	});

	it('stops playback cleanly at QUEUE_END', async () => {
		player().playTrack(listTrack);
		api.next.mockResolvedValue({ ok: false, code: 'QUEUE_END' });

		await expect(store().next()).resolves.toBe('boundary');

		expect(player().playbackState).toBe('idle');
		expect(player().currentTrack).toBeNull();
		expect(player().error).toBeNull();
	});

	it('leaves playback unchanged on a network error', async () => {
		store().applyState(queue('a'));
		player().playTrack(listTrack);
		api.next.mockRejectedValue(new ApiError('offline', 'NETWORK_ERROR'));

		await expect(store().next()).resolves.toBe('error');

		expect(player().currentTrack).toBe(listTrack);
		expect(mine().currentItemId).toBe('a');
	});

	it('does not override a track tapped while the request ran', async () => {
		let resolve!: (value: { ok: true; state: QueueState }) => void;
		api.next.mockReturnValue(new Promise(r => (resolve = r)));

		const pending = store().next();
		player().playTrack(listTrack);
		resolve({ ok: true, state: queue('b') });
		await pending;

		expect(mine().currentItemId).toBe('b');
		expect(player().currentTrack).toBe(listTrack);
		expect(player().queueItemId).toBeNull();
	});
});

describe('queueStore concurrent steps', () => {
	it('ignores a step while another is pending', async () => {
		let resolve!: (value: { ok: true; state: QueueState }) => void;
		api.next.mockReturnValue(new Promise(r => (resolve = r)));

		const first = store().next();
		const second = store().next();
		resolve({ ok: true, state: queue('b') });

		await expect(second).resolves.toBe('ignored');
		await expect(first).resolves.toBe('played');
		expect(api.next).toHaveBeenCalledTimes(1);
		expect(mine().currentItemId).toBe('b');
		expect(player().queueItemId).toBe('b');

		// The flag is cleared: a later step goes through.
		api.next.mockResolvedValue({ ok: true, state: queue('c') });
		await expect(store().next()).resolves.toBe('played');
		expect(player().queueItemId).toBe('c');
	});

	it('clears the pending flag after a failed step', async () => {
		api.next.mockRejectedValueOnce(new ApiError('offline', 'NETWORK_ERROR'));
		await expect(store().next()).resolves.toBe('error');
		api.next.mockResolvedValue({ ok: true, state: queue('a') });
		await expect(store().next()).resolves.toBe('played');
	});
});

describe('queueStore previous', () => {
	it('plays the previous item', async () => {
		store().applyState(queue('b'));
		api.previous.mockResolvedValue({ ok: true, state: queue('a') });

		await expect(store().previous()).resolves.toBe('played');

		expect(player().queueItemId).toBe('a');
	});

	it('does nothing at QUEUE_START', async () => {
		player().playTrack(listTrack);
		api.previous.mockResolvedValue({ ok: false, code: 'QUEUE_START' });

		await expect(store().previous()).resolves.toBe('boundary');

		expect(player().currentTrack).toBe(listTrack);
	});

	it('restarts past 3 s or without history, otherwise steps back', () => {
		expect(previousAction(3.5, true)).toBe('restart');
		expect(previousAction(2, true)).toBe('previous');
		expect(previousAction(3, true)).toBe('previous');
		expect(previousAction(1, false)).toBe('restart');
	});
});

describe('queueStore selectors and list taps', () => {
	it('derives next and previous availability from the current item', () => {
		expect(selectHasNext(queue(null, []))).toBe(false);
		expect(selectHasNext(queue(null))).toBe(true);
		expect(selectHasPrevious(queue(null))).toBe(false);
		expect(selectHasNext(queue('a'))).toBe(true);
		expect(selectHasPrevious(queue('a'))).toBe(false);
		expect(selectHasNext(queue('c'))).toBe(false);
		expect(selectHasPrevious(queue('c'))).toBe(true);
	});

	it('picks the item after the current one, or the first with nothing current', () => {
		expect(nextItem(queue(null))?.id).toBe('a');
		expect(nextItem(queue('a'))?.id).toBe('b');
		expect(nextItem(queue('c'))).toBeUndefined();
		expect(nextItem(queue(null, []))).toBeUndefined();
	});

	it('a list tap plays at once and leaves the queue alone', () => {
		store().applyState(queue('a'));
		player().playTrack(listTrack);

		expect(player().queueItemId).toBeNull();
		expect(mine().currentItemId).toBe('a');
		expect(api.next).not.toHaveBeenCalled();
		expect(api.playItem).not.toHaveBeenCalled();
	});

	it('stop clears the queue item being played', async () => {
		api.next.mockResolvedValue({ ok: true, state: queue('a') });
		await store().next();
		player().stop();
		expect(player().queueItemId).toBeNull();
	});
});

describe('queueStore addItem', () => {
	const body = {
		trackUri: 'https://soundcloud.com/artist/new',
		title: 'New',
		artist: 'Artist',
		durationMs: 1000,
	};

	it('applies the returned state, toasts and leaves the player alone', async () => {
		store().applyState(queue('a', ['a']));
		player().playTrack(listTrack);
		const before = player().loadCounter;
		api.addItem.mockResolvedValue(queue('a', ['a', 'n']));

		await expect(store().addItem(body)).resolves.toBe(true);

		expect(api.addItem).toHaveBeenCalledWith(body, {});
		expect(mine().items.map(i => i.id)).toEqual(['a', 'n']);
		expect(mine().currentItemId).toBe('a');
		expect(showSuccess).toHaveBeenCalledWith("Ajouté à la file d'attente");
		expect(hapticSuccess).toHaveBeenCalledTimes(1);
		expect(player().loadCounter).toBe(before);
		expect(player().currentTrack).toBe(listTrack);
		expect(player().queueItemId).toBeNull();
	});

	it('keeps the state and toasts a French message on failure', async () => {
		store().applyState(queue('a', ['a']));
		api.addItem.mockRejectedValue(new ApiError('Queue is full', 'QUEUE_FULL'));

		await expect(store().addItem(body)).resolves.toBe(false);

		expect(mine().items.map(i => i.id)).toEqual(['a']);
		expect(showError).toHaveBeenCalledWith("Impossible d'ajouter à la file d'attente");
		expect(showSuccess).not.toHaveBeenCalled();
		expect(hapticSuccess).not.toHaveBeenCalled();
	});
});

describe('queueStore playNext', () => {
	const body = {
		trackUri: 'https://soundcloud.com/artist/new',
		title: 'New',
		artist: 'Artist',
		durationMs: 1000,
	};

	it('sends next: true, applies the returned state and toasts', async () => {
		store().applyState(queue('a', ['a', 'b']));
		api.addItem.mockResolvedValue(queue('a', ['a', 'n', 'b']));

		await expect(store().playNext(body)).resolves.toBe(true);

		expect(api.addItem).toHaveBeenCalledWith({ ...body, next: true }, {});
		expect(mine().items.map(i => i.id)).toEqual(['a', 'n', 'b']);
		expect(mine().currentItemId).toBe('a');
		expect(showSuccess).toHaveBeenCalledWith('Lira ensuite');
		expect(hapticSuccess).toHaveBeenCalledTimes(1);
	});

	it('keeps the state and toasts an error on failure', async () => {
		store().applyState(queue('a', ['a']));
		api.addItem.mockRejectedValue(new ApiError('Queue is full', 'QUEUE_FULL'));

		await expect(store().playNext(body)).resolves.toBe(false);

		expect(mine().items.map(i => i.id)).toEqual(['a']);
		expect(showError).toHaveBeenCalledWith("Impossible d'ajouter ce titre");
		expect(showSuccess).not.toHaveBeenCalled();
		expect(hapticSuccess).not.toHaveBeenCalled();
	});
});

describe('queueStore playItem', () => {
	it('makes the item current and plays it on this device', async () => {
		store().applyState(queue('a'));
		api.playItem.mockResolvedValue(queue('c'));

		await expect(store().playItem('c')).resolves.toBe('played');

		expect(api.playItem).toHaveBeenCalledWith('c', {});
		expect(mine().currentItemId).toBe('c');
		expect(player().queueItemId).toBe('c');
		expect(player().currentTrack?.title).toBe('Title c');
	});

	it('shows an error and leaves playback alone when the request fails', async () => {
		store().applyState(queue('a'));
		player().playTrack(listTrack);
		api.playItem.mockRejectedValue(new ApiError('gone', 'NOT_FOUND', undefined, 404));

		await expect(store().playItem('c')).resolves.toBe('error');

		expect(showError).toHaveBeenCalled();
		expect(mine().currentItemId).toBe('a');
		expect(player().currentTrack).toBe(listTrack);
	});

	it('shares the step guard with next', async () => {
		let resolve!: (value: QueueState) => void;
		api.playItem.mockReturnValue(new Promise(r => (resolve = r)));

		const pending = store().playItem('b');
		await expect(store().next()).resolves.toBe('ignored');
		resolve(queue('b'));
		await expect(pending).resolves.toBe('played');
		expect(api.next).not.toHaveBeenCalled();
	});
});

describe('queueStore removeItem', () => {
	it('removes an upcoming item without touching playback', async () => {
		store().applyState(queue('a'));
		player().playTrack(listTrack);
		const before = player().loadCounter;
		api.removeItem.mockResolvedValue(queue('a', ['a', 'c']));

		await expect(store().removeItem('b')).resolves.toBe(true);

		expect(api.removeItem).toHaveBeenCalledWith('b', {});
		expect(mine().items.map(i => i.id)).toEqual(['a', 'c']);
		expect(player().loadCounter).toBe(before);
	});

	it('plays the next item when the current one, playing here, is removed', async () => {
		store().applyState(queue('a'));
		api.playItem.mockResolvedValue(queue('a'));
		await store().playItem('a');
		api.removeItem.mockResolvedValue(queue('b', ['b', 'c']));

		await expect(store().removeItem('a')).resolves.toBe(true);

		expect(mine().currentItemId).toBe('b');
		expect(player().queueItemId).toBe('b');
		expect(player().currentTrack?.title).toBe('Title b');
	});

	it('stops playback when the removed current item was the last', async () => {
		store().applyState(queue('c', ['c']));
		api.playItem.mockResolvedValue(queue('c', ['c']));
		await store().playItem('c');
		api.removeItem.mockResolvedValue(queue(null, []));

		await expect(store().removeItem('c')).resolves.toBe(true);

		expect(mine().items).toEqual([]);
		expect(player().currentTrack).toBeNull();
		expect(player().playbackState).toBe('idle');
	});

	it('leaves a list-tapped track playing when the current item is removed', async () => {
		store().applyState(queue('a'));
		player().playTrack(listTrack);
		const before = player().loadCounter;
		api.removeItem.mockResolvedValue(queue(null, []));

		await expect(store().removeItem('a')).resolves.toBe(true);

		expect(mine().items).toEqual([]);
		expect(player().currentTrack).toBe(listTrack);
		expect(player().loadCounter).toBe(before);
	});

	it('tells the user when another step is still pending', async () => {
		store().applyState(queue('a'));
		api.playItem.mockResolvedValue(queue('a'));
		await store().playItem('a');
		let resolve!: (value: { ok: true; state: QueueState }) => void;
		api.next.mockReturnValue(new Promise(r => (resolve = r)));

		const pending = store().next();
		await expect(store().removeItem('a')).resolves.toBe(false);
		expect(showInfo).toHaveBeenCalledWith('Une action est déjà en cours');
		expect(api.removeItem).not.toHaveBeenCalled();
		resolve({ ok: true, state: queue('b') });
		await pending;
	});

	it('shows an error and keeps the store when the request fails', async () => {
		store().applyState(queue('a'));
		api.removeItem.mockRejectedValue(new ApiError('gone', 'NOT_FOUND', undefined, 404));

		await expect(store().removeItem('b')).resolves.toBe(false);
		await expect(store().removeItem('a')).resolves.toBe(false);

		expect(showError).toHaveBeenCalledTimes(2);
		expect(mine().items.map(i => i.id)).toEqual(['a', 'b', 'c']);
	});
});

describe('queueStore moveItem', () => {
	it('applies the order the server returns', async () => {
		store().applyState(queue('a'));
		api.moveItem.mockResolvedValue(queue('a', ['a', 'c', 'b']));

		await expect(store().moveItem('c', null)).resolves.toBe(true);

		expect(api.moveItem).toHaveBeenCalledWith('c', null, {});
		expect(mine().items.map(i => i.id)).toEqual(['a', 'c', 'b']);
	});

	it('shows an error and keeps the store order on a conflict', async () => {
		store().applyState(queue('a'));
		api.moveItem.mockRejectedValue(new ApiError('conflict', 'CONFLICT', undefined, 409));

		await expect(store().moveItem('c', null)).resolves.toBe(false);

		expect(showError).toHaveBeenCalled();
		expect(mine().items.map(i => i.id)).toEqual(['a', 'b', 'c']);
	});
});

describe('queueStore playPlaylist', () => {
	/** `ids` queued from playlist `p1`, after a list item `x`. */
	const withBlock = (currentItemId: string | null, ids: string[]): QueueState => ({
		ownerId: 'owner',
		version: ++nextVersion,
		currentItemId,
		items: [item('x'), ...ids.map(id => ({ ...item(id), sourcePlaylistId: 'p1', blockId: 'blk' }))],
	});

	it('plays the first item of the block on this device', async () => {
		store().applyState(queue('a'));
		player().playTrack(listTrack);
		api.playPlaylist.mockResolvedValue(withBlock('p-1', ['p-1', 'p-2']));

		await expect(store().playPlaylist('p1')).resolves.toBe('played');

		expect(api.playPlaylist).toHaveBeenCalledWith('p1', {});
		expect(mine().currentItemId).toBe('p-1');
		expect(player().queueItemId).toBe('p-1');
		expect(player().currentTrack?.title).toBe('Title p-1');
		expect(player().playbackState).toBe('loading');
	});

	it.each([
		['PLAYLIST_EMPTY', 409, 'Cette playlist est vide'],
		['PLAYLIST_ACCESS_DENIED', 403, "Vous n'avez pas accès à cette playlist"],
		['PLAYLIST_NOT_FOUND', 404, "Cette playlist n'existe plus"],
		['NETWORK_ERROR', undefined, 'Impossible de lire cette playlist'],
	])('toasts %s and leaves playback alone', async (code, status, message) => {
		store().applyState(queue('a'));
		player().playTrack(listTrack);
		api.playPlaylist.mockRejectedValue(new ApiError('failed', code, undefined, status));

		await expect(store().playPlaylist('p1')).resolves.toBe('error');

		expect(showError).toHaveBeenCalledWith(message);
		expect(mine().currentItemId).toBe('a');
		expect(player().currentTrack).toBe(listTrack);
	});

	it('is ignored while another step is pending', async () => {
		let resolve!: (value: QueueState) => void;
		api.playPlaylist.mockReturnValue(new Promise(r => (resolve = r)));

		const first = store().playPlaylist('p1');
		await expect(store().playPlaylist('p1')).resolves.toBe('ignored');
		await expect(store().next()).resolves.toBe('ignored');
		resolve(withBlock('p-1', ['p-1']));

		await expect(first).resolves.toBe('played');
		expect(api.playPlaylist).toHaveBeenCalledTimes(1);
		expect(api.next).not.toHaveBeenCalled();
	});

	it('tells whether this device plays an item of a playlist', () => {
		const state = withBlock('p-1', ['p-1', 'p-2']);
		expect(selectPlaysPlaylist(state, 'p-2', 'p1')).toBe(true);
		expect(selectPlaysPlaylist(state, 'p-1', 'other')).toBe(false);
		expect(selectPlaysPlaylist(state, 'x', 'p1')).toBe(false);
		expect(selectPlaysPlaylist(state, null, 'p1')).toBe(false);
		expect(selectPlaysPlaylist(state, 'gone', 'p1')).toBe(false);
	});
});

describe('queueStore versions (#285)', () => {
	it('accepts version 0 into an empty store', () => {
		store().applyState({ ownerId: 'owner', version: 0, currentItemId: null, items: [] });
		expect(store().loaded).toBe(true);
		expect(mine().version).toBe(0);
	});

	it('ignores a socket state older than the one it holds', () => {
		const older = queue('a');
		const newer = queue('b');
		store().applyState(newer);
		store().applyState(older);
		expect(mine().currentItemId).toBe('b');
		expect(mine().version).toBe(newer.version);
	});

	it('ignores the echo of a state it already holds', () => {
		const state = queue('a');
		store().applyState(state);
		const items = mine().items;
		store().applyState({ ...state, items: [] });
		expect(mine().items).toBe(items);
	});

	it('ignores a load answer older than a queue:updated received meanwhile', async () => {
		const answer = deferred<QueueState>();
		api.getQueue.mockReturnValueOnce(answer.promise);
		const stale = queue('a');
		const fresh = queue('b');
		const loading = store().load();
		store().applyState(fresh);
		answer.resolve(stale);
		await loading;
		expect(mine().currentItemId).toBe('b');
	});

	it('ends on the state holding both of two adds whose answers arrive in reverse', async () => {
		const first = deferred<QueueState>();
		const second = deferred<QueueState>();
		api.addItem.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
		const withA = queue(null, ['a']);
		const withAB = queue(null, ['a', 'b']);
		const addA = store().addItem(body('a'));
		const addB = store().addItem(body('b'));
		second.resolve(withAB);
		await addB;
		first.resolve(withA);
		await addA;
		expect(mine().items.map(i => i.id)).toEqual(['a', 'b']);
	});

	it('plays the item of a stale step answer but keeps the newer state', async () => {
		const answer = deferred<QueueStepResult>();
		api.next.mockReturnValueOnce(answer.promise);
		const stepped = queue('b');
		const newer = queue('c');
		const stepping = store().next();
		store().applyState(newer);
		answer.resolve({ ok: true, state: stepped });
		await stepping;
		expect(mine().currentItemId).toBe('c');
		expect(player().queueItemId).toBe('b');
	});

	it('reset forgets the version', () => {
		store().applyState(queue('a'));
		store().reset();
		expect(store().queues.owner).toBeUndefined();
		store().applyState({ ownerId: 'owner', version: 0, currentItemId: null, items: [] });
		expect(store().loaded).toBe(true);
	});
});

describe('queueStore owners (#297)', () => {
	const ownedBy = (ownerId: string, version: number, currentItemId: string | null): QueueState => ({
		ownerId,
		version,
		currentItemId,
		items: ['a', 'b', 'c'].map(item),
	});

	const goRemote = (ownerId: string, deviceId = 'tablet') =>
		useConnectStore.setState({ target: { kind: 'remote', ownerId, deviceId }, remoteStatus: null });

	it('compares versions per owner and never touches another owner', () => {
		goRemote('friend');
		store().applyState(ownedBy('owner', 5, 'a'));
		store().applyState(ownedBy('friend', 2, 'b'));
		store().applyState(ownedBy('owner', 4, 'c'));
		expect(store().queues.owner).toMatchObject({ version: 5, currentItemId: 'a' });
		expect(store().queues.friend).toMatchObject({ version: 2, currentItemId: 'b' });
	});

	it('ignores an owner that is neither me nor the remote owner', () => {
		store().applyState(ownedBy('stranger', 1, 'a'));
		expect(store().queues.stranger).toBeUndefined();
	});

	it('applies the new account state after a late state of the old one', () => {
		setAuthUser({ id: 'A' } as UserProfile);
		store().applyState(ownedBy('A', 56, 'a'));
		store().reset(); // logout of A
		setAuthUser({ id: 'B' } as UserProfile);
		store().applyState(ownedBy('A', 57, 'b')); // late answer
		store().applyState(ownedBy('B', 3, 'c'));
		expect(store().queues.A).toBeUndefined();
		expect(store().queues.B).toMatchObject({ version: 3, currentItemId: 'c' });
	});

	it("loads a friend's queue from their route, forgets it, and drops a late answer", async () => {
		goRemote('friend');
		api.getQueue.mockResolvedValue(ownedBy('friend', 1, 'a'));
		await store().load('friend');
		expect(api.getQueue).toHaveBeenCalledWith({ ownerId: 'friend' });
		expect(store().queues.friend).toBeDefined();

		useConnectStore.setState({ target: { kind: 'local' } });
		store().forget('friend');
		store().applyState(ownedBy('friend', 2, 'b'));
		expect(store().queues.friend).toBeUndefined();
	});

	it('loads my own queue from /api/queue', async () => {
		api.getQueue.mockResolvedValue(queue('a'));
		await store().load('owner');
		expect(api.getQueue).toHaveBeenCalledWith({});
	});

	it("steps a friend's queue on their device without playing on the phone", async () => {
		goRemote('friend');
		store().applyState(ownedBy('friend', 1, 'a'));
		api.next.mockResolvedValue({ ok: true, state: ownedBy('friend', 2, 'b') });

		await expect(store().next()).resolves.toBe('played');

		expect(api.next).toHaveBeenCalledWith({ ownerId: 'friend', deviceId: 'tablet' });
		expect(store().queues.friend.currentItemId).toBe('b');
		expect(player().currentTrack).toBeNull();
		expect(player().loadCounter).toBe(initialPlayer.loadCounter);
	});

	it('targets my own device through /api/queue with its deviceId', async () => {
		goRemote('owner');
		api.playItem.mockResolvedValue(queue('c'));
		await store().playItem('c');
		expect(api.playItem).toHaveBeenCalledWith('c', { ownerId: undefined, deviceId: 'tablet' });
		expect(player().currentTrack).toBeNull();
	});

	it('does not stop the phone at the end of a remote queue', async () => {
		goRemote('friend');
		const stop = jest.spyOn(player(), 'stop');
		api.next.mockResolvedValue({ ok: false, code: 'QUEUE_END' });
		await expect(store().next()).resolves.toBe('boundary');
		expect(stop).not.toHaveBeenCalled();
	});

	it.each([
		['DEVICE_OFFLINE', 409, "Cet appareil n'est plus en ligne"],
		['QUEUE_ACCESS_DENIED', 403, 'Vous ne pouvez plus contrôler cet appareil'],
	])('on %s toasts and goes back to local', async (code, status, message) => {
		goRemote('friend');
		api.next.mockRejectedValue(new ApiError('refused', code, undefined, status));

		await expect(store().next()).resolves.toBe('error');

		expect(showError).toHaveBeenCalledWith(message);
		expect(useConnectStore.getState().target).toEqual({ kind: 'local' });
	});

	it('goes back to local when a remote add is refused', async () => {
		goRemote('friend');
		api.addItem.mockRejectedValue(new ApiError('refused', 'QUEUE_ACCESS_DENIED', undefined, 403));
		await expect(store().addItem(body('n'))).resolves.toBe(false);
		expect(useConnectStore.getState().target).toEqual({ kind: 'local' });
	});

	it('marks a play-item current only when it is newer than the state held', () => {
		store().applyState(ownedBy('owner', 3, 'a'));
		store().setCurrentItem('owner', 'b', 3);
		expect(mine().currentItemId).toBe('a');
		store().setCurrentItem('owner', 'b', 4);
		expect(mine().currentItemId).toBe('b');
		// The queue:updated of that version still applies.
		store().applyState(ownedBy('owner', 4, 'c'));
		expect(mine().currentItemId).toBe('c');
	});

	describe('playListTrack', () => {
		const transfer = queueApi.transfer as jest.Mock;

		it('plays on the phone in local mode', async () => {
			await store().playListTrack(listTrack);
			expect(player().currentTrack).toBe(listTrack);
			expect(transfer).not.toHaveBeenCalled();
		});

		it('transfers the track to the remote device and stays silent', async () => {
			goRemote('friend');
			const queued = ownedBy('friend', 3, 'b');
			transfer.mockResolvedValue({ ownerId: 'friend', deviceId: 'tablet', queue: queued });

			await store().playListTrack(listTrack);

			expect(transfer).toHaveBeenCalledWith({
				targetUserId: 'friend',
				targetDeviceId: 'tablet',
				positionMs: 0,
				playing: {
					track: {
						trackUri: listTrack.permalink_url,
						title: 'Tapped',
						artist: 'x',
						album: undefined,
						albumArt: undefined,
						durationMs: 1000,
					},
				},
			});
			expect(store().queues.friend.currentItemId).toBe('b');
			expect(player().currentTrack).toBeNull();
		});

		it('goes back to local when the device is offline', async () => {
			goRemote('friend');
			transfer.mockRejectedValue(new ApiError('offline', 'DEVICE_OFFLINE', undefined, 409));
			await store().playListTrack(listTrack);
			expect(showError).toHaveBeenCalledWith("Cet appareil n'est plus en ligne");
			expect(useConnectStore.getState().target).toEqual({ kind: 'local' });
		});

		it('toasts another failure and stays remote', async () => {
			goRemote('friend');
			transfer.mockRejectedValue(new ApiError('down', 'NETWORK_ERROR'));
			await store().playListTrack(listTrack);
			expect(showError).toHaveBeenCalledWith('Impossible de lire ce titre');
			expect(useConnectStore.getState().target.kind).toBe('remote');
		});
	});
});
