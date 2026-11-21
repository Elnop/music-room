import { searchApi } from '@/features/search/searchApi';
import { apiRequest } from '@/shared/backend/lib/api';
import type {
	SoundCloudSearchResult,
	SoundCloudTrack,
} from '@/shared/tracks/types/soundcloudTypes';

jest.mock('@/shared/backend/lib/api', () => ({
	apiRequest: jest.fn(),
}));

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

const sampleTrack: SoundCloudTrack = {
	id: 101,
	title: 'Test Song',
	description: null,
	duration: 180000,
	genre: 'Electronic',
	artwork_url: 'https://example.com/art.jpg',
	permalink_url: 'https://soundcloud.com/artist/song',
	user: {
		id: 1,
		username: 'artist',
		avatar_url: null,
		permalink_url: 'https://soundcloud.com/artist',
	},
	playable: true,
};

describe('searchApi', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('returns empty result for blank query without calling API', async () => {
		const result = await searchApi.search('   ');
		expect(result).toStrictEqual({ collection: [], total_results: 0 });
		expect(mockApiRequest).not.toHaveBeenCalled();
	});

	it('calls apiRequest with encoded query and limit', async () => {
		const mockResponse: SoundCloudSearchResult = {
			collection: [sampleTrack],
			total_results: 1,
		};
		mockApiRequest.mockResolvedValueOnce(mockResponse);

		const result = await searchApi.search('daft punk', 15);

		expect(mockApiRequest).toHaveBeenCalledWith('/api/soundcloud/search?q=daft+punk&limit=15');
		expect(result).toStrictEqual(mockResponse);
	});

	it('searchTracks returns track collection or empty array', async () => {
		mockApiRequest.mockResolvedValueOnce({
			collection: [sampleTrack],
			total_results: 1,
		});

		const tracks = await searchApi.searchTracks('daft');
		expect(tracks).toStrictEqual([sampleTrack]);

		mockApiRequest.mockResolvedValueOnce({} as SoundCloudSearchResult);
		const emptyTracks = await searchApi.searchTracks('none');
		expect(emptyTracks).toStrictEqual([]);
	});
});
