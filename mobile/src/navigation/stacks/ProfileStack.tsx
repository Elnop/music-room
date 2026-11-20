import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import { ProfileContainer } from '@/features/user/features/profile/features/profile-screen/components/ProfileContainer';
import { EditProfileContainer } from '@/features/user/features/profile/features/edit-profile/components/EditProfileContainer';
import { PrivacySettingsContainer } from '@/features/user/features/profile/features/privacy-settings/components/PrivacySettingsContainer';
import { LinkedAccountsContainer } from '@/features/user/features/auth/features/linked-accounts/components/LinkedAccountsContainer';
import { MusicPreferencesContainer } from '@/features/user/features/profile/features/music-preferences/components/MusicPreferencesContainer';
import { SettingsContainer } from '@/features/user/features/settings/components/SettingsContainer';
import { MyDevicesContainer } from '@/features/music-control/myDevices/components/orchestrators/MyDevicesContainer';
import { PrivacyPolicyContainer } from '@/features/legal/components/PrivacyPolicyContainer';
import type { ProfileStackParamList } from '@/features/user/features/profile/types';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { screenHeader, screenLayout } from '@/navigation/screenLayout';
import { headerTitle } from '@/shared/theme/lib/pixelFrame';
import { PlanContainer } from '@/features/subscription/PlanContainer';
import { BackendUrlField } from '@/navigation/BackendUrlField';

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
			<ProfileStack.Screen name="Settings" options={{ title: 'Réglages' }}>
				{() => <PlanContainer>{plan => <SettingsContainer subscription={plan} backendUrlField={<BackendUrlField />} />}</PlanContainer>}
			</ProfileStack.Screen>
			<ProfileStack.Screen
				name="PrivacyPolicy"
				component={PrivacyPolicyContainer}
				options={{ title: 'Politique de confidentialité' }}
			/>
		</ProfileStack.Navigator>
	);
}
