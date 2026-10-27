import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/shared/theme/ThemeContext';
import { ProfileOrchestrator } from '@/features/profile/profileScreen/components/orchestrators/ProfileOrchestrator';
import { EditProfileOrchestrator } from '@/features/profile/editProfile/components/orchestrators/EditProfileOrchestrator';
import { PrivacySettingsOrchestrator } from '@/features/profile/privacySettings/components/orchestrators/PrivacySettingsOrchestrator';
import { LinkedAccountsOrchestrator } from '@/features/profile/linkedAccounts/components/orchestrators/LinkedAccountsOrchestrator';
import { MusicPreferencesOrchestrator } from '@/features/profile/musicPreferences/components/orchestrators/MusicPreferencesOrchestrator';
import { SettingsOrchestrator } from '@/features/profile/settings/components/orchestrators/SettingsOrchestrator';
import { MyDevicesOrchestrator } from '@/features/music-control/myDevices/components/orchestrators/MyDevicesOrchestrator';
import { PrivacyPolicyOrchestrator } from '@/features/legal/privacyPolicy/components/orchestrators/PrivacyPolicyOrchestrator';
import type { ProfileStackParamList } from '@/features/profile/types';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { screenHeader, screenLayout } from '@/navigation/screenLayout';

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const layout = screenLayout(true);

export function ProfileNavigator() {
	const { theme } = useTheme();
	const { isWide } = useBreakpoint();

	return (
		<ProfileStack.Navigator
			screenLayout={layout}
			screenOptions={{
				...(isWide ? { header: screenHeader } : null),
				headerStyle: {
					backgroundColor: theme.colors.background,
				},
				headerBlurEffect: Platform.OS === 'ios' ? 'systemMaterialDark' : undefined,
				headerTintColor: theme.colors.text,
				headerShadowVisible: false,
				headerTitleStyle: {
					fontFamily: theme.typography.families.bold,
				},
				headerTitleAlign: 'center',
			}}
		>
			<ProfileStack.Screen
				name="Profile"
				component={ProfileOrchestrator}
				// Wide screens show the title and the header's actions in the profile's own header.
				options={{ title: 'Mon Profil', headerShown: !isWide }}
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
				component={MyDevicesOrchestrator}
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
			<ProfileStack.Screen
				name="PrivacyPolicy"
				component={PrivacyPolicyOrchestrator}
				options={{ title: 'Politique de confidentialité' }}
			/>
		</ProfileStack.Navigator>
	);
}
