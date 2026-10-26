import { createQueryClient } from '@/shared/query/queryClient';
import { queryKeys } from '@/shared/query/keys';
import type { Playlist, PlaylistWithTracks } from '@/features/playlists/types';
import { playlistTrack, playlistWithTracks } from '@/test/playlistFixtures';
import { PLAYLIST_SOCKET_RULES } from './playlistSocketRules';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/shared/services/deviceService', () => ({ getAppVersion: () => '1.2.3' }));

const client = createQueryClient();
const detail = queryKeys.playlists.detail('p1');
const list = queryKeys.playlists.list();

/** Sends a payload through every rule of `event`. */
const emit = (event: string, payload: unknown) =>
	PLAYLIST_SOCKET_RULES.filter(rule => rule.event === event).map(rule =>
		rule.apply(client, payload)
	);

const shown = () => client.getQueryData<PlaylistWithTracks>(detail)!;
const removeA = (tracksVersion: number, rebalanced = false) => ({
	playlistId: 'p1',
	tracksVersion,
	rebalanced,
	event: 'track_removed',
	trackId: 'A',
});

beforeEach(() => {
	client.clear();
	client.setQueryData(
		detail,
		playlistWithTracks({
			tracksVersion: 10,
			tracks: [playlistTrack('A', 'a'), playlistTrack('B', 'b')],
		})
	);
	client.setQueryData<Playlist[]>(list, [
		{ id: 'p1', name: 'Mix' } as Playlist,
		{ id: 'p2', name: 'Other' } as Playlist,
	]);
});

afterAll(() => client.clear());

describe('PLAYLIST_SOCKET_RULES', () => {
	it('applies the next track version and ignores it a second time', () => {
		expect(emit('playlist:updated', removeA(11))).toEqual(['updated']);
		expect(emit('playlist:updated', removeA(11))).toEqual(['updated']);
		expect(shown().tracks.map(t => t.id)).toEqual(['B']);
		expect(shown().tracksVersion).toBe(11);
	});

	it('reloads the playlist when a version is missing or after a rebalance', () => {
		expect(emit('playlist:updated', removeA(15))).toEqual(['invalidated']);
		expect(emit('playlist:updated', removeA(11, true))).toEqual(['invalidated']);
		expect(shown().tracks).toHaveLength(2);
	});

	it('patches the details in the playlist and the list, tracks untouched (#342)', () => {
		emit('playlist:details', {
			playlistId: 'p1',
			name: 'Les tubes du Crabe Croustillant',
			visibility: 'private',
			editMode: 'open',
		});
		expect(shown()).toMatchObject({ name: 'Les tubes du Crabe Croustillant', editMode: 'open' });
		expect(shown().description).toBeUndefined();
		expect(shown().coverUrl).toBeUndefined();
		expect(shown().tracks).toHaveLength(2);
		expect(client.getQueryData<Playlist[]>(list)!.map(p => p.name)).toEqual([
			'Les tubes du Crabe Croustillant',
			'Other',
		]);
	});

	it('shows a new cover from the details (#483)', () => {
		const coverUrl = 'https://x/storage/v1/object/public/playlist-covers/p1/c.jpg';
		emit('playlist:details', {
			playlistId: 'p1',
			name: 'Mine',
			visibility: 'public',
			editMode: 'open',
			coverUrl,
		});
		expect(shown().coverUrl).toBe(coverUrl);
		expect(client.getQueryData<Playlist[]>(list)![0].coverUrl).toBe(coverUrl);
	});

	it('drops a deleted playlist from the list', () => {
		emit('playlist:deleted', { playlistId: 'p1' });
		expect(client.getQueryData<Playlist[]>(list)!.map(p => p.id)).toEqual(['p2']);
	});

	it('marks the tracks whose availability changed, without touching the version', () => {
		emit('playlist:tracks-availability', {
			playlistId: 'p1',
			tracks: [{ trackId: 'B', unavailable: true }],
		});
		expect(shown().tracks.map(t => [t.id, t.unavailable])).toEqual([
			['A', false],
			['B', true],
		]);
		expect(shown().tracksVersion).toBe(10);

		emit('playlist:tracks-availability', {
			playlistId: 'p1',
			tracks: [{ trackId: 'B', unavailable: false }],
		});
		expect(shown().tracks.find(t => t.id === 'B')?.unavailable).toBe(false);
	});
});
