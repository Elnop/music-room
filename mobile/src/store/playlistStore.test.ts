import { CONFLICT_MESSAGE, usePlaylistStore } from '@/store/playlistStore';
import { playlistApi } from '@api/playlistApi';
import { ApiError } from '@/services/api';
import { deferred } from '@/test/deferred';
import type { Playlist, PlaylistUpdatedEvent, PlaylistWithTracks } from '@/types/playlist.types';
import type { Track, TrackInPlaylist } from '@/types/track.types';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

jest.mock('@api/playlistApi', () => ({
	playlistApi: {
		fetchPlaylists: jest.fn(),
		fetchPlaylistById: jest.fn(),
		createPlaylist: jest.fn(),
		updatePlaylist: jest.fn(),
		deletePlaylist: jest.fn(),
		addTrack: jest.fn(),
		removeTrack: jest.fn(),
		moveTrack: jest.fn(),
	},
}));

const api = playlistApi as jest.Mocked<typeof playlistApi>;

const track = (id: string, rank: string) =>
	({
		id,
		rank,
		addedBy: null,
		addedAt: '',
		title: id,
		artist: 'A',
		trackUri: id,
		durationMs: 1,
	}) as TrackInPlaylist;

const start = (): PlaylistWithTracks =>
	({
		id: 'p',
		name: 'Mix',
		tracksVersion: 10,
		tracks: [track('A', 'a'), track('B', 'h'), track('C', 'p')],
	}) as PlaylistWithTracks;

const summary = (id: string, name = id) => ({ id, name }) as Playlist;

const state = () => usePlaylistStore.getState();
const order = () => state().currentPlaylist!.tracks.map(t => t.id);

beforeEach(() => {
	jest.resetAllMocks();
	jest.spyOn(console, 'log').mockImplementation(() => undefined);
	usePlaylistStore.setState({
		playlists: [],
		currentPlaylist: start(),
		playlistsCache: new Map([['p', start()]]),
		isLoading: false,
		isRefreshing: false,
		error: null,
		pendingMoves: 0,
		conflictMessage: null,
	});
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('loading', () => {
	it('fetches the playlist list', async () => {
		api.fetchPlaylists.mockResolvedValue([summary('p'), summary('q')]);
		await state().fetchPlaylists('user-1');
		expect(state().playlists.map(p => p.id)).toEqual(['p', 'q']);
		expect(state().isLoading).toBe(false);
	});

	it('stores the list error and rethrows', async () => {
		api.fetchPlaylists.mockRejectedValue(new Error('offline'));
		await expect(state().fetchPlaylists('user-1')).rejects.toThrow('offline');
		expect(state().error).toBe('offline');
	});

	it('fetches a playlist sorted by rank and caches it', async () => {
		usePlaylistStore.setState({ currentPlaylist: null, playlistsCache: new Map() });
		api.fetchPlaylistById.mockResolvedValue({
			...start(),
			tracks: [track('C', 'p'), track('A', 'a'), track('B', 'h')],
		});

		await state().fetchPlaylistById('p');

		expect(order()).toEqual(['A', 'B', 'C']);
		expect(state().playlistsCache.get('p')!.tracksVersion).toBe(10);
		expect(state().isLoading).toBe(false);
	});

	it('shows the cached playlist while it refreshes', async () => {
		usePlaylistStore.setState({ currentPlaylist: null });
		const answer = deferred<PlaylistWithTracks>();
		api.fetchPlaylistById.mockReturnValue(answer.promise);

		const loading = state().fetchPlaylistById('p');
		expect(state().currentPlaylist!.id).toBe('p');
		expect(state().isRefreshing).toBe(true);

		answer.resolve({ ...start(), tracksVersion: 11 });
		await loading;
		expect(state().currentPlaylist!.tracksVersion).toBe(11);
	});

	it('keeps a newer order applied while the fetch was in flight', async () => {
		const answer = deferred<PlaylistWithTracks>();
		api.fetchPlaylistById.mockReturnValue(answer.promise);

		const loading = state().fetchPlaylistById('p');
		state().applyPlaylistEvent({
			playlistId: 'p',
			tracksVersion: 11,
			rebalanced: false,
			event: 'track_removed',
			trackId: 'A',
		});
		answer.resolve(start());
		await loading;

		expect(state().currentPlaylist!.tracksVersion).toBe(11);
		expect(order()).toEqual(['B', 'C']);
	});
});

describe('playlist CRUD', () => {
	it('creates a playlist at the top of the list', async () => {
		usePlaylistStore.setState({ playlists: [summary('old')] });
		api.createPlaylist.mockResolvedValue(summary('new'));
		await state().createPlaylist('user-1', { name: 'new' } as never);
		expect(state().playlists.map(p => p.id)).toEqual(['new', 'old']);
	});

	it('updates the list entry and the open playlist', async () => {
		usePlaylistStore.setState({ playlists: [summary('p', 'Mix')] });
		api.updatePlaylist.mockResolvedValue({ ...summary('p', 'Renamed'), collaboratorIds: [] });
		await state().updatePlaylist('p', { name: 'Renamed' });
		expect(state().playlists[0].name).toBe('Renamed');
		expect(state().currentPlaylist!.name).toBe('Renamed');
		expect(state().currentPlaylist!.tracks).toHaveLength(3);
		expect(state().playlistsCache.get('p')!.name).toBe('Renamed');
	});

	it('deletes a playlist from the list, the cache and the screen', async () => {
		usePlaylistStore.setState({ playlists: [summary('p'), summary('q')] });
		api.deletePlaylist.mockResolvedValue(undefined);
		await state().deletePlaylist('p');
		expect(state().playlists.map(p => p.id)).toEqual(['q']);
		expect(state().currentPlaylist).toBeNull();
		expect(state().playlistsCache.has('p')).toBe(false);
	});

	it('stores a CRUD error and rethrows', async () => {
		api.deletePlaylist.mockRejectedValue(new Error('forbidden'));
		await expect(state().deletePlaylist('p')).rejects.toThrow('forbidden');
		expect(state().error).toBe('forbidden');
		expect(state().currentPlaylist).not.toBeNull();
	});
});

describe('add and remove', () => {
	it('adds the returned track at its rank and takes the version', async () => {
		api.addTrack.mockResolvedValue({
			track: track('D', 'w'),
			tracksVersion: 11,
			rebalanced: false,
		});
		await state().addTrack('p', { id: 'D' } as Track);
		expect(order()).toEqual(['A', 'B', 'C', 'D']);
		expect(state().currentPlaylist!.tracksVersion).toBe(11);
		expect(api.fetchPlaylistById).not.toHaveBeenCalled();
	});

	it('reloads after an add that rebalanced the playlist', async () => {
		api.addTrack.mockResolvedValue({ track: track('D', 'w'), tracksVersion: 11, rebalanced: true });
		api.fetchPlaylistById.mockResolvedValue({ ...start(), tracksVersion: 11 });
		await state().addTrack('p', { id: 'D' } as Track);
		expect(api.fetchPlaylistById).toHaveBeenCalledWith('p');
	});

	it('removes a track at once and only advances the version on the answer', async () => {
		const answer = deferred<{ tracksVersion: number }>();
		api.removeTrack.mockReturnValue(answer.promise);

		const removing = state().removeTrack('p', 'B');
		expect(order()).toEqual(['A', 'C']);
		answer.resolve({ tracksVersion: 11 });
		await removing;

		expect(order()).toEqual(['A', 'C']);
		expect(state().currentPlaylist!.tracksVersion).toBe(11);
		expect(api.fetchPlaylistById).not.toHaveBeenCalled();
	});

	it('ignores the echo of its own remove', async () => {
		api.removeTrack.mockResolvedValue({ tracksVersion: 11 });
		await state().removeTrack('p', 'B');
		const echo: PlaylistUpdatedEvent = {
			playlistId: 'p',
			tracksVersion: 11,
			rebalanced: false,
			event: 'track_removed',
			trackId: 'B',
		};
		expect(state().applyPlaylistEvent(echo)).toBe('ignored');
	});

	it('restores the server list when a remove fails', async () => {
		api.removeTrack.mockRejectedValue(new ApiError('nope', 'TRACK_NOT_IN_PLAYLIST'));
		api.fetchPlaylistById.mockResolvedValue(start());
		api.fetchPlaylistById.mockResolvedValue({
			...start(),
			tracks: [track('C', 'p'), track('B', 'h'), track('A', 'a')],
		});
		await expect(state().removeTrack('p', 'B')).rejects.toThrow('nope');
		expect(order()).toEqual(['A', 'B', 'C']);
		expect(state().error).toBe('nope');
	});

	it('does not open the playlist again when a remove fails after leaving it', async () => {
		const answer = deferred<{ tracksVersion: number }>();
		api.removeTrack.mockReturnValue(answer.promise);
		const removing = state().removeTrack('p', 'B');
		state().clearCurrentPlaylist();
		answer.resolve(Promise.reject(new Error('nope')) as never);
		await expect(removing).rejects.toThrow('nope');
		expect(api.fetchPlaylistById).not.toHaveBeenCalled();
		expect(state().currentPlaylist).toBeNull();
	});
});

describe('playlistStore.moveTrack', () => {
	it('sends the displayed version and applies the answer', async () => {
		api.moveTrack.mockResolvedValue({
			trackId: 'C',
			rank: 'c',
			tracksVersion: 11,
			rebalanced: false,
		});
		await state().moveTrack('p', 'C', 'a');
		expect(api.moveTrack).toHaveBeenCalledWith('p', 'C', 'a', 10);
		expect(order()).toEqual(['A', 'C', 'B']);
		expect(state().currentPlaylist!.tracksVersion).toBe(11);
		expect(state().pendingMoves).toBe(0);
	});

	it('sends two quick moves one after the other with the returned version', async () => {
		const first = deferred<{
			trackId: string;
			rank: string;
			tracksVersion: number;
			rebalanced: boolean;
		}>();
		api.moveTrack
			.mockReturnValueOnce(first.promise)
			.mockResolvedValueOnce({ trackId: 'B', rank: '0', tracksVersion: 12, rebalanced: false });

		const moves = Promise.all([
			state().moveTrack('p', 'C', 'a'),
			state().moveTrack('p', 'B', null),
		]);
		await Promise.resolve();
		expect(api.moveTrack).toHaveBeenCalledTimes(1);
		expect(state().pendingMoves).toBe(2);

		first.resolve({ trackId: 'C', rank: 'c', tracksVersion: 11, rebalanced: false });
		await moves;

		expect(api.moveTrack).toHaveBeenNthCalledWith(1, 'p', 'C', 'a', 10);
		expect(api.moveTrack).toHaveBeenNthCalledWith(2, 'p', 'B', null, 11);
		expect(state().currentPlaylist!.tracksVersion).toBe(12);
		expect(order()).toEqual(['B', 'A', 'C']);
		expect(state().pendingMoves).toBe(0);
	});

	it('ignores the echo of its own move', async () => {
		api.moveTrack.mockResolvedValue({
			trackId: 'C',
			rank: 'c',
			tracksVersion: 11,
			rebalanced: false,
		});
		await state().moveTrack('p', 'C', 'a');
		expect(
			state().applyPlaylistEvent({
				playlistId: 'p',
				tracksVersion: 11,
				rebalanced: false,
				event: 'track_moved',
				trackId: 'C',
				rank: 'c',
			})
		).toBe('ignored');
		expect(order()).toEqual(['A', 'C', 'B']);
	});

	it('reloads when another change landed before its answer', async () => {
		api.moveTrack.mockResolvedValue({
			trackId: 'C',
			rank: 'c',
			tracksVersion: 12,
			rebalanced: false,
		});
		api.fetchPlaylistById.mockResolvedValue({ ...start(), tracksVersion: 12 });
		await state().moveTrack('p', 'C', 'a');
		expect(api.fetchPlaylistById).toHaveBeenCalledWith('p');
		expect(state().conflictMessage).toBeNull();
	});

	it.each(['TRACK_MOVED_CONCURRENTLY', 'TRACK_NOT_IN_PLAYLIST', 'PLAYLIST_REBALANCED'])(
		'reloads, sets the message and rethrows on %s',
		async code => {
			api.moveTrack.mockRejectedValue(new ApiError('conflict', code, undefined, 409));
			api.fetchPlaylistById.mockResolvedValue({ ...start(), tracksVersion: 13 });

			await expect(state().moveTrack('p', 'C', 'a')).rejects.toMatchObject({ code });

			expect(api.fetchPlaylistById).toHaveBeenCalledWith('p');
			expect(state().currentPlaylist!.tracksVersion).toBe(13);
			expect(state().conflictMessage).toBe(CONFLICT_MESSAGE);
			expect(state().pendingMoves).toBe(0);
			state().clearConflictMessage();
			expect(state().conflictMessage).toBeNull();
		}
	);

	it('does not reload on another error and keeps the order', async () => {
		api.moveTrack.mockRejectedValue(new ApiError('Network', 'NETWORK_ERROR'));
		await expect(state().moveTrack('p', 'C', 'a')).rejects.toThrow('Network');
		expect(api.fetchPlaylistById).not.toHaveBeenCalled();
		expect(state().conflictMessage).toBeNull();
		expect(state().error).toBe('Network');
		expect(order()).toEqual(['A', 'B', 'C']);
	});

	it('sends the next move after a refused one, with the reloaded version', async () => {
		api.moveTrack
			.mockRejectedValueOnce(new ApiError('conflict', 'TRACK_MOVED_CONCURRENTLY'))
			.mockResolvedValueOnce({ trackId: 'B', rank: '0', tracksVersion: 14, rebalanced: false });
		api.fetchPlaylistById.mockResolvedValue({ ...start(), tracksVersion: 13 });

		const results = await Promise.allSettled([
			state().moveTrack('p', 'C', 'a'),
			state().moveTrack('p', 'B', null),
		]);

		expect(results.map(r => r.status)).toEqual(['rejected', 'fulfilled']);
		expect(api.moveTrack).toHaveBeenNthCalledWith(2, 'p', 'B', null, 13);
		expect(state().currentPlaylist!.tracksVersion).toBe(14);
	});
});

describe('playlistStore.moveTrack after leaving the playlist', () => {
	it('skips a queued move and frees the buttons', async () => {
		const first = deferred<{
			trackId: string;
			rank: string;
			tracksVersion: number;
			rebalanced: boolean;
		}>();
		api.moveTrack.mockReturnValueOnce(first.promise);

		const moves = Promise.all([
			state().moveTrack('p', 'C', 'a'),
			state().moveTrack('p', 'B', null),
		]);
		await Promise.resolve();
		state().clearCurrentPlaylist();
		first.resolve({ trackId: 'C', rank: 'c', tracksVersion: 11, rebalanced: false });

		await expect(moves).resolves.toEqual(['moved', 'skipped']);
		expect(api.moveTrack).toHaveBeenCalledTimes(1);
		expect(state().pendingMoves).toBe(0);
	});

	it('neither reloads nor sets the message for a conflict on a playlist left meanwhile', async () => {
		const answer = deferred<never>();
		api.moveTrack.mockReturnValue(answer.promise);
		const moving = state().moveTrack('p', 'C', 'a');
		await Promise.resolve();
		usePlaylistStore.setState({ currentPlaylist: { ...start(), id: 'q' } });
		answer.resolve(Promise.reject(new ApiError('conflict', 'TRACK_MOVED_CONCURRENTLY')) as never);

		await expect(moving).rejects.toMatchObject({ code: 'TRACK_MOVED_CONCURRENTLY' });
		expect(api.fetchPlaylistById).not.toHaveBeenCalled();
		expect(state().conflictMessage).toBeNull();
		expect(state().currentPlaylist!.id).toBe('q');
		expect(state().pendingMoves).toBe(0);
	});

	it('clears the conflict message with the current playlist', () => {
		usePlaylistStore.setState({ conflictMessage: CONFLICT_MESSAGE });
		state().clearCurrentPlaylist();
		expect(state().conflictMessage).toBeNull();
	});
});

describe('playlistStore.applyPlaylistEvent', () => {
	const removeA = (tracksVersion: number): PlaylistUpdatedEvent => ({
		playlistId: 'p',
		tracksVersion,
		rebalanced: false,
		event: 'track_removed',
		trackId: 'A',
	});

	it('applies the next version and ignores it a second time', () => {
		expect(state().applyPlaylistEvent(removeA(11))).toBe('applied');
		expect(state().applyPlaylistEvent(removeA(11))).toBe('ignored');
		expect(order()).toEqual(['B', 'C']);
		expect(state().playlistsCache.get('p')!.tracksVersion).toBe(11);
	});

	it('replaces the local order with a move', () => {
		state().applyPlaylistEvent({
			playlistId: 'p',
			tracksVersion: 11,
			rebalanced: false,
			event: 'track_moved',
			trackId: 'A',
			rank: 'z',
		});
		expect(order()).toEqual(['B', 'C', 'A']);
	});

	it('asks for a reload when a version is missing or after a rebalance', () => {
		expect(state().applyPlaylistEvent(removeA(15))).toBe('reload');
		expect(state().applyPlaylistEvent({ ...removeA(11), rebalanced: true })).toBe('reload');
		expect(order()).toEqual(['A', 'B', 'C']);
	});

	it('ignores an event of a playlist that is not open', () => {
		expect(state().applyPlaylistEvent({ ...removeA(11), playlistId: 'q' })).toBe('ignored');
	});
});
