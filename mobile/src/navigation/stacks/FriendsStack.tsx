/**
 * Friends Feature Navigation Stack
 *
 * Architecture:
 * - Toutes les pages utilisent le header natif avec effet liquid glass sur iOS
 * - Pages avec gradient: header transparent (headerTransparent: true)
 */

import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/contexts/ThemeContext';
import { FriendsScreen } from '@/screens/friends/FriendsScreen';
import { UserProfileScreen } from '@/screens/friends/UserProfileScreen';
import { PlaylistDetailScreen } from '@/screens/playlists/PlaylistDetailScreen';
import { SearchTracksScreen } from '@/screens/playlists/SearchTracksScreen';

export type FriendsStackParamList = {
	Friends: undefined;
	UserProfile: { userId: string };
	PlaylistDetail: { id: string };
	SearchTracks: { playlistId: string };
};

const FriendsStack = createNativeStackNavigator<FriendsStackParamList>();

export function FriendsNavigator() {
	const { theme } = useTheme();

	return (
		<FriendsStack.Navigator
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
			<FriendsStack.Screen name="Friends" component={FriendsScreen} options={{ title: 'Amis' }} />
			<FriendsStack.Screen
				name="UserProfile"
				component={UserProfileScreen}
				options={{ title: '' }}
			/>
			<FriendsStack.Screen
				name="PlaylistDetail"
				component={PlaylistDetailScreen}
				options={{ headerShown: false }}
			/>
			<FriendsStack.Screen
				name="SearchTracks"
				component={SearchTracksScreen}
				options={{ title: 'Ajouter des musiques' }}
			/>
		</FriendsStack.Navigator>
	);
}
