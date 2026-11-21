import { useState } from 'react';
import { showError } from '@/shared/theme/lib/toast';

export function useDetailRefresh(refetch: () => Promise<{ isError: boolean }>) {
	const [isRefreshing, setIsRefreshing] = useState(false);

	async function refresh() {
		setIsRefreshing(true);
		const result = await refetch();
		setIsRefreshing(false);
		if (result.isError) showError('Impossible de charger la playlist');
	}

	return { isRefreshing, refresh: () => void refresh() };
}
