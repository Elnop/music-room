import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUserMusicPreferences, useUserStats } from '@/features/profile/hooks/useProfileQueries';
import type { ProfileStackParamList } from '@/features/profile/types';
import { usePlayerHeight } from '@/shared/services/playbackBridge';
import { logout, useSession } from '@/shared/services/authSession';
import { useTheme } from '@/shared/theme/ThemeContext';
import { logger } from '@/shared/utils/logger';

export function useProfileScreen() {
	const { theme } = useTheme();
	const playerHeight = usePlayerHeight();
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
			// Silently fail - data is optional and errors during logout are expected
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
		playerHeight,
		user,
		navigation,
		stats: statsQuery.data,
		genres: preferencesQuery.data?.genres || [],
		isRefreshing,
		isLoading: isLoggingOut,
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
