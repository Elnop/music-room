import { searchTracks } from '@/features/playlists/features/editor/features/search-tracks/lib/searchTracks';
import { apiRequest } from '@/shared/backend/lib/api';

jest.mock('@/shared/backend/lib/api', () => ({ apiRequest: jest.fn() }));

const request = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('searchTracks', () => {
	beforeEach(() => {
		request.mockReset();
	});

	it('returns the SoundCloud collection, or nothing', async () => {
		request.mockResolvedValueOnce({ collection: [{ id: 1 }] }).mockResolvedValueOnce({});
		await expect(searchTracks('daft')).resolves.toStrictEqual([{ id: 1 }]);
		await expect(searchTracks('daft')).resolves.toStrictEqual([]);
		expect(request).toHaveBeenCalledWith('/api/soundcloud/search?q=daft&limit=20');
	});
});
