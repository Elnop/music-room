import { useCallback, useState } from 'react';

export function useSearchRefresh(
	debouncedQuery: string,
	settle: () => void,
	refetch: () => Promise<unknown>
) {
	const [isRefreshing, setIsRefreshing] = useState(false);

	const onRefresh = useCallback(async () => {
		if (!debouncedQuery.trim()) return;
		settle();
		setIsRefreshing(true);
		try {
			await refetch();
		} finally {
			setIsRefreshing(false);
		}
	}, [debouncedQuery, settle, refetch]);

	return { isRefreshing, onRefresh };
}
