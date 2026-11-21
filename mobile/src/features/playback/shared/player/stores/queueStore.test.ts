import { queueStore } from '@/features/playback/shared/player/stores/queueStore';
import { connectStore } from '@/features/playback/shared/player/stores/connectStore';
import { EMPTY_QUEUE } from '@/features/playback/shared/player/configs/playerConfig';
import { previousAction } from '@/features/playback/shared/player/lib/previousAction';
import {
	nextItem,
	selectHasNext,
	selectHasPrevious,
} from '@/features/playback/shared/player/lib/queueNavigation';
import { selectPlaysPlaylist } from '@/features/playback/shared/player/lib/queueSelectors';
import { createStore } from 'zustand';
import { registerAuthSession } from '@/shared/backend/lib/authSession';
import type { SessionView } from '@/shared/backend/types/sessionTypes';
import { deferred } from '@test-utils/deferred';
import { queueItem, queueItemBody, queueState } from '@test-utils/queueFixtures';
import type { UserProfile } from '@/shared/users/userTypes';
import { queueApi } from '@/features/playback/shared/player/lib/queueApi';
import { ApiError } from '@/shared/backend/lib/api';
import { showError, showInfo, showSuccess } from '@/shared/theme/lib/toast';
import { hapticSuccess } from '@/shared/theme/lib/haptics';
import type { QueueState, QueueStepResult } from '@/shared/playback/types/queueTypes';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';
import { logger } from '@/shared/logging/logger';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/shared/backend/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

jest.mock('@/features/playback/shared/player/lib/queueApi', () => ({
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

jest.mock('@/features/playback/shared/player/stores/playerStore', () => ({
	playerStore: { getState: () => mockPlayer },
}));

jest.mock('@/features/playback/shared/player/lib/getPlayerState', () => ({
	getPlayerState: () => mockPlayer,
}));

jest.mock('@/shared/theme/lib/haptics', () => ({ hapticSuccess: jest.fn() }));

jest.mock('@/shared/theme/lib/toast', () => ({
	showSuccess: jest.fn(),
	showError: jest.fn(),
	showInfo: jest.fn(),
}));

const api = queueApi as jest.Mocked<typeof queueApi>;

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

type MockPlayerState = {
	currentTrack: SoundCloudTrack | null;
	queueItemId: string | null;
	loadCounter: number;
	positionMs: number;
	playbackState: string;
	error: string | null;
	playTrack: (track: SoundCloudTrack, queueItemId?: string, startPositionMs?: number) => void;
	stop: () => void;
};

let mockPlayer: MockPlayerState;

function resetMockPlayer() {
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
}

resetMockPlayer();

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
function setAuthUser(user: UserProfile | null) {
	authSessionStore.setState({ user, isAuthenticated: user !== null });
}

function store() {
	return queueStore.getState();
}
function mine() {
	return store().queues.owner ?? EMPTY_QUEUE;
}

beforeEach(() => {
	jest.resetAllMocks();
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
	resetMockPlayer();
	setAuthUser({ id: 'owner' } as UserProfile);
	connectStore.setState({ target: { kind: 'local' }, remoteStatus: null });
	store().reset();
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('queueStore load and events', () => {
	it('holds the server queue after load', async () => {
		api.getQueue.mockResolvedValue(queueState('a'));
		await store().load();
		expect(mine().currentItemId).toBe('a');
		expect(mine().items.map(i => i.id)).toStrictEqual(['a', 'b', 'c']);
		expect(store().loaded).toBe(true);
	});

	it('keeps its last state when the load fails', async () => {
		store().applyState(queueState('b'));
		api.getQueue.mockRejectedValue(new ApiError('down', 'NETWORK_ERROR'));
		await store().load();
		expect(mine().currentItemId).toBe('b');
		expect(logger.error).toHaveBeenCalledWith('[queueStore] Load failed:', expect.any(ApiError));
	});

	it('replaces the store with a queue:updated payload without touching audio', () => {
		mockPlayer.playTrack(listTrack);
		const before = mockPlayer.loadCounter;
		store().applyState(queueState('c', ['a', 'c']));
		expect(mine().currentItemId).toBe('c');
		expect(mine().items.map(i => i.id)).toStrictEqual(['a', 'c']);
		expect(mockPlayer.loadCounter).toBe(before);
		expect(mockPlayer.currentTrack).toBe(listTrack);
	});

	it('reset empties the store', () => {
		store().applyState(queueState('a'));
		store().reset();
		expect(mine().items).toStrictEqual([]);
		expect(store().loaded).toBe(false);
	});
});

describe('queueStore next', () => {
	it('applies the new state and plays the new current item', async () => {
		store().applyState(queueState('a'));
		api.next.mockResolvedValue({ ok: true, state: queueState('b') });

		await expect(store().next()).resolves.toBe('played');

		expect(mine().currentItemId).toBe('b');
		expect(mockPlayer.queueItemId).toBe('b');
		expect(mockPlayer.currentTrack?.permalink_url).toBe('https://soundcloud.com/artist/b');
		expect(mockPlayer.playbackState).toBe('loading');
	});

	it('plays the next queue item after a list-tapped track', async () => {
		mockPlayer.playTrack(listTrack);
		api.next.mockResolvedValue({ ok: true, state: queueState('a') });

		await store().next();

		expect(mockPlayer.queueItemId).toBe('a');
		expect(mockPlayer.currentTrack?.title).toBe('Title a');
	});

	it('stops playback cleanly at QUEUE_END', async () => {
		mockPlayer.playTrack(listTrack);
		api.next.mockResolvedValue({ ok: false, code: 'QUEUE_END' });

		await expect(store().next()).resolves.toBe('boundary');

		expect(mockPlayer.playbackState).toBe('idle');
		expect(mockPlayer.currentTrack).toBeNull();
		expect(mockPlayer.error).toBeNull();
	});

	it('leaves playback unchanged on a network error', async () => {
		store().applyState(queueState('a'));
		mockPlayer.playTrack(listTrack);
		api.next.mockRejectedValue(new ApiError('offline', 'NETWORK_ERROR'));

		await expect(store().next()).resolves.toBe('error');

		expect(mockPlayer.currentTrack).toBe(listTrack);
		expect(mine().currentItemId).toBe('a');
	});

	it('does not override a track tapped while the request ran', async () => {
		let resolve!: (value: { ok: true; state: QueueState }) => void;
		api.next.mockReturnValue(new Promise(r => (resolve = r)));

		const pending = store().next();
		mockPlayer.playTrack(listTrack);
		resolve({ ok: true, state: queueState('b') });
		await pending;

		expect(mine().currentItemId).toBe('b');
		expect(mockPlayer.currentTrack).toBe(listTrack);
		expect(mockPlayer.queueItemId).toBeNull();
	});
});

describe('queueStore concurrent steps', () => {
	it('ignores a step while another is pending', async () => {
		let resolve!: (value: { ok: true; state: QueueState }) => void;
		api.next.mockReturnValue(new Promise(r => (resolve = r)));

		const first = store().next();
		const second = store().next();
		resolve({ ok: true, state: queueState('b') });

		await expect(second).resolves.toBe('ignored');
		await expect(first).resolves.toBe('played');
		expect(api.next).toHaveBeenCalledTimes(1);
		expect(mine().currentItemId).toBe('b');
		expect(mockPlayer.queueItemId).toBe('b');

		api.next.mockResolvedValue({ ok: true, state: queueState('c') });
		await expect(store().next()).resolves.toBe('played');
		expect(mockPlayer.queueItemId).toBe('c');
	});

	it('clears the pending flag after a failed step', async () => {
		api.next.mockRejectedValueOnce(new ApiError('offline', 'NETWORK_ERROR'));
		await expect(store().next()).resolves.toBe('error');
		api.next.mockResolvedValue({ ok: true, state: queueState('a') });
		await expect(store().next()).resolves.toBe('played');
	});
});

describe('queueStore previous', () => {
	it('plays the previous item', async () => {
		store().applyState(queueState('b'));
		api.previous.mockResolvedValue({ ok: true, state: queueState('a') });

		await expect(store().previous()).resolves.toBe('played');

		expect(mockPlayer.queueItemId).toBe('a');
	});

	it('does nothing at QUEUE_START', async () => {
		mockPlayer.playTrack(listTrack);
		api.previous.mockResolvedValue({ ok: false, code: 'QUEUE_START' });

		await expect(store().previous()).resolves.toBe('boundary');

		expect(mockPlayer.currentTrack).toBe(listTrack);
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
		expect(selectHasNext(queueState(null, []))).toBe(false);
		expect(selectHasNext(queueState(null))).toBe(true);
		expect(selectHasPrevious(queueState(null))).toBe(false);
		expect(selectHasNext(queueState('a'))).toBe(true);
		expect(selectHasPrevious(queueState('a'))).toBe(false);
		expect(selectHasNext(queueState('c'))).toBe(false);
		expect(selectHasPrevious(queueState('c'))).toBe(true);
	});

	it('picks the item after the current one, or the first with nothing current', () => {
		expect(nextItem(queueState(null))?.id).toBe('a');
		expect(nextItem(queueState('a'))?.id).toBe('b');
		expect(nextItem(queueState('c'))).toBeUndefined();
		expect(nextItem(queueState(null, []))).toBeUndefined();
	});

	it('a list tap plays at once and leaves the queue alone', () => {
		store().applyState(queueState('a'));
		mockPlayer.playTrack(listTrack);

		expect(mockPlayer.queueItemId).toBeNull();
		expect(mine().currentItemId).toBe('a');
		expect(api.next).not.toHaveBeenCalled();
		expect(api.playItem).not.toHaveBeenCalled();
	});

	it('stop clears the queue item being played', async () => {
		api.next.mockResolvedValue({ ok: true, state: queueState('a') });
		await store().next();
		mockPlayer.stop();
		expect(mockPlayer.queueItemId).toBeNull();
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
		store().applyState(queueState('a', ['a']));
		mockPlayer.playTrack(listTrack);
		const before = mockPlayer.loadCounter;
		api.addItem.mockResolvedValue(queueState('a', ['a', 'n']));

		await expect(store().addItem(body)).resolves.toBe(true);

		expect(api.addItem).toHaveBeenCalledWith(body, {});
		expect(mine().items.map(i => i.id)).toStrictEqual(['a', 'n']);
		expect(mine().currentItemId).toBe('a');
		expect(showSuccess).toHaveBeenCalledWith("Ajouté à la file d'attente");
		expect(hapticSuccess).toHaveBeenCalledTimes(1);
		expect(mockPlayer.loadCounter).toBe(before);
		expect(mockPlayer.currentTrack).toBe(listTrack);
		expect(mockPlayer.queueItemId).toBeNull();
	});

	it('keeps the state and toasts a French message on failure', async () => {
		store().applyState(queueState('a', ['a']));
		api.addItem.mockRejectedValue(new ApiError('Queue is full', 'QUEUE_FULL'));

		await expect(store().addItem(body)).resolves.toBe(false);

		expect(mine().items.map(i => i.id)).toStrictEqual(['a']);
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
		store().applyState(queueState('a', ['a', 'b']));
		api.addItem.mockResolvedValue(queueState('a', ['a', 'n', 'b']));

		await expect(store().playNext(body)).resolves.toBe(true);

		expect(api.addItem).toHaveBeenCalledWith({ ...body, next: true }, {});
		expect(mine().items.map(i => i.id)).toStrictEqual(['a', 'n', 'b']);
		expect(mine().currentItemId).toBe('a');
		expect(showSuccess).toHaveBeenCalledWith('Lira ensuite');
		expect(hapticSuccess).toHaveBeenCalledTimes(1);
	});

	it('keeps the state and toasts an error on failure', async () => {
		store().applyState(queueState('a', ['a']));
		api.addItem.mockRejectedValue(new ApiError('Queue is full', 'QUEUE_FULL'));

		await expect(store().playNext(body)).resolves.toBe(false);

		expect(mine().items.map(i => i.id)).toStrictEqual(['a']);
		expect(showError).toHaveBeenCalledWith("Impossible d'ajouter ce titre");
		expect(showSuccess).not.toHaveBeenCalled();
		expect(hapticSuccess).not.toHaveBeenCalled();
	});
});

describe('queueStore playItem', () => {
	it('makes the item current and plays it on this device', async () => {
		store().applyState(queueState('a'));
		api.playItem.mockResolvedValue(queueState('c'));

		await expect(store().playItem('c')).resolves.toBe('played');

		expect(api.playItem).toHaveBeenCalledWith('c', {});
		expect(mine().currentItemId).toBe('c');
		expect(mockPlayer.queueItemId).toBe('c');
		expect(mockPlayer.currentTrack?.title).toBe('Title c');
	});

	it('shows an error and leaves playback alone when the request fails', async () => {
		store().applyState(queueState('a'));
		mockPlayer.playTrack(listTrack);
		api.playItem.mockRejectedValue(new ApiError('gone', 'NOT_FOUND', undefined, 404));

		await expect(store().playItem('c')).resolves.toBe('error');

		expect(showError).toHaveBeenCalledWith('Impossible de lire ce titre');
		expect(mine().currentItemId).toBe('a');
		expect(mockPlayer.currentTrack).toBe(listTrack);
	});

	it('shares the step guard with next', async () => {
		let resolve!: (value: QueueState) => void;
		api.playItem.mockReturnValue(new Promise(r => (resolve = r)));

		const pending = store().playItem('b');
		await expect(store().next()).resolves.toBe('ignored');
		resolve(queueState('b'));
		await expect(pending).resolves.toBe('played');
		expect(api.next).not.toHaveBeenCalled();
	});
});

describe('queueStore removeItem', () => {
	it('removes an upcoming item without touching playback', async () => {
		store().applyState(queueState('a'));
		mockPlayer.playTrack(listTrack);
		const before = mockPlayer.loadCounter;
		api.removeItem.mockResolvedValue(queueState('a', ['a', 'c']));

		await expect(store().removeItem('b')).resolves.toBe(true);

		expect(api.removeItem).toHaveBeenCalledWith('b', {});
		expect(mine().items.map(i => i.id)).toStrictEqual(['a', 'c']);
		expect(mockPlayer.loadCounter).toBe(before);
	});

	it('plays the next item when the current one, playing here, is removed', async () => {
		store().applyState(queueState('a'));
		api.playItem.mockResolvedValue(queueState('a'));
		await store().playItem('a');
		api.removeItem.mockResolvedValue(queueState('b', ['b', 'c']));

		await expect(store().removeItem('a')).resolves.toBe(true);

		expect(mine().currentItemId).toBe('b');
		expect(mockPlayer.queueItemId).toBe('b');
		expect(mockPlayer.currentTrack?.title).toBe('Title b');
	});

	it('stops playback when the removed current item was the last', async () => {
		store().applyState(queueState('c', ['c']));
		api.playItem.mockResolvedValue(queueState('c', ['c']));
		await store().playItem('c');
		api.removeItem.mockResolvedValue(queueState(null, []));

		await expect(store().removeItem('c')).resolves.toBe(true);

		expect(mine().items).toStrictEqual([]);
		expect(mockPlayer.currentTrack).toBeNull();
		expect(mockPlayer.playbackState).toBe('idle');
	});

	it('leaves a list-tapped track playing when the current item is removed', async () => {
		store().applyState(queueState('a'));
		mockPlayer.playTrack(listTrack);
		const before = mockPlayer.loadCounter;
		api.removeItem.mockResolvedValue(queueState(null, []));

		await expect(store().removeItem('a')).resolves.toBe(true);

		expect(mine().items).toStrictEqual([]);
		expect(mockPlayer.currentTrack).toBe(listTrack);
		expect(mockPlayer.loadCounter).toBe(before);
	});

	it('tells the user when another step is still pending', async () => {
		store().applyState(queueState('a'));
		api.playItem.mockResolvedValue(queueState('a'));
		await store().playItem('a');
		let resolve!: (value: { ok: true; state: QueueState }) => void;
		api.next.mockReturnValue(new Promise(r => (resolve = r)));

		const pending = store().next();
		await expect(store().removeItem('a')).resolves.toBe(false);
		expect(showInfo).toHaveBeenCalledWith('Une action est déjà en cours');
		expect(api.removeItem).not.toHaveBeenCalled();
		resolve({ ok: true, state: queueState('b') });
		await pending;
	});

	it('shows an error and keeps the store when the request fails', async () => {
		store().applyState(queueState('a'));
		api.removeItem.mockRejectedValue(new ApiError('gone', 'NOT_FOUND', undefined, 404));

		await expect(store().removeItem('b')).resolves.toBe(false);
		await expect(store().removeItem('a')).resolves.toBe(false);

		expect(showError).toHaveBeenCalledTimes(2);
		expect(mine().items.map(i => i.id)).toStrictEqual(['a', 'b', 'c']);
	});
});

describe('queueStore moveItem', () => {
	it('applies the order the server returns', async () => {
		store().applyState(queueState('a'));
		api.moveItem.mockResolvedValue(queueState('a', ['a', 'c', 'b']));

		await expect(store().moveItem('c', null)).resolves.toBe(true);

		expect(api.moveItem).toHaveBeenCalledWith('c', null, {});
		expect(mine().items.map(i => i.id)).toStrictEqual(['a', 'c', 'b']);
	});

	it('shows an error and keeps the store order on a conflict', async () => {
		store().applyState(queueState('a'));
		api.moveItem.mockRejectedValue(new ApiError('conflict', 'CONFLICT', undefined, 409));

		await expect(store().moveItem('c', null)).resolves.toBe(false);

		expect(showError).toHaveBeenCalledWith('Impossible de déplacer ce titre');
		expect(mine().items.map(i => i.id)).toStrictEqual(['a', 'b', 'c']);
	});
});

describe('queueStore playPlaylist', () => {
	function withBlock(currentItemId: string | null, ids: string[]): QueueState {
		return {
			...queueState(currentItemId, []),
			items: [
				queueItem('x'),
				...ids.map(id => ({ ...queueItem(id), sourcePlaylistId: 'p1', blockId: 'blk' })),
			],
		};
	}

	it('plays the first item of the block on this device', async () => {
		store().applyState(queueState('a'));
		mockPlayer.playTrack(listTrack);
		api.playPlaylist.mockResolvedValue(withBlock('p-1', ['p-1', 'p-2']));

		await expect(store().playPlaylist('p1')).resolves.toBe('played');

		expect(api.playPlaylist).toHaveBeenCalledWith('p1', {}, undefined);
		expect(mine().currentItemId).toBe('p-1');
		expect(mockPlayer.queueItemId).toBe('p-1');
		expect(mockPlayer.currentTrack?.title).toBe('Title p-1');
		expect(mockPlayer.playbackState).toBe('loading');
	});

	it('plays the block from the chosen track', async () => {
		store().applyState(queueState('a'));
		api.playPlaylist.mockResolvedValue(withBlock('p-2', ['p-1', 'p-2']));

		await expect(store().playPlaylist('p1', 't2')).resolves.toBe('played');

		expect(api.playPlaylist).toHaveBeenCalledWith('p1', {}, 't2');
		expect(mine().currentItemId).toBe('p-2');
		expect(mockPlayer.queueItemId).toBe('p-2');
	});

	it.each([
		['PLAYLIST_EMPTY', 409, 'Aucun titre disponible dans cette playlist'],
		['TRACK_UNAVAILABLE', 409, "Ce titre n'est plus disponible"],
		['PLAYLIST_ACCESS_DENIED', 403, "Vous n'avez pas accès à cette playlist"],
		['PLAYLIST_NOT_FOUND', 404, "Cette playlist n'existe plus"],
		['NETWORK_ERROR', undefined, 'Impossible de lire cette playlist'],
	])('toasts %s and leaves playback alone', async (code, status, message) => {
		store().applyState(queueState('a'));
		mockPlayer.playTrack(listTrack);
		api.playPlaylist.mockRejectedValue(new ApiError('failed', code, undefined, status));

		await expect(store().playPlaylist('p1')).resolves.toBe('error');

		expect(showError).toHaveBeenCalledWith(message);
		expect(mine().currentItemId).toBe('a');
		expect(mockPlayer.currentTrack).toBe(listTrack);
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
		const older = queueState('a');
		const newer = queueState('b');
		store().applyState(newer);
		store().applyState(older);
		expect(mine().currentItemId).toBe('b');
		expect(mine().version).toBe(newer.version);
	});

	it('ignores the echo of a state it already holds', () => {
		const state = queueState('a');
		store().applyState(state);
		const items = mine().items;
		store().applyState({ ...state, items: [] });
		expect(mine().items).toBe(items);
	});

	it('ignores a load answer older than a queue:updated received meanwhile', async () => {
		const answer = deferred<QueueState>();
		api.getQueue.mockReturnValueOnce(answer.promise);
		const stale = queueState('a');
		const fresh = queueState('b');
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
		const withA = queueState(null, ['a']);
		const withAB = queueState(null, ['a', 'b']);
		const addA = store().addItem(queueItemBody('a'));
		const addB = store().addItem(queueItemBody('b'));
		second.resolve(withAB);
		await addB;
		first.resolve(withA);
		await addA;
		expect(mine().items.map(i => i.id)).toStrictEqual(['a', 'b']);
	});

	it('plays the item of a stale step answer but keeps the newer state', async () => {
		const answer = deferred<QueueStepResult>();
		api.next.mockReturnValueOnce(answer.promise);
		const stepped = queueState('b');
		const newer = queueState('c');
		const stepping = store().next();
		store().applyState(newer);
		answer.resolve({ ok: true, state: stepped });
		await stepping;
		expect(mine().currentItemId).toBe('c');
		expect(mockPlayer.queueItemId).toBe('b');
	});

	it('reset forgets the version', () => {
		store().applyState(queueState('a'));
		store().reset();
		expect(store().queues.owner).toBeUndefined();
		store().applyState({ ownerId: 'owner', version: 0, currentItemId: null, items: [] });
		expect(store().loaded).toBe(true);
	});
});

describe('queueStore owners (#297)', () => {
	function ownedBy(ownerId: string, version: number, currentItemId: string | null): QueueState {
		return {
			ownerId,
			version,
			currentItemId,
			items: ['a', 'b', 'c'].map(queueItem),
		};
	}

	function goRemote(ownerId: string, deviceId = 'tablet') {
		return connectStore.setState({
			target: { kind: 'remote', ownerId, deviceId },
			remoteStatus: null,
		});
	}

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
		store().reset();
		setAuthUser({ id: 'B' } as UserProfile);
		store().applyState(ownedBy('A', 57, 'b'));
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

		connectStore.setState({ target: { kind: 'local' } });
		store().forget('friend');
		store().applyState(ownedBy('friend', 2, 'b'));
		expect(store().queues.friend).toBeUndefined();
	});

	it('loads my own queue from /api/queue', async () => {
		api.getQueue.mockResolvedValue(queueState('a'));
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
		expect(mockPlayer.currentTrack).toBeNull();
		expect(mockPlayer.loadCounter).toBe(initialPlayer.loadCounter);
	});

	it('targets my own device through /api/queue with its deviceId', async () => {
		goRemote('owner');
		api.playItem.mockResolvedValue(queueState('c'));
		await store().playItem('c');
		expect(api.playItem).toHaveBeenCalledWith('c', { ownerId: undefined, deviceId: 'tablet' });
		expect(mockPlayer.currentTrack).toBeNull();
	});

	it('does not stop the phone at the end of a remote queue', async () => {
		goRemote('friend');
		const stop = jest.spyOn(mockPlayer, 'stop');
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
		expect(connectStore.getState().target).toStrictEqual({ kind: 'local' });
	});

	it('goes back to local when a remote add is refused', async () => {
		goRemote('friend');
		api.addItem.mockRejectedValue(new ApiError('refused', 'QUEUE_ACCESS_DENIED', undefined, 403));
		await expect(store().addItem(queueItemBody('n'))).resolves.toBe(false);
		expect(connectStore.getState().target).toStrictEqual({ kind: 'local' });
	});

	it('marks a play-item current only when it is newer than the state held', () => {
		store().applyState(ownedBy('owner', 3, 'a'));
		store().setCurrentItem('owner', 'b', 3);
		expect(mine().currentItemId).toBe('a');
		store().setCurrentItem('owner', 'b', 4);
		expect(mine().currentItemId).toBe('b');
		store().applyState(ownedBy('owner', 4, 'c'));
		expect(mine().currentItemId).toBe('c');
	});

	describe('playListTrack', () => {
		const transfer = queueApi.transfer as jest.Mock;

		it('plays on the phone in local mode', async () => {
			await store().playListTrack(listTrack);
			expect(mockPlayer.currentTrack).toBe(listTrack);
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
			expect(mockPlayer.currentTrack).toBeNull();
		});

		it('goes back to local when the device is offline', async () => {
			goRemote('friend');
			transfer.mockRejectedValue(new ApiError('offline', 'DEVICE_OFFLINE', undefined, 409));
			await store().playListTrack(listTrack);
			expect(showError).toHaveBeenCalledWith("Cet appareil n'est plus en ligne");
			expect(connectStore.getState().target).toStrictEqual({ kind: 'local' });
		});

		it('toasts another failure and stays remote', async () => {
			goRemote('friend');
			transfer.mockRejectedValue(new ApiError('down', 'NETWORK_ERROR'));
			await store().playListTrack(listTrack);
			expect(showError).toHaveBeenCalledWith(
				'Impossible de joindre le serveur. Vérifiez votre connexion.'
			);
			expect(connectStore.getState().target.kind).toBe('remote');
		});
	});
});
