import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileContainer } from '@/features/user/features/profile/features/profile-screen/components/ProfileContainer';
import { EditProfileContainer } from '@/features/user/features/profile/features/edit-profile/components/EditProfileContainer';
import { PrivacySettingsContainer } from '@/features/user/features/profile/features/privacy-settings/components/PrivacySettingsContainer';
import { LinkedAccountsContainer } from '@/features/user/features/auth/features/linked-accounts/components/LinkedAccountsContainer';
import { MusicPreferencesContainer } from '@/features/user/features/profile/features/music-preferences/components/MusicPreferencesContainer';
import { SettingsContainer } from '@/features/user/features/settings/components/SettingsContainer';
import { MyDevicesContainer } from '@/features/playback/features/control-delegation/features/my-devices/components/orchestrators/MyDevicesContainer';
import { PrivacyPolicyContainer } from '@/features/legal/components/PrivacyPolicyContainer';
import type { ProfileStackParamList } from '@/features/user/features/profile/types';
import { screenLayout } from '@/features/shell/screenLayout';
import { useStackOptions } from '@/features/shell/hooks/useStackOptions';
import { useShellLayout } from '@/features/shell/hooks/useShellLayout';
import { PlanContainer } from '@/features/subscription/PlanContainer';
import { BackendUrlFieldContainer } from '@/features/shell/components/orchestrators/BackendUrlFieldContainer';

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const layout = screenLayout(true);

export function ProfileNavigator() {
	const stackOptions = useStackOptions();
	const { isWide } = useShellLayout();

	return (
		<ProfileStack.Navigator screenLayout={layout} screenOptions={stackOptions}>
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
				{() => (
					<PlanContainer>
						{plan => (
							<SettingsContainer
								subscription={plan}
								backendUrlField={<BackendUrlFieldContainer />}
							/>
						)}
					</PlanContainer>
				)}
			</ProfileStack.Screen>
			<ProfileStack.Screen
				name="PrivacyPolicy"
				component={PrivacyPolicyContainer}
				options={{ title: 'Politique de confidentialité' }}
			/>
		</ProfileStack.Navigator>
	);
}
