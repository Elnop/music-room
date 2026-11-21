import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query-keys/queryKeys';
import { STALE } from '@/shared/backend/configs/staleQueryConfig';
import type { DebouncedText } from '@/features/playlists/features/editor/shared/debounced-text/debouncedTextTypes';
import { searchTracks } from '@/features/playlists/features/editor/features/search-tracks/lib/searchTracks';
import type { TrackResults } from '@/features/playlists/features/editor/features/search-tracks/searchTracksTypes';

export function useTrackResults(search: DebouncedText): TrackResults {
	const query = search.settled.trim();
	const found = useQuery({
		queryKey: queryKeys.search.tracks(query),
		queryFn: () => searchTracks(query),
		enabled: query !== '',
		staleTime: STALE.none,
		placeholderData: keepPreviousData,
		retry: false,
	});
	return {
		results: query ? (found.data ?? []) : [],
		isLoading: found.isFetching || search.pending,
	};
}
