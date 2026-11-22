import { apiRequest } from '@/shared/backend/lib/apiRequest';
import type {
	SoundCloudSearchResult,
	SoundCloudTrack,
} from '@/shared/tracks/types/soundcloudTypes';

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
