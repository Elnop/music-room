import { useState, useCallback, useEffect, useMemo } from 'react';
import { showError } from '@/shared/utils/toast';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { debounce } from '@/shared/utils/debounce';
import { logger } from '@/shared/utils/logger';
import { friendsApi } from '@/features/friends/services/friendsApi';
import type { UserProfile } from '@/features/friends/types';

export function useDebouncedUserSearch() {
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [searchFailed, setSearchFailed] = useState(false);
	const [isRefreshingSearch, setIsRefreshingSearch] = useState(false);

	const performSearch = useCallback(async (query: string, isRefresh = false) => {
		if (!query.trim()) {
			setSearchResults([]);
			return;
		}
		setIsSearching(true);
		if (!isRefresh) setSearchFailed(false);
		try {
			const results = await friendsApi.searchUsers(query);
			setSearchResults(results);
		} catch (error) {
			logger.error('[FriendsList] User search failed:', error);
			showError(apiErrorMessage(error, 'La recherche a échoué'));
			if (!isRefresh) {
				setSearchResults([]);
				setSearchFailed(true);
			}
		} finally {
			setIsSearching(false);
		}
	}, []);

	const debouncedSearch = useMemo(
		() => debounce((q: string) => performSearch(q), 500),
		[performSearch]
	);

	useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

	const handleSearchChange = useCallback(
		(text: string) => {
			setSearchQuery(text);
			setSearchFailed(false);
			if (text.trim()) {
				debouncedSearch(text);
			} else {
				debouncedSearch.cancel();
				setSearchResults([]);
			}
		},
		[debouncedSearch]
	);

	const handleRefreshSearch = useCallback(async () => {
		if (!searchQuery.trim()) return;
		setIsRefreshingSearch(true);
		try {
			await performSearch(searchQuery, true);
		} finally {
			setIsRefreshingSearch(false);
		}
	}, [performSearch, searchQuery]);

	return {
		searchQuery,
		searchResults,
		isSearching,
		searchFailed,
		isRefreshingSearch,
		onSearchChange: handleSearchChange,
		onRefreshSearch: handleRefreshSearch,
		onRetrySearch: () => performSearch(searchQuery),
	};
}
