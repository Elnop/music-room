import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query-keys/queryKeys';
import { STALE } from '@/shared/backend/configs/staleQueryConfig';
import { searchApi } from '@/features/search/searchApi';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';

export function useSoundCloudSearch(query: string) {
	const trimmed = query.trim();
	return useQuery<SoundCloudTrack[], Error>({
		queryKey: queryKeys.search.tracks(trimmed),
		queryFn: () => searchApi.searchTracks(trimmed),
		enabled: trimmed.length > 0,
		staleTime: STALE.none,
		placeholderData: keepPreviousData,
		retry: false,
	});
}
