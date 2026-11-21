import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

export function useFriendsRefresh(
	refetchFriends: () => unknown,
	refetchPermissions: () => unknown
) {
	const [isRefreshing, setIsRefreshing] = useState(false);

	const onRefresh = useCallback(async () => {
		setIsRefreshing(true);
		try {
			await Promise.all([refetchFriends(), refetchPermissions()]);
		} finally {
			setIsRefreshing(false);
		}
	}, [refetchFriends, refetchPermissions]);

	useFocusEffect(
		useCallback(() => {
			refetchFriends();
			refetchPermissions();
		}, [refetchFriends, refetchPermissions])
	);

	return { isRefreshing, onRefresh };
}
