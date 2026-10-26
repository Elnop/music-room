import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { PlaylistStackParamList } from '@/features/playlists/types';
import { LibraryOrchestrator } from '@/features/playlists/library/components/orchestrators/LibraryOrchestrator';
import { PlaylistDetailOrchestrator } from '@/features/playlists/detail/components/orchestrators/PlaylistDetailOrchestrator';
import { PlaylistFormOrchestrator } from '@/features/playlists/form/components/orchestrators/PlaylistFormOrchestrator';
import { SearchTracksOrchestrator } from '@/features/playlists/searchTracks/components/orchestrators/SearchTracksOrchestrator';
import { PlaylistSharingOrchestrator } from '@/features/playlists/sharing/components/orchestrators/PlaylistSharingOrchestrator';
import { HomeScreen } from '@/navigation/screens/HomeScreen';

const PlaylistStack = createNativeStackNavigator<PlaylistStackParamList>();

interface PlaylistsNavigatorProps {
	/** The Home and Playlists tabs mount the same stack, each opening on its own screen. */
	initialRouteName: 'Home' | 'Playlists';
}

export function PlaylistsNavigator({ initialRouteName }: PlaylistsNavigatorProps) {
	const { theme } = useTheme();

	return (
		<PlaylistStack.Navigator
			initialRouteName={initialRouteName}
			screenOptions={{
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
			<PlaylistStack.Screen name="Home" component={HomeScreen} options={{ title: 'Accueil' }} />
			<PlaylistStack.Screen
				name="Playlists"
				component={LibraryOrchestrator}
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
