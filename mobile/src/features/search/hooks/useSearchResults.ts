import { useEffect } from 'react';
import { showError } from '@/shared/theme/lib/toast';
import { useSoundCloudSearch } from '@/features/search/hooks/useSoundCloudSearch';
import { useSearchRefresh } from '@/features/search/hooks/useSearchRefresh';
import type { SearchQueryState, SearchResults } from '@/features/search/searchTypes';

export function useSearchResults(query: SearchQueryState, settle: () => void): SearchResults {
	const { data, isFetching, isError, refetch } = useSoundCloudSearch(query.debounced);
	const refresh = useSearchRefresh(query.debounced, settle, refetch);

	useEffect(() => {
		if (isError && query.debounced.trim()) {
			showError('La recherche SoundCloud a échoué. Réessayez.');
		}
	}, [isError, query.debounced]);

	return {
		debouncedQuery: query.debounced,
		isLoading: (isFetching || query.pending) && Boolean(query.text.trim()),
		isRefreshing: refresh.isRefreshing,
		isError,
		tracks: query.debounced.trim() ? (data ?? []) : [],
		onRefresh: refresh.onRefresh,
	};
}
