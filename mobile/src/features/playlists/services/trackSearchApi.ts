import { apiRequest } from '@/shared/services/api';
import type { SoundCloudSearchResult, SoundCloudTrack } from '@/types/soundcloud.types';

export async function searchTracks(query: string, limit = 20): Promise<SoundCloudTrack[]> {
	const params = new URLSearchParams({ q: query, limit: limit.toString() });
	const data = await apiRequest<SoundCloudSearchResult>(
		`/api/soundcloud/search?${params.toString()}`
	);
	return data.collection || [];
}
