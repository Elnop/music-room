import { useUserSearchRequest } from '@/features/user/features/friends/features/friends-list/hooks/useUserSearchRequest';
import { useDebouncedQuery } from '@/features/user/features/friends/features/friends-list/hooks/useDebouncedQuery';
import { useSearchRefresh } from '@/features/user/features/friends/features/friends-list/hooks/useSearchRefresh';
import type { UserSearch } from '@/features/user/features/friends/features/friends-list/friendsListTypes';

export function useDebouncedUserSearch(): UserSearch {
	const { request, setRequest, performSearch } = useUserSearchRequest();
	const query = useDebouncedQuery(performSearch, setRequest);
	const refresh = useSearchRefresh(query.searchQuery, performSearch);

	return {
		searchQuery: query.searchQuery,
		onSearchChange: query.onSearchChange,
		searchResults: request.results,
		isSearching: request.isSearching,
		searchFailed: request.failed,
		isRefreshing: refresh.isRefreshing,
		onRefresh: refresh.onRefresh,
		onRetry: () => performSearch(query.searchQuery),
	};
}
