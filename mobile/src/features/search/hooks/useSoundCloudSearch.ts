import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query/keys';
import { STALE } from '@/shared/query/queryClient';
import { searchApi } from '@/features/search/services/searchApi';
import type { SoundCloudTrack } from '@/features/search/types';

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
