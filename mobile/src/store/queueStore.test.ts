import {
	previousAction,
	selectHasNext,
	selectHasPrevious,
	useQueueStore,
} from '@/store/queueStore';
import { usePlayerStore } from '@/store/playerStore';
import { queueApi } from '@/services/queueApi';
import { ApiError } from '@/services/api';
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
	},
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
