/**
 * Profile Feature Navigation Stack
 *
 * Architecture:
 * - Toutes les pages utilisent le header natif avec effet liquid glass sur iOS
 */

import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/shared/theme/ThemeContext';
import { ProfileOrchestrator } from '@/features/profile/profileScreen/orchestrators/ProfileOrchestrator';
import { EditProfileOrchestrator } from '@/features/profile/editProfile/orchestrators/EditProfileOrchestrator';
import { PrivacySettingsOrchestrator } from '@/features/profile/privacySettings/orchestrators/PrivacySettingsOrchestrator';
import { LinkedAccountsOrchestrator } from '@/features/profile/linkedAccounts/orchestrators/LinkedAccountsOrchestrator';
import { MusicPreferencesOrchestrator } from '@/features/profile/musicPreferences/orchestrators/MusicPreferencesOrchestrator';
import { SettingsOrchestrator } from '@/features/profile/settings/orchestrators/SettingsOrchestrator';
import { MyDevicesScreen } from '@/screens/profile/MyDevicesScreen';
import type { ProfileStackParamList } from '@/features/profile/types';

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
				component={ProfileOrchestrator}
				options={{ title: 'Mon Profil' }}
			/>
			<ProfileStack.Screen
				name="EditProfile"
				component={EditProfileOrchestrator}
				options={{ title: 'Éditer le profil' }}
			/>
			<ProfileStack.Screen
				name="PrivacySettings"
				component={PrivacySettingsOrchestrator}
				options={{ title: 'Confidentialité' }}
			/>
			<ProfileStack.Screen
				name="LinkedAccounts"
				component={LinkedAccountsOrchestrator}
				options={{ title: 'Comptes liés' }}
			/>
			<ProfileStack.Screen
				name="MyDevices"
				component={MyDevicesScreen}
				options={{ title: 'Mes appareils' }}
			/>
			<ProfileStack.Screen
				name="MusicPreferences"
				component={MusicPreferencesOrchestrator}
				options={{ title: 'Préférences musicales' }}
			/>
			<ProfileStack.Screen
				name="Settings"
				component={SettingsOrchestrator}
				options={{ title: 'Réglages' }}
			/>
		</ProfileStack.Navigator>
	);
}
