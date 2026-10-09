import { applyPlaylistEvent, sortByRank } from '@/store/playlistSync';
import type { PlaylistWithTracks } from '@/types/playlist.types';
import type { TrackInPlaylist } from '@/types/track.types';

const track = (id: string, rank: string): TrackInPlaylist =>
	({
		id,
		rank,
		addedBy: null,
		addedAt: '2026-10-06T00:00:00Z',
		title: id,
		artist: 'A',
		trackUri: id,
		durationMs: 1,
	}) as TrackInPlaylist;

const playlist = (tracksVersion: number, tracks: TrackInPlaylist[]): PlaylistWithTracks =>
	({ id: 'p', tracksVersion, tracks }) as PlaylistWithTracks;

const base = playlist(10, [track('A', 'a'), track('B', 'h'), track('C', 'p')]);
const ids = (p: PlaylistWithTracks | 'ignore' | 'reload') =>
	(p as PlaylistWithTracks).tracks.map(t => t.id);

describe('sortByRank', () => {
	it('sorts by byte order, digits before upper case before lower case', () => {
		expect(sortByRank([track('x', 'a'), track('y', 'Z'), track('z', '1')]).map(t => t.id)).toEqual([
			'z',
			'y',
			'x',
		]);
	});

	it('does not mutate its input', () => {
		const input = [track('x', 'b'), track('y', 'a')];
		sortByRank(input);
		expect(input.map(t => t.id)).toEqual(['x', 'y']);
	});
});

describe('applyPlaylistEvent', () => {
	const ev = { playlistId: 'p', rebalanced: false };

	it('ignores a version already displayed or older', () => {
		expect(
			applyPlaylistEvent(base, { ...ev, tracksVersion: 10, event: 'track_removed', trackId: 'A' })
		).toBe('ignore');
		expect(
			applyPlaylistEvent(base, { ...ev, tracksVersion: 3, event: 'track_removed', trackId: 'A' })
		).toBe('ignore');
	});

	it('asks for a reload when a version was skipped', () => {
		expect(
			applyPlaylistEvent(base, { ...ev, tracksVersion: 12, event: 'track_removed', trackId: 'A' })
		).toBe('reload');
	});

	it('asks for a reload after a rebalance', () => {
		expect(
			applyPlaylistEvent(base, {
				...ev,
				tracksVersion: 11,
				rebalanced: true,
				event: 'track_moved',
				trackId: 'C',
				rank: '1',
			})
		).toBe('reload');
	});

	it('applies a move in rank order', () => {
		const next = applyPlaylistEvent(base, {
			...ev,
			tracksVersion: 11,
			event: 'track_moved',
			trackId: 'C',
			rank: 'c',
		});
		expect(ids(next)).toEqual(['A', 'C', 'B']);
		expect((next as PlaylistWithTracks).tracksVersion).toBe(11);
		expect(base.tracks.map(t => t.id)).toEqual(['A', 'B', 'C']);
	});

	it('applies an add and a remove', () => {
		const added = applyPlaylistEvent(base, {
			...ev,
			tracksVersion: 11,
			event: 'track_added',
			track: track('D', 'w'),
		}) as PlaylistWithTracks;
		expect(ids(added)).toEqual(['A', 'B', 'C', 'D']);
		const removed = applyPlaylistEvent(added, {
			...ev,
			tracksVersion: 12,
			event: 'track_removed',
			trackId: 'B',
		});
		expect(ids(removed)).toEqual(['A', 'C', 'D']);
		expect((removed as PlaylistWithTracks).tracksVersion).toBe(12);
	});

	it('does not duplicate a track that is added twice', () => {
		const added = applyPlaylistEvent(base, {
			...ev,
			tracksVersion: 11,
			event: 'track_added',
			track: track('A', 'z'),
		});
		expect(ids(added)).toEqual(['B', 'C', 'A']);
	});

	it('only advances the version for a remove of a track already gone', () => {
		const next = applyPlaylistEvent(base, {
			...ev,
			tracksVersion: 11,
			event: 'track_removed',
			trackId: 'X',
		});
		expect(ids(next)).toEqual(['A', 'B', 'C']);
		expect((next as PlaylistWithTracks).tracksVersion).toBe(11);
	});
});
