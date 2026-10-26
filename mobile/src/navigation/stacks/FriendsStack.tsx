import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/shared/theme/ThemeContext';
import { FriendsOrchestrator } from '@/features/friends/friendsList/components/orchestrators/FriendsOrchestrator';
import { UserProfileOrchestrator } from '@/features/friends/userProfile/components/orchestrators/UserProfileOrchestrator';
import { PlaylistDetailOrchestrator } from '@/features/playlists/detail/components/orchestrators/PlaylistDetailOrchestrator';
import { SearchTracksOrchestrator } from '@/features/playlists/searchTracks/components/orchestrators/SearchTracksOrchestrator';
import type { FriendsStackParamList } from '@/features/friends/types';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { screenHeader, screenLayout } from '@/navigation/screenLayout';

export type { FriendsStackParamList };

const FriendsStack = createNativeStackNavigator<FriendsStackParamList>();
const layout = screenLayout(true);

export function FriendsNavigator() {
	const { theme } = useTheme();
	const { isWide } = useBreakpoint();

	return (
		<FriendsStack.Navigator
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
					fontWeight: theme.typography.weights.bold,
				},
				headerTitleAlign: 'center',
			}}
		>
			<FriendsStack.Screen
				name="Friends"
				component={FriendsOrchestrator}
				options={{ title: 'Amis' }}
			/>
			<FriendsStack.Screen
				name="UserProfile"
				component={UserProfileOrchestrator}
				options={{ title: '' }}
			/>
			<FriendsStack.Screen
				name="PlaylistDetail"
				component={PlaylistDetailOrchestrator}
				options={{ headerShown: false }}
			/>
			<FriendsStack.Screen
				name="SearchTracks"
				component={SearchTracksOrchestrator}
				options={{ title: 'Ajouter des musiques' }}
			/>
		</FriendsStack.Navigator>
	);
}
