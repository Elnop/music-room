import * as playlistEditsApi from '@/features/playlists/features/editor/shared/playlist-mutations/lib/playlistEditsApi';
import { apiRequest } from '@/shared/backend/lib/api';

jest.mock('@/shared/backend/lib/api', () => ({ apiRequest: jest.fn() }));

const request = apiRequest as jest.MockedFunction<typeof apiRequest>;

beforeEach(() => {
	request.mockReset();
	request.mockResolvedValue(undefined);
});

describe('playlistEditsApi', () => {
	it('creates, updates and deletes', async () => {
		request.mockResolvedValue({ playlist: { id: 'p' } });
		await playlistEditsApi.createPlaylist({ name: 'Mix' });
		await playlistEditsApi.updatePlaylist('p', { name: 'New' });
		await playlistEditsApi.deletePlaylist('p');
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
