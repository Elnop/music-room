import { useCallback, useState } from 'react';

export function useSearchRefresh(
	searchQuery: string,
	performSearch: (query: string, isRefresh: boolean) => Promise<void>,
) {
	const [isRefreshing, setIsRefreshing] = useState(false);
	const onRefresh = useCallback(async () => {
		if (!searchQuery.trim()) return;
		setIsRefreshing(true);
		try {
			await performSearch(searchQuery, true);
		} finally {
			setIsRefreshing(false);
		}
	}, [performSearch, searchQuery]);
	return { isRefreshing, onRefresh };
}
