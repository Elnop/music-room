import { apiRequest } from '@/shared/services/api';
import type { SoundCloudSearchResult, SoundCloudTrack } from '@/features/search/types';

export const searchApi = {
	search: async (query: string, limit = 20): Promise<SoundCloudSearchResult> => {
		const trimmed = query.trim();
		if (!trimmed) {
			return { collection: [], total_results: 0 };
		}
		const params = new URLSearchParams({
			q: trimmed,
			limit: limit.toString(),
		});
		return apiRequest<SoundCloudSearchResult>(`/api/soundcloud/search?${params.toString()}`);
	},

	searchTracks: async (query: string, limit = 20): Promise<SoundCloudTrack[]> => {
		const data = await searchApi.search(query, limit);
		return data.collection || [];
	},
};
