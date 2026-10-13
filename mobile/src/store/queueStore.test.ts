import {
	previousAction,
	selectHasNext,
	selectHasPrevious,
	selectPlaysPlaylist,
	useQueueStore,
} from '@/store/queueStore';
import { usePlayerStore } from '@/store/playerStore';
import { queueApi } from '@/services/queueApi';
import { ApiError } from '@/services/api';
import { showError, showInfo, showSuccess } from '@utils/toast';
import type { QueueItem, QueueState } from '@/types/queue.types';
import type { SoundCloudTrack } from '@/types/soundcloud.types';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

jest.mock('@/services/queueApi', () => ({
	queueApi: {
		getQueue: jest.fn(),
		next: jest.fn(),
		previous: jest.fn(),
		playItem: jest.fn(),
		addItem: jest.fn(),
		moveItem: jest.fn(),
		removeItem: jest.fn(),
		playPlaylist: jest.fn(),
	},
}));

jest.mock('@utils/toast', () => ({
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

const queue = (currentItemId: string | null, ids = ['a', 'b', 'c']): QueueState => ({
	currentItemId,
	items: ids.map(item),
});

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

const initialPlayer = usePlayerStore.getState();
const store = () => useQueueStore.getState();
const player = () => usePlayerStore.getState();

beforeEach(() => {
	jest.resetAllMocks();
	jest.spyOn(console, 'log').mockImplementation(() => undefined);
	jest.spyOn(console, 'error').mockImplementation(() => undefined);
	usePlayerStore.setState(initialPlayer, true);
	store().reset();
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('queueStore load and events', () => {
	it('holds the server queue after load', async () => {
		api.getQueue.mockResolvedValue(queue('a'));
		await store().load();
		expect(store().currentItemId).toBe('a');
		expect(store().items.map(i => i.id)).toEqual(['a', 'b', 'c']);
		expect(store().loaded).toBe(true);
	});

	it('keeps its last state when the load fails', async () => {
		store().applyState(queue('b'));
		api.getQueue.mockRejectedValue(new ApiError('down', 'NETWORK_ERROR'));
		await store().load();
		expect(store().currentItemId).toBe('b');
		expect(console.error).toHaveBeenCalled();
	});

	it('replaces the store with a queue:updated payload without touching audio', () => {
		usePlayerStore.getState().playTrack(listTrack);
		const before = player().loadCounter;
		store().applyState(queue('c', ['a', 'c']));
		expect(store().currentItemId).toBe('c');
		expect(store().items.map(i => i.id)).toEqual(['a', 'c']);
		expect(player().loadCounter).toBe(before);
		expect(player().currentTrack).toBe(listTrack);
	});

	it('reset empties the store', () => {
		store().applyState(queue('a'));
		store().reset();
		expect(store().items).toEqual([]);
		expect(store().loaded).toBe(false);
	});
});

describe('queueStore next', () => {
	it('applies the new state and plays the new current item', async () => {
		store().applyState(queue('a'));
		api.next.mockResolvedValue({ ok: true, state: queue('b') });

		await expect(store().next()).resolves.toBe('played');

		expect(store().currentItemId).toBe('b');
		expect(player().queueItemId).toBe('b');
		expect(player().currentTrack?.permalink_url).toBe('https://soundcloud.com/artist/b');
		expect(player().playbackState).toBe('loading');
	});

	it('plays the next queue item after a list-tapped track', async () => {
		usePlayerStore.getState().playTrack(listTrack);
		api.next.mockResolvedValue({ ok: true, state: queue('a') });

		await store().next();

		expect(player().queueItemId).toBe('a');
		expect(player().currentTrack?.title).toBe('Title a');
	});

	it('stops playback cleanly at QUEUE_END', async () => {
		usePlayerStore.getState().playTrack(listTrack);
		api.next.mockResolvedValue({ ok: false, code: 'QUEUE_END' });

		await expect(store().next()).resolves.toBe('boundary');

		expect(player().playbackState).toBe('idle');
		expect(player().currentTrack).toBeNull();
		expect(player().error).toBeNull();
	});

	it('leaves playback unchanged on a network error', async () => {
		store().applyState(queue('a'));
		usePlayerStore.getState().playTrack(listTrack);
		api.next.mockRejectedValue(new ApiError('offline', 'NETWORK_ERROR'));

		await expect(store().next()).resolves.toBe('error');

		expect(player().currentTrack).toBe(listTrack);
		expect(store().currentItemId).toBe('a');
	});

	it('does not override a track tapped while the request ran', async () => {
		let resolve!: (value: { ok: true; state: QueueState }) => void;
		api.next.mockReturnValue(new Promise(r => (resolve = r)));

		const pending = store().next();
		usePlayerStore.getState().playTrack(listTrack);
		resolve({ ok: true, state: queue('b') });
		await pending;

		expect(store().currentItemId).toBe('b');
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
		expect(store().currentItemId).toBe('b');
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
		usePlayerStore.getState().playTrack(listTrack);
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

	it('a list tap plays at once and leaves the queue alone', () => {
		store().applyState(queue('a'));
		usePlayerStore.getState().playTrack(listTrack);

		expect(player().queueItemId).toBeNull();
		expect(store().currentItemId).toBe('a');
		expect(api.next).not.toHaveBeenCalled();
		expect(api.playItem).not.toHaveBeenCalled();
	});

	it('stop clears the queue item being played', async () => {
		api.next.mockResolvedValue({ ok: true, state: queue('a') });
		await store().next();
		usePlayerStore.getState().stop();
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
		usePlayerStore.getState().playTrack(listTrack);
		const before = player().loadCounter;
		api.addItem.mockResolvedValue(queue('a', ['a', 'n']));

		await expect(store().addItem(body)).resolves.toBe(true);

		expect(api.addItem).toHaveBeenCalledWith(body);
		expect(store().items.map(i => i.id)).toEqual(['a', 'n']);
		expect(store().currentItemId).toBe('a');
		expect(showSuccess).toHaveBeenCalledWith('Ajouté à la file de lecture');
		expect(player().loadCounter).toBe(before);
		expect(player().currentTrack).toBe(listTrack);
		expect(player().queueItemId).toBeNull();
	});

	it('keeps the state and toasts the API message on failure', async () => {
		store().applyState(queue('a', ['a']));
		api.addItem.mockRejectedValue(new ApiError('Queue is full', 'QUEUE_FULL'));

		await expect(store().addItem(body)).resolves.toBe(false);

		expect(store().items.map(i => i.id)).toEqual(['a']);
		expect(showError).toHaveBeenCalledWith('Queue is full');
		expect(showSuccess).not.toHaveBeenCalled();
	});
});

describe('queueStore playItem', () => {
	it('makes the item current and plays it on this device', async () => {
		store().applyState(queue('a'));
		api.playItem.mockResolvedValue(queue('c'));

		await expect(store().playItem('c')).resolves.toBe('played');

		expect(api.playItem).toHaveBeenCalledWith('c');
		expect(store().currentItemId).toBe('c');
		expect(player().queueItemId).toBe('c');
		expect(player().currentTrack?.title).toBe('Title c');
	});

	it('shows an error and leaves playback alone when the request fails', async () => {
		store().applyState(queue('a'));
		usePlayerStore.getState().playTrack(listTrack);
		api.playItem.mockRejectedValue(new ApiError('gone', 'NOT_FOUND', undefined, 404));

		await expect(store().playItem('c')).resolves.toBe('error');

		expect(showError).toHaveBeenCalled();
		expect(store().currentItemId).toBe('a');
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
		usePlayerStore.getState().playTrack(listTrack);
		const before = player().loadCounter;
		api.removeItem.mockResolvedValue(queue('a', ['a', 'c']));

		await expect(store().removeItem('b')).resolves.toBe(true);

		expect(api.removeItem).toHaveBeenCalledWith('b');
		expect(store().items.map(i => i.id)).toEqual(['a', 'c']);
		expect(player().loadCounter).toBe(before);
	});

	it('plays the next item when the current one, playing here, is removed', async () => {
		store().applyState(queue('a'));
		api.playItem.mockResolvedValue(queue('a'));
		await store().playItem('a');
		api.removeItem.mockResolvedValue(queue('b', ['b', 'c']));

		await expect(store().removeItem('a')).resolves.toBe(true);

		expect(store().currentItemId).toBe('b');
		expect(player().queueItemId).toBe('b');
		expect(player().currentTrack?.title).toBe('Title b');
	});

	it('stops playback when the removed current item was the last', async () => {
		store().applyState(queue('c', ['c']));
		api.playItem.mockResolvedValue(queue('c', ['c']));
		await store().playItem('c');
		api.removeItem.mockResolvedValue(queue(null, []));

		await expect(store().removeItem('c')).resolves.toBe(true);

		expect(store().items).toEqual([]);
		expect(player().currentTrack).toBeNull();
		expect(player().playbackState).toBe('idle');
	});

	it('leaves a list-tapped track playing when the current item is removed', async () => {
		store().applyState(queue('a'));
		usePlayerStore.getState().playTrack(listTrack);
		const before = player().loadCounter;
		api.removeItem.mockResolvedValue(queue(null, []));

		await expect(store().removeItem('a')).resolves.toBe(true);

		expect(store().items).toEqual([]);
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
		expect(store().items.map(i => i.id)).toEqual(['a', 'b', 'c']);
	});
});

describe('queueStore moveItem', () => {
	it('applies the order the server returns', async () => {
		store().applyState(queue('a'));
		api.moveItem.mockResolvedValue(queue('a', ['a', 'c', 'b']));

		await expect(store().moveItem('c', null)).resolves.toBe(true);

		expect(api.moveItem).toHaveBeenCalledWith('c', null);
		expect(store().items.map(i => i.id)).toEqual(['a', 'c', 'b']);
	});

	it('shows an error and keeps the store order on a conflict', async () => {
		store().applyState(queue('a'));
		api.moveItem.mockRejectedValue(new ApiError('conflict', 'CONFLICT', undefined, 409));

		await expect(store().moveItem('c', null)).resolves.toBe(false);

		expect(showError).toHaveBeenCalled();
		expect(store().items.map(i => i.id)).toEqual(['a', 'b', 'c']);
	});
});

describe('queueStore playPlaylist', () => {
	/** `ids` queued from playlist `p1`, after a list item `x`. */
	const withBlock = (currentItemId: string | null, ids: string[]): QueueState => ({
		currentItemId,
		items: [item('x'), ...ids.map(id => ({ ...item(id), sourcePlaylistId: 'p1', blockId: 'blk' }))],
	});

	it('plays the first item of the block on this device', async () => {
		store().applyState(queue('a'));
		usePlayerStore.getState().playTrack(listTrack);
		api.playPlaylist.mockResolvedValue(withBlock('p-1', ['p-1', 'p-2']));

		await expect(store().playPlaylist('p1')).resolves.toBe('played');

		expect(api.playPlaylist).toHaveBeenCalledWith('p1');
		expect(store().currentItemId).toBe('p-1');
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
		usePlayerStore.getState().playTrack(listTrack);
		api.playPlaylist.mockRejectedValue(new ApiError('failed', code, undefined, status));

		await expect(store().playPlaylist('p1')).resolves.toBe('error');

		expect(showError).toHaveBeenCalledWith(message);
		expect(store().currentItemId).toBe('a');
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
