import { playlistApi } from './playlistApi';
import { apiRequest } from '@/shared/services/api';

jest.mock('@/shared/services/api', () => ({ apiRequest: jest.fn() }));

const request = apiRequest as jest.MockedFunction<typeof apiRequest>;

beforeEach(() => {
	request.mockReset();
	request.mockResolvedValue(undefined);
});

describe('playlistApi tracks', () => {
	it('moves a track with afterRank and the expected version', async () => {
		const result = { trackId: 't', rank: 'c', tracksVersion: 11, rebalanced: false };
		request.mockResolvedValue(result);

		await expect(playlistApi.moveTrack('p', 't', null, 10)).resolves.toEqual(result);

		expect(request).toHaveBeenCalledWith('/api/playlists/p/tracks/t/move', {
			method: 'POST',
			body: JSON.stringify({ afterRank: null, expectedVersion: 10 }),
		});
	});

	it('returns the remove result', async () => {
		request.mockResolvedValue({ tracksVersion: 4 });
		await expect(playlistApi.removeTrack('p', 't')).resolves.toEqual({ tracksVersion: 4 });
		expect(request).toHaveBeenCalledWith('/api/playlists/p/tracks/t', { method: 'DELETE' });
	});
});

describe('playlistApi collaborators', () => {
	it('adds a collaborator', async () => {
		await playlistApi.addCollaborator('p', 'u');
		expect(request).toHaveBeenCalledWith('/api/playlists/p/collaborators', {
			method: 'POST',
			body: JSON.stringify({ userId: 'u' }),
		});
	});

	it('removes a collaborator', async () => {
		await playlistApi.removeCollaborator('p', 'u');
		expect(request).toHaveBeenCalledWith('/api/playlists/p/collaborators/u', { method: 'DELETE' });
	});

	it('propagates a refusal', async () => {
		request.mockRejectedValue(new Error('Only the owner can manage collaborators'));
		await expect(playlistApi.addCollaborator('p', 'u')).rejects.toThrow('Only the owner');
	});
});

describe('playlistApi viewers', () => {
	it('lists the viewers', async () => {
		const viewers = [{ id: 'u', username: 'bob' }];
		request.mockResolvedValue({ viewers });
		await expect(playlistApi.getViewers('p')).resolves.toEqual(viewers);
		expect(request).toHaveBeenCalledWith('/api/playlists/p/viewers');
	});

	it('adds a viewer', async () => {
		await playlistApi.addViewer('p', 'u');
		expect(request).toHaveBeenCalledWith('/api/playlists/p/viewers', {
			method: 'POST',
			body: JSON.stringify({ userId: 'u' }),
		});
	});

	it('removes a viewer', async () => {
		await playlistApi.removeViewer('p', 'u');
		expect(request).toHaveBeenCalledWith('/api/playlists/p/viewers/u', { method: 'DELETE' });
	});
});
