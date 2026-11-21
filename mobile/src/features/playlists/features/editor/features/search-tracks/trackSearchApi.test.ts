import * as trackSearchApi from '@/features/playlists/features/editor/features/search-tracks/trackSearchApi';
import { apiRequest } from '@/shared/backend/lib/api';

jest.mock('@/shared/backend/lib/api', () => ({ apiRequest: jest.fn() }));

const request = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('trackSearchApi', () => {
	beforeEach(() => {
		request.mockReset();
	});

	it('returns the SoundCloud collection, or nothing', async () => {
		request.mockResolvedValueOnce({ collection: [{ id: 1 }] }).mockResolvedValueOnce({});
		await expect(trackSearchApi.searchTracks('daft')).resolves.toEqual([{ id: 1 }]);
		await expect(trackSearchApi.searchTracks('daft')).resolves.toEqual([]);
		expect(request).toHaveBeenCalledWith('/api/soundcloud/search?q=daft&limit=20');
	});
});
