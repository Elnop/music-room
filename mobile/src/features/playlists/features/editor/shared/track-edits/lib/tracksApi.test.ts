import * as tracksApi from '@/features/playlists/features/editor/shared/track-edits/lib/tracksApi';
import * as playlistApi from '@/features/playlists/shared/playlist/lib/playlistApi';
import * as peopleApi from '@/features/playlists/shared/playlist/lib/peopleApi';
import { apiRequest } from '@/shared/backend/lib/apiRequest';

jest.mock('@/shared/backend/lib/apiRequest', () => ({ apiRequest: jest.fn() }));

const request = apiRequest as jest.MockedFunction<typeof apiRequest>;

beforeEach(() => {
	request.mockReset();
	request.mockResolvedValue(undefined);
});

describe('tracksApi', () => {
	it('moves a track with afterRank and the expected version', async () => {
		const result = { trackId: 't', rank: 'c', tracksVersion: 11, rebalanced: false };
		request.mockResolvedValue(result);

		await expect(tracksApi.moveTrack('p', 't', null, 10)).resolves.toStrictEqual(result);

		expect(request).toHaveBeenCalledWith('/api/playlists/p/tracks/t/move', {
			method: 'POST',
			body: JSON.stringify({ afterRank: null, expectedVersion: 10 }),
		});
	});

	it('returns the remove result', async () => {
		request.mockResolvedValue({ tracksVersion: 4 });
		await expect(tracksApi.removeTrack('p', 't')).resolves.toStrictEqual({ tracksVersion: 4 });
		expect(request).toHaveBeenCalledWith('/api/playlists/p/tracks/t', { method: 'DELETE' });
	});
});

describe('tracksApi.addTrack', () => {
	it('sends the track without an id', async () => {
		const result = { track: { id: 't' }, tracksVersion: 2, rebalanced: false };
		request.mockResolvedValue(result);
		const track = { trackUri: 'u', title: 'T', artist: 'A', durationMs: 1 };
		await expect(tracksApi.addTrack('p', track)).resolves.toStrictEqual(result);
		expect(request).toHaveBeenCalledWith('/api/playlists/p/tracks', {
			method: 'POST',
			body: JSON.stringify(track),
		});
	});
});

describe('playlistApi', () => {
	it('unwraps the lists and the playlist', async () => {
		request.mockResolvedValue({ playlists: [{ id: 'p' }], playlist: { id: 'p' } });
		await expect(playlistApi.fetchPlaylists()).resolves.toStrictEqual([{ id: 'p' }]);
		await expect(playlistApi.fetchPublicPlaylists()).resolves.toStrictEqual([{ id: 'p' }]);
		await expect(playlistApi.fetchUserPublicPlaylists('u')).resolves.toStrictEqual([{ id: 'p' }]);
		await expect(playlistApi.fetchPlaylistById('p')).resolves.toStrictEqual({ id: 'p' });
		expect(request).toHaveBeenCalledWith('/api/playlists/user/u');
	});
});

describe('peopleApi', () => {
	it('reads friends, a profile and a user search', async () => {
		await peopleApi.getFriends();
		await peopleApi.getUserProfile('u');
		await peopleApi.searchUsers('bob');
		expect(request).toHaveBeenNthCalledWith(1, '/api/friends', { method: 'GET' });
		expect(request).toHaveBeenNthCalledWith(2, '/api/profile/u', { method: 'GET' });
		expect(request).toHaveBeenNthCalledWith(3, '/api/profile/search?q=bob&limit=20', {
			method: 'GET',
		});
	});
});
