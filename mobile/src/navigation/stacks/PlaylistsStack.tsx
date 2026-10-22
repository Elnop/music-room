/**
 * Playlists Feature Navigation Stack
 *
 * Architecture:
 * - Toutes les pages utilisent le header natif avec effet liquid glass sur iOS
 * - Pages avec gradient: header transparent (headerTransparent: true)
 */

import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { PlaylistStackParamList } from '@/features/playlists/types';
import { PlaylistsOrchestrator } from '@/features/playlists/list/components/orchestrators/PlaylistsOrchestrator';
import { PlaylistDetailOrchestrator } from '@/features/playlists/detail/components/orchestrators/PlaylistDetailOrchestrator';
import { PlaylistFormOrchestrator } from '@/features/playlists/form/components/orchestrators/PlaylistFormOrchestrator';
import { SearchTracksOrchestrator } from '@/features/playlists/searchTracks/components/orchestrators/SearchTracksOrchestrator';
import { PlaylistSharingOrchestrator } from '@/features/playlists/sharing/components/orchestrators/PlaylistSharingOrchestrator';

const PlaylistStack = createNativeStackNavigator<PlaylistStackParamList>();

export function PlaylistsNavigator() {
	const { theme } = useTheme();

	return (
		<PlaylistStack.Navigator
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
				headerLargeTitle: false,
			}}
		>
			<PlaylistStack.Screen
				name="Playlists"
				component={PlaylistsOrchestrator}
				options={{ title: 'Playlists' }}
			/>
			<PlaylistStack.Screen
				name="PlaylistDetail"
				component={PlaylistDetailOrchestrator}
				options={{
					headerTransparent: true,
					headerBlurEffect: undefined,
					headerStyle: { backgroundColor: 'transparent' },
					title: '',
				}}
			/>
			<PlaylistStack.Screen
				name="CreatePlaylist"
				component={PlaylistFormOrchestrator}
				options={({ route }) => ({
					title: route.params?.playlistId ? 'Modifier la playlist' : 'Nouvelle Playlist',
				})}
			/>
			<PlaylistStack.Screen
				name="SearchTracks"
				component={SearchTracksOrchestrator}
				options={{ title: 'Ajouter des titres' }}
			/>
			<PlaylistStack.Screen
				name="PlaylistSharing"
				component={PlaylistSharingOrchestrator}
				options={{ title: 'Visibilité et droits' }}
			/>
		</PlaylistStack.Navigator>
	);
}
