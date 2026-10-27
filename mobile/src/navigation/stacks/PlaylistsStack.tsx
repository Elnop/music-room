import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { PlaylistStackParamList } from '@/features/playlists/types';
import type { EventStackParamList } from '@/features/events/types';
import { LibraryOrchestrator } from '@/features/playlists/library/components/orchestrators/LibraryOrchestrator';
import { PlaylistDetailOrchestrator } from '@/features/playlists/detail/components/orchestrators/PlaylistDetailOrchestrator';
import { PlaylistFormOrchestrator } from '@/features/playlists/form/components/orchestrators/PlaylistFormOrchestrator';
import { SearchTracksOrchestrator } from '@/features/playlists/searchTracks/components/orchestrators/SearchTracksOrchestrator';
import { PlaylistSharingOrchestrator } from '@/features/playlists/sharing/components/orchestrators/PlaylistSharingOrchestrator';
import { EventDetailOrchestrator } from '@/features/events/detail/components/orchestrators/EventDetailOrchestrator';
import { EventFormOrchestrator } from '@/features/events/form/components/orchestrators/EventFormOrchestrator';
import { HomeScreen } from '@/navigation/screens/HomeScreen';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { screenHeader, screenLayout } from '@/navigation/screenLayout';

const PlaylistStack = createNativeStackNavigator<PlaylistStackParamList & EventStackParamList>();
const layout = screenLayout(true);

interface PlaylistsNavigatorProps {
	/** The Home and Playlists tabs mount the same stack, each opening on its own screen. */
	initialRouteName: 'Home' | 'Playlists';
}

export function PlaylistsNavigator({ initialRouteName }: PlaylistsNavigatorProps) {
	const { theme } = useTheme();
	const { isWide } = useBreakpoint();

	return (
		<PlaylistStack.Navigator
			screenLayout={layout}
			initialRouteName={initialRouteName}
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
			<PlaylistStack.Screen
				name="EventDetail"
				component={EventDetailOrchestrator}
				options={{ title: 'Événement' }}
			/>
			<PlaylistStack.Screen
				name="EventForm"
				component={EventFormOrchestrator}
				options={({ route }) => ({
					title: route.params?.eventId ? "Modifier l'événement" : 'Nouvel événement',
				})}
			/>
		</PlaylistStack.Navigator>
	);
}
