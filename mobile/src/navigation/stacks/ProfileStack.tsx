/**
 * Profile Feature Navigation Stack
 *
 * Architecture:
 * - Toutes les pages utilisent le header natif avec effet liquid glass sur iOS
 */

import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/contexts/ThemeContext';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { EditProfileScreen } from '@/screens/profile/EditProfileScreen';
import { PrivacySettingsScreen } from '@/screens/profile/PrivacySettingsScreen';
import { MusicPreferencesScreen } from '@/screens/profile/MusicPreferencesScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';

export type ProfileStackParamList = {
	Profile: undefined;
	EditProfile: undefined;
	PrivacySettings: undefined;
	MusicPreferences: undefined;
	Settings: undefined;
};

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
	const { theme } = useTheme();

	return (
		<ProfileStack.Navigator
			screenOptions={{
				// Header opaque avec effet blur natif sur iOS
				headerStyle: {
					backgroundColor: theme.colors.background,
				},
				headerBlurEffect: Platform.OS === 'ios' ? 'systemMaterialDark' : undefined,
				headerTintColor: theme.colors.text,
				headerShadowVisible: false,
				headerTitleStyle: {
					fontWeight: theme.typography.weights.bold,
				},
				headerTitleAlign: 'center',
			}}
		>
			<ProfileStack.Screen
				name="Profile"
				component={ProfileScreen}
				options={{ title: 'Mon Profil' }}
			/>
			<ProfileStack.Screen
				name="EditProfile"
				component={EditProfileScreen}
				options={{ title: 'Éditer le profil' }}
			/>
			<ProfileStack.Screen
				name="PrivacySettings"
				component={PrivacySettingsScreen}
				options={{ title: 'Confidentialité' }}
			/>
			<ProfileStack.Screen
				name="MusicPreferences"
				component={MusicPreferencesScreen}
				options={{ title: 'Préférences musicales' }}
			/>
			<ProfileStack.Screen
				name="Settings"
				component={SettingsScreen}
				options={{ title: 'Settings' }}
			/>
		</ProfileStack.Navigator>
	);
}
