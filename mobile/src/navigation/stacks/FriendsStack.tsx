import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import { FriendsContainer } from '@/features/user/features/friends/features/friends-list/components/FriendsContainer';
import { UserProfileContainer } from '@/features/user/features/friends/features/user-profile/components/UserProfileContainer';
import { PlaylistDetailContainer } from '@/features/playlists/detail/components/orchestrators/PlaylistDetailContainer';
import { SearchTracksContainer } from '@/features/playlists/searchTracks/components/SearchTracksContainer';
import type { FriendsStackParamList } from '@/features/user/features/friends/types';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { screenHeader, screenLayout } from '@/navigation/screenLayout';
import { headerTitle } from '@/shared/theme/lib/pixelFrame';
import { PlanContainer } from '@/features/subscription/PlanContainer';

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
				headerTitleStyle: headerTitle(theme),
				headerTitleAlign: 'center',
			}}
		>
			<FriendsStack.Screen
				name="Friends"
				component={FriendsContainer}
				options={{ title: 'Amis' }}
			/>
			<FriendsStack.Screen
				name="UserProfile"
				component={UserProfileContainer}
				options={{ title: '', headerTitle: '' }}
			/>
			<FriendsStack.Screen name="PlaylistDetail" options={{ headerShown: false }}>
				{props => (
					<PlanContainer>{plan => <PlaylistDetailContainer {...props} premium={plan} />}</PlanContainer>
				)}
			</FriendsStack.Screen>
			<FriendsStack.Screen
				name="SearchTracks"
				component={SearchTracksContainer}
				options={{ title: 'Ajouter des musiques' }}
			/>
		</FriendsStack.Navigator>
	);
}
