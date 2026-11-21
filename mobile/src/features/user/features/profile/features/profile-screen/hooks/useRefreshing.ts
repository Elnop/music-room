import { useCallback, useState } from 'react';
import type { ProfileRefresh } from '@/features/user/features/profile/features/profile-screen/profileScreenTypes';

export function useRefreshing(refetch: () => Promise<void>): ProfileRefresh {
	const [isRefreshing, setIsRefreshing] = useState(false);

	const onRefresh = useCallback(async () => {
		setIsRefreshing(true);
		await refetch();
		setIsRefreshing(false);
	}, [refetch]);

	return { isRefreshing, onRefresh };
}
