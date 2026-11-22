import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useSoundCloudSearch } from '@/features/search/hooks/useSoundCloudSearch';
import { searchApi } from '@/features/search/searchApi';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@/shared/backend/deviceService', () => ({
	getAppVersion: () => '1.0.0',
}));

jest.mock('@/features/search/searchApi', () => ({
	searchApi: {
		searchTracks: jest.fn(),
	},
}));

const mockSearchTracks = searchApi.searchTracks as jest.MockedFunction<
	typeof searchApi.searchTracks
>;

const sampleTracks: SoundCloudTrack[] = [
	{
		id: 1,
		title: 'Track One',
		duration: 60000,
		permalink_url: 'https://soundcloud.com/art/one',
		artwork_url: null,
		description: null,
		genre: null,
		user: {
			id: 1,
			username: 'user1',
			avatar_url: null,
			permalink_url: 'https://soundcloud.com/user1',
		},
		playable: true,
	},
];

describe('useSoundCloudSearch', () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		jest.clearAllMocks();
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
			},
		});
	});

	afterEach(() => {
		queryClient.clear();
	});

	function wrapper({ children }: { children: React.ReactNode }) {
		return React.createElement(QueryClientProvider, { client: queryClient }, children);
	}

	it('does not trigger search when query is blank', () => {
		const { result } = renderHook(() => useSoundCloudSearch('   '), { wrapper });

		expect(result.current.data).toBeUndefined();
		expect(result.current.isFetching).toBe(false);
		expect(mockSearchTracks).not.toHaveBeenCalled();
	});

	it('fetches tracks when query is provided', async () => {
		mockSearchTracks.mockResolvedValueOnce(sampleTracks);

		const { result } = renderHook(() => useSoundCloudSearch('daft'), { wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toStrictEqual(sampleTracks);
		expect(mockSearchTracks).toHaveBeenCalledWith('daft');
	});

	it('reports error when fetch fails', async () => {
		mockSearchTracks.mockRejectedValueOnce(new Error('API error'));

		const { result } = renderHook(() => useSoundCloudSearch('fail'), { wrapper });

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(result.current.error?.message).toBe('API error');
	});
});
