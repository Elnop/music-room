import { apiRequest } from '@/shared/backend/lib/api';
import type {
	SoundCloudSearchResult,
	SoundCloudTrack,
} from '@/shared/tracks/types/soundcloudTypes';

export async function searchTracks(query: string, limit = 20): Promise<SoundCloudTrack[]> {
	const params = new URLSearchParams({ q: query, limit: limit.toString() });
	const data = await apiRequest<SoundCloudSearchResult>(
		`/api/soundcloud/search?${params.toString()}`
	);
	return data.collection || [];
}
