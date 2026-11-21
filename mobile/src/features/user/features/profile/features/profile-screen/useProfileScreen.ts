import { useCallback, useState } from 'react';
import { showAlert } from '@/shared/alerts/alert';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
	useUserMusicPreferences,
	useUserStats,
} from '@/features/user/features/profile/shared/profile/hooks/useProfileQueries';
import type { ProfileStackParamList } from '@/features/user/features/profile/types';
import { useBottomPadding } from '@/shared/theme/hooks/useBottomPadding';
import { logout, useSession } from '@/shared/backend/lib/authSession';
import { getBuildLabel } from '@/shared/backend/deviceService';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import { logger } from '@/shared/logging/logger';

export function useProfileScreen() {
	const { theme } = useTheme();
	const bottomPadding = useBottomPadding();
	const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
	const user = useSession(s => s.user);

	const [isRefreshing, setIsRefreshing] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	const preferencesQuery = useUserMusicPreferences();
	const statsQuery = useUserStats();

	const handleEditProfile = useCallback(() => {
		navigation.navigate('EditProfile');
	}, [navigation]);

	const handleSettings = useCallback(() => {
		navigation.navigate('Settings');
	}, [navigation]);

	const refetchData = useCallback(async () => {
		await Promise.all([preferencesQuery.refetch(), statsQuery.refetch()]);
	}, [preferencesQuery, statsQuery]);

	useFocusEffect(
		useCallback(() => {
			void refetchData();
		}, [refetchData])
	);

	const handleRefresh = useCallback(async () => {
		setIsRefreshing(true);
		await refetchData();
		setIsRefreshing(false);
	}, [refetchData]);

	const handleLogout = useCallback(async () => {
		try {
			setIsLoggingOut(true);
			await logout();
		} catch (error) {
			logger.error('[ProfileScreen] Logout failed:', error);
		} finally {
			setIsLoggingOut(false);
		}
	}, []);

	const confirmLogout = useCallback(() => {
		showAlert('Se déconnecter ?', 'Vous devrez vous reconnecter pour utiliser Zumik.', [
			{ text: 'Annuler', style: 'cancel' },
			{ text: 'Se déconnecter', style: 'destructive', onPress: handleLogout },
		]);
	}, [handleLogout]);

	return {
		theme,
		bottomPadding,
		user,
		navigation,
		stats: statsQuery.data,
		genres: preferencesQuery.data?.genres || [],
		isRefreshing,
		isLoading: isLoggingOut,
		buildLabel: getBuildLabel(),
		handleRefresh,
		handleEditProfile,
		handleSettings,
		handleMusicPreferences: () => navigation.navigate('MusicPreferences'),
		handlePrivacySettings: () => navigation.navigate('PrivacySettings'),
		handleLinkedAccounts: () => navigation.navigate('LinkedAccounts'),
		handleMyDevices: () => navigation.navigate('MyDevices'),
		confirmLogout,
	};
}
