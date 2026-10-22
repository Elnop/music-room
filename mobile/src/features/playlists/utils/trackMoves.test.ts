import { QueryObserver, type QueryClient } from '@tanstack/react-query';
import { createQueryClient } from '@/shared/query/queryClient';
import { queryKeys } from '@/shared/query/keys';
import { ApiError } from '@/shared/services/api';
import * as playlistApi from '@/features/playlists/services/playlistApi';
import * as tracksApi from '@/features/playlists/services/tracksApi';
import { usePendingMovesStore } from '@/features/playlists/stores/pendingMovesStore';
import type { MoveTrackResult, PlaylistWithTracks } from '@/features/playlists/types';
import { deferred } from '@/test/deferred';
import { playlistTrack } from '@/test/playlistFixtures';
import { loadPlaylist } from './playlistCache';
import { addTrack, removeTrack } from './trackEdits';
import { moveTrack } from './trackMoves';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/services/deviceService', () => ({ getAppVersion: () => '1.2.3' }));

jest.mock('@/features/playlists/services/tracksApi', () => ({
	addTrack: jest.fn(),
	removeTrack: jest.fn(),
	moveTrack: jest.fn(),
}));
jest.mock('@/features/playlists/services/playlistApi', () => ({ fetchPlaylistById: jest.fn() }));

const api = jest.mocked(tracksApi);
const fetchPlaylist = jest.mocked(playlistApi.fetchPlaylistById);
const key = queryKeys.playlists.detail('p');

const start = (tracksVersion = 10): PlaylistWithTracks =>
	({
		id: 'p',
		name: 'Mix',
		tracksVersion,
		tracks: [playlistTrack('A', 'a'), playlistTrack('B', 'h'), playlistTrack('C', 'p')],
	}) as PlaylistWithTracks;

const moved = (trackId: string, rank: string, tracksVersion: number): MoveTrackResult => ({
	trackId,
	rank,
	tracksVersion,
	rebalanced: false,
});

let client: QueryClient;
let unsubscribe: () => void;

const shown = () => client.getQueryData<PlaylistWithTracks>(key)!;
const order = () => shown().tracks.map(t => t.id);
const pending = () => usePendingMovesStore.getState().count;

/** A screen shows the playlist: an enabled observer, as usePlaylistDetail. */
function open() {
	const observer = new QueryObserver(client, {
		queryKey: key,
		queryFn: () => loadPlaylist(client, 'p'),
		staleTime: Infinity,
		retry: false,
	});
	unsubscribe = observer.subscribe(() => undefined);
}

beforeEach(() => {
	jest.resetAllMocks();
	client = createQueryClient();
	client.setQueryData(key, start());
	open();
});

afterEach(() => {
	unsubscribe();
	client.clear();
});

describe('loadPlaylist', () => {
	it('sorts the fetched tracks by rank', async () => {
		client.clear();
		fetchPlaylist.mockResolvedValue({
			...start(),
			tracks: [playlistTrack('C', 'p'), playlistTrack('A', 'a')],
		});
		const playlist = await loadPlaylist(client, 'p');
		expect(playlist.tracks.map(t => t.id)).toEqual(['A', 'C']);
	});

	it('keeps a newer track list applied while the request was in flight', async () => {
		fetchPlaylist.mockResolvedValue(start(9));
		const playlist = await loadPlaylist(client, 'p');
		expect(playlist.tracksVersion).toBe(10);
	});
});

describe('add and remove', () => {
	it('adds the returned track at its rank and takes the version', async () => {
		api.addTrack.mockResolvedValue({
			track: playlistTrack('D', 'w'),
			tracksVersion: 11,
			rebalanced: false,
		});
		await addTrack(client, 'p', { trackUri: 'D', title: 'D', artist: 'A', durationMs: 1 });
		expect(order()).toEqual(['A', 'B', 'C', 'D']);
		expect(shown().tracksVersion).toBe(11);
		expect(fetchPlaylist).not.toHaveBeenCalled();
	});

	it('reloads after an add that rebalanced the playlist', async () => {
		api.addTrack.mockResolvedValue({
			track: playlistTrack('D', 'w'),
			tracksVersion: 11,
			rebalanced: true,
		});
		fetchPlaylist.mockResolvedValue(start(11));
		await addTrack(client, 'p', { trackUri: 'D', title: 'D', artist: 'A', durationMs: 1 });
		expect(fetchPlaylist).toHaveBeenCalledWith('p');
	});

	it('removes a track at once and only advances the version on the answer', async () => {
		const answer = deferred<{ tracksVersion: number }>();
		api.removeTrack.mockReturnValue(answer.promise);
		const removing = removeTrack(client, 'p', 'B');
		expect(order()).toEqual(['A', 'C']);
		answer.resolve({ tracksVersion: 11 });
		await removing;
		expect(order()).toEqual(['A', 'C']);
		expect(shown().tracksVersion).toBe(11);
		expect(fetchPlaylist).not.toHaveBeenCalled();
	});

	it('restores the server list when a remove fails', async () => {
		api.removeTrack.mockRejectedValue(new ApiError('nope', 'TRACK_NOT_IN_PLAYLIST'));
		fetchPlaylist.mockResolvedValue({
			...start(),
			tracks: [playlistTrack('C', 'p'), playlistTrack('B', 'h'), playlistTrack('A', 'a')],
		});
		await expect(removeTrack(client, 'p', 'B')).rejects.toThrow('nope');
		expect(order()).toEqual(['A', 'B', 'C']);
	});

	it('does not reload a playlist left before a remove fails', async () => {
		unsubscribe();
		api.removeTrack.mockRejectedValue(new Error('nope'));
		await expect(removeTrack(client, 'p', 'B')).rejects.toThrow('nope');
		expect(fetchPlaylist).not.toHaveBeenCalled();
		open();
	});
});

describe('moveTrack', () => {
	it('sends the displayed version and applies the answer', async () => {
		api.moveTrack.mockResolvedValue(moved('C', 'c', 11));
		await expect(moveTrack(client, 'p', 'C', 'a')).resolves.toBe('moved');
		expect(api.moveTrack).toHaveBeenCalledWith('p', 'C', 'a', 10);
		expect(order()).toEqual(['A', 'C', 'B']);
		expect(pending()).toBe(0);
	});

	it('sends two quick moves one after the other with the returned version', async () => {
		const first = deferred<MoveTrackResult>();
		api.moveTrack.mockReturnValueOnce(first.promise).mockResolvedValueOnce(moved('B', '0', 12));
		const moves = Promise.all([
			moveTrack(client, 'p', 'C', 'a'),
			moveTrack(client, 'p', 'B', null),
		]);
		await Promise.resolve();
		expect(api.moveTrack).toHaveBeenCalledTimes(1);
		expect(pending()).toBe(2);

		first.resolve(moved('C', 'c', 11));
		await moves;
		expect(api.moveTrack).toHaveBeenNthCalledWith(2, 'p', 'B', null, 11);
		expect(order()).toEqual(['B', 'A', 'C']);
		expect(pending()).toBe(0);
	});

	it('reloads when another change landed before its answer', async () => {
		api.moveTrack.mockResolvedValue(moved('C', 'c', 12));
		fetchPlaylist.mockResolvedValue(start(12));
		await moveTrack(client, 'p', 'C', 'a');
		expect(fetchPlaylist).toHaveBeenCalledWith('p');
	});

	it.each(['TRACK_MOVED_CONCURRENTLY', 'TRACK_NOT_IN_PLAYLIST', 'PLAYLIST_REBALANCED'])(
		'reloads and rethrows on %s',
		async code => {
			api.moveTrack.mockRejectedValue(new ApiError('conflict', code, undefined, 409));
			fetchPlaylist.mockResolvedValue(start(13));
			await expect(moveTrack(client, 'p', 'C', 'a')).rejects.toMatchObject({ code });
			expect(shown().tracksVersion).toBe(13);
			expect(pending()).toBe(0);
		}
	);

	it('does not reload on another error and keeps the order', async () => {
		api.moveTrack.mockRejectedValue(new ApiError('Network', 'NETWORK_ERROR'));
		await expect(moveTrack(client, 'p', 'C', 'a')).rejects.toThrow('Network');
		expect(fetchPlaylist).not.toHaveBeenCalled();
		expect(order()).toEqual(['A', 'B', 'C']);
	});

	it('sends the next move after a refused one, with the reloaded version', async () => {
		api.moveTrack
			.mockRejectedValueOnce(new ApiError('conflict', 'TRACK_MOVED_CONCURRENTLY'))
			.mockResolvedValueOnce(moved('B', '0', 14));
		fetchPlaylist.mockResolvedValue(start(13));
		const results = await Promise.allSettled([
			moveTrack(client, 'p', 'C', 'a'),
			moveTrack(client, 'p', 'B', null),
		]);
		expect(results.map(r => r.status)).toEqual(['rejected', 'fulfilled']);
		expect(api.moveTrack).toHaveBeenNthCalledWith(2, 'p', 'B', null, 13);
		expect(shown().tracksVersion).toBe(14);
	});

	it('skips a queued move once the playlist is left, and frees the drag', async () => {
		const first = deferred<MoveTrackResult>();
		api.moveTrack.mockReturnValueOnce(first.promise);
		const moves = Promise.all([
			moveTrack(client, 'p', 'C', 'a'),
			moveTrack(client, 'p', 'B', null),
		]);
		await Promise.resolve();
		unsubscribe();
		first.resolve(moved('C', 'c', 11));
		await expect(moves).resolves.toEqual(['moved', 'skipped']);
		expect(api.moveTrack).toHaveBeenCalledTimes(1);
		expect(pending()).toBe(0);
		open();
	});

	it('does not reload for a conflict on a playlist left meanwhile', async () => {
		const answer = deferred<never>();
		api.moveTrack.mockReturnValue(answer.promise);
		const moving = moveTrack(client, 'p', 'C', 'a');
		await Promise.resolve();
		unsubscribe();
		answer.resolve(Promise.reject(new ApiError('conflict', 'TRACK_MOVED_CONCURRENTLY')) as never);
		await expect(moving).rejects.toMatchObject({ code: 'TRACK_MOVED_CONCURRENTLY' });
		expect(fetchPlaylist).not.toHaveBeenCalled();
		open();
	});
});
