import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
	useUserMusicPreferences,
	useUserStats,
} from '@/features/user/features/profile/shared/profile/hooks/useProfileQueries';
import { useRefreshing } from '@/features/user/features/profile/features/profile-screen/hooks/useRefreshing';

export function useProfileData() {
	const preferencesQuery = useUserMusicPreferences();
	const statsQuery = useUserStats();

	const refetchData = useCallback(async () => {
		await Promise.all([preferencesQuery.refetch(), statsQuery.refetch()]);
	}, [preferencesQuery, statsQuery]);

	useFocusEffect(
		useCallback(() => {
			void refetchData();
		}, [refetchData]),
	);

	const refresh = useRefreshing(refetchData);

	return { stats: statsQuery.data, genres: preferencesQuery.data?.genres || [], refresh };
}
