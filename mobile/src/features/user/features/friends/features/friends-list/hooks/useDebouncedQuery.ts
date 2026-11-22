import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { debounce } from '@/shared/debounce/debounce';
import type { UserSearchRequest } from '@/features/user/features/friends/features/friends-list/friendsListTypes';

export function useDebouncedQuery(
	performSearch: (query: string) => Promise<void>,
	setRequest: React.Dispatch<React.SetStateAction<UserSearchRequest>>,
) {
	const [searchQuery, setSearchQuery] = useState('');
	const debouncedSearch = useMemo(
		() => debounce((q: string) => performSearch(q), 500),
		[performSearch],
	);

	useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

	const onSearchChange = useCallback(
		(text: string) => {
			setSearchQuery(text);
			setRequest((request) => ({ ...request, failed: false }));
			if (text.trim()) {
				debouncedSearch(text);
			} else {
				debouncedSearch.cancel();
				setRequest((request) => ({ ...request, results: [] }));
			}
		},
		[debouncedSearch, setRequest],
	);

	return { searchQuery, onSearchChange };
}
