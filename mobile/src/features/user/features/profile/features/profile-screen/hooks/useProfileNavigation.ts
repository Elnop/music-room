import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '@/features/user/features/profile/profileTypes';

export function useProfileNavigation() {
	const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

	const onEditProfile = useCallback(() => {
		navigation.navigate('EditProfile');
	}, [navigation]);

	const onSettings = useCallback(() => {
		navigation.navigate('Settings');
	}, [navigation]);

	return {
		navigation,
		actions: {
			onEditProfile,
			onSettings,
			onMusicPreferences: () => navigation.navigate('MusicPreferences'),
			onPrivacySettings: () => navigation.navigate('PrivacySettings'),
			onLinkedAccounts: () => navigation.navigate('LinkedAccounts'),
			onMyDevices: () => navigation.navigate('MyDevices'),
		},
	};
}
