import { useState } from 'react';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { logger } from '@/shared/logging/logger';
import { showError } from '@/shared/theme/lib/toast';

type RefetchOutcome = {
	isError: boolean;
	error: unknown;
};

export function useManualRefresh(refetch: () => Promise<RefetchOutcome>, screenName: string) {
	const [isRefreshing, setIsRefreshing] = useState(false);

	async function refresh() {
		setIsRefreshing(true);
		const result = await refetch();
		setIsRefreshing(false);
		if (result.isError) {
			logger.error(`[${screenName}] Refresh failed:`, result.error);
			showError(apiErrorMessage(result.error, 'Impossible de rafraîchir les playlists'));
		}
	}

	return { isRefreshing, refresh: () => void refresh() };
}
