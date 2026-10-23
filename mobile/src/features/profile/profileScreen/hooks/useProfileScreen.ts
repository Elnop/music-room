import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUserMusicPreferences, useUserStats } from '@/features/profile/hooks/useProfileQueries';
import type { ProfileStackParamList } from '@/features/profile/types';
import { useBottomPadding } from '@/shared/hooks/useBottomPadding';
import { logout, useSession } from '@/shared/services/authSession';
import { getBuildLabel } from '@/shared/services/deviceService';
import { useTheme } from '@/shared/theme/ThemeContext';
import { logger } from '@/shared/utils/logger';

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
		try {
			await Promise.all([preferencesQuery.refetch(), statsQuery.refetch()]);
		} catch {
			// Data is optional, and errors during logout are expected.
		}
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
		Alert.alert('Se déconnecter ?', 'Vous devrez vous reconnecter pour utiliser Zumik.', [
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
