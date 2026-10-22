import * as tracksApi from './tracksApi';
import * as playlistApi from './playlistApi';
import * as usersApi from './usersApi';
import * as trackSearchApi from './trackSearchApi';
import { apiRequest } from '@/shared/services/api';

jest.mock('@/shared/services/api', () => ({ apiRequest: jest.fn() }));

const request = apiRequest as jest.MockedFunction<typeof apiRequest>;

beforeEach(() => {
	request.mockReset();
	request.mockResolvedValue(undefined);
});

describe('tracksApi', () => {
	it('moves a track with afterRank and the expected version', async () => {
		const result = { trackId: 't', rank: 'c', tracksVersion: 11, rebalanced: false };
		request.mockResolvedValue(result);

		await expect(tracksApi.moveTrack('p', 't', null, 10)).resolves.toEqual(result);

		expect(request).toHaveBeenCalledWith('/api/playlists/p/tracks/t/move', {
			method: 'POST',
			body: JSON.stringify({ afterRank: null, expectedVersion: 10 }),
		});
	});

	it('returns the remove result', async () => {
		request.mockResolvedValue({ tracksVersion: 4 });
		await expect(tracksApi.removeTrack('p', 't')).resolves.toEqual({ tracksVersion: 4 });
		expect(request).toHaveBeenCalledWith('/api/playlists/p/tracks/t', { method: 'DELETE' });
	});
});

describe('tracksApi.addTrack', () => {
	it('sends the track without an id', async () => {
		const result = { track: { id: 't' }, tracksVersion: 2, rebalanced: false };
		request.mockResolvedValue(result);
		const track = { trackUri: 'u', title: 'T', artist: 'A', durationMs: 1 };
		await expect(tracksApi.addTrack('p', track)).resolves.toEqual(result);
		expect(request).toHaveBeenCalledWith('/api/playlists/p/tracks', {
			method: 'POST',
			body: JSON.stringify(track),
		});
	});
});

describe('playlistApi', () => {
	it('unwraps the lists and the playlist', async () => {
		request.mockResolvedValue({ playlists: [{ id: 'p' }], playlist: { id: 'p' } });
		await expect(playlistApi.fetchPlaylists()).resolves.toEqual([{ id: 'p' }]);
		await expect(playlistApi.fetchPublicPlaylists()).resolves.toEqual([{ id: 'p' }]);
		await expect(playlistApi.fetchUserPublicPlaylists('u')).resolves.toEqual([{ id: 'p' }]);
		await expect(playlistApi.fetchPlaylistById('p')).resolves.toEqual({ id: 'p' });
		expect(request).toHaveBeenCalledWith('/api/playlists/user/u');
	});

	it('creates, updates and deletes', async () => {
		request.mockResolvedValue({ playlist: { id: 'p' } });
		await playlistApi.createPlaylist({ name: 'Mix' });
		await playlistApi.updatePlaylist('p', { name: 'New' });
		await playlistApi.deletePlaylist('p');
		expect(request).toHaveBeenNthCalledWith(1, '/api/playlists', {
			method: 'POST',
			body: JSON.stringify({ name: 'Mix' }),
		});
		expect(request).toHaveBeenNthCalledWith(2, '/api/playlists/p', {
			method: 'PATCH',
			body: JSON.stringify({ name: 'New' }),
		});
		expect(request).toHaveBeenNthCalledWith(3, '/api/playlists/p', { method: 'DELETE' });
	});
});

describe('usersApi and trackSearchApi', () => {
	it('reads friends, a profile and a user search', async () => {
		await usersApi.getFriends();
		await usersApi.getUserProfile('u');
		await usersApi.searchUsers('bob');
		expect(request).toHaveBeenNthCalledWith(1, '/api/friends', { method: 'GET' });
		expect(request).toHaveBeenNthCalledWith(2, '/api/profile/u', { method: 'GET' });
		expect(request).toHaveBeenNthCalledWith(3, '/api/profile/search?q=bob&limit=20', {
			method: 'GET',
		});
	});

	it('returns the SoundCloud collection, or nothing', async () => {
		request.mockResolvedValueOnce({ collection: [{ id: 1 }] }).mockResolvedValueOnce({});
		await expect(trackSearchApi.searchTracks('daft')).resolves.toEqual([{ id: 1 }]);
		await expect(trackSearchApi.searchTracks('daft')).resolves.toEqual([]);
		expect(request).toHaveBeenCalledWith('/api/soundcloud/search?q=daft&limit=20');
	});
});
