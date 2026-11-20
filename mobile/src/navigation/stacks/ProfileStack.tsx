import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/shared/theme/ThemeContext';
import { ProfileContainer } from '@/features/profile/profileScreen/components/ProfileContainer';
import { EditProfileContainer } from '@/features/profile/editProfile/components/EditProfileContainer';
import { PrivacySettingsContainer } from '@/features/profile/privacySettings/components/PrivacySettingsContainer';
import { LinkedAccountsContainer } from '@/features/profile/linkedAccounts/components/LinkedAccountsContainer';
import { MusicPreferencesContainer } from '@/features/profile/musicPreferences/components/MusicPreferencesContainer';
import { SettingsContainer } from '@/features/profile/settings/components/SettingsContainer';
import { MyDevicesContainer } from '@/features/music-control/myDevices/components/orchestrators/MyDevicesContainer';
import { PrivacyPolicyContainer } from '@/features/legal/privacyPolicy/components/PrivacyPolicyContainer';
import type { ProfileStackParamList } from '@/features/profile/types';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { screenHeader, screenLayout } from '@/navigation/screenLayout';
import { headerTitle } from '@/shared/theme/pixelFrame';

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
				headerTitleStyle: headerTitle(theme),
				headerTitleAlign: 'center',
			}}
		>
			<ProfileStack.Screen
				name="Profile"
				component={ProfileContainer}
				// Wide screens show the title and the header's actions in the profile's own header.
				options={{ title: 'Mon Profil', headerShown: !isWide }}
			/>
			<ProfileStack.Screen
				name="EditProfile"
				component={EditProfileContainer}
				options={{ title: 'Éditer le profil' }}
			/>
			<ProfileStack.Screen
				name="PrivacySettings"
				component={PrivacySettingsContainer}
				options={{ title: 'Confidentialité' }}
			/>
			<ProfileStack.Screen
				name="LinkedAccounts"
				component={LinkedAccountsContainer}
				options={{ title: 'Comptes liés' }}
			/>
			<ProfileStack.Screen
				name="MyDevices"
				component={MyDevicesContainer}
				options={{ title: 'Mes appareils' }}
			/>
			<ProfileStack.Screen
				name="MusicPreferences"
				component={MusicPreferencesContainer}
				options={{ title: 'Préférences musicales' }}
			/>
			<ProfileStack.Screen
				name="Settings"
				component={SettingsContainer}
				options={{ title: 'Réglages' }}
			/>
			<ProfileStack.Screen
				name="PrivacyPolicy"
				component={PrivacyPolicyContainer}
				options={{ title: 'Politique de confidentialité' }}
			/>
		</ProfileStack.Navigator>
	);
}
