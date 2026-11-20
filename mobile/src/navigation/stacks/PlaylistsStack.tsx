import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { PlaylistStackParamList } from '@/features/playlists/types';
import type { EventStackParamList } from '@/features/events/types';
import { LibraryContainer } from '@/features/playlists/library/components/LibraryContainer';
import { PlaylistDetailContainer } from '@/features/playlists/detail/components/orchestrators/PlaylistDetailContainer';
import { PlaylistFormContainer } from '@/features/playlists/form/components/PlaylistFormContainer';
import { SearchTracksContainer } from '@/features/playlists/searchTracks/components/SearchTracksContainer';
import { PlaylistSharingContainer } from '@/features/playlists/sharing/components/PlaylistSharingContainer';
import { EventDetailContainer } from '@/features/events/detail/components/EventDetailContainer';
import { EventFormContainer } from '@/features/events/form/components/EventFormContainer';
import { HomeScreen } from '@/navigation/screens/HomeScreen';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { screenHeader, screenLayout } from '@/navigation/screenLayout';
import { headerTitle } from '@/shared/theme/pixelFrame';

const PlaylistStack = createNativeStackNavigator<PlaylistStackParamList & EventStackParamList>();
const layout = screenLayout(true);

interface PlaylistsNavigatorProps {
	/** The Home and Playlists tabs mount this same stack. */
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
				headerTitleStyle: headerTitle(theme),
				headerTitleAlign: 'center',
				headerLargeTitle: false,
			}}
		>
			<PlaylistStack.Screen name="Home" component={HomeScreen} options={{ title: 'Accueil' }} />
			<PlaylistStack.Screen
				name="Playlists"
				component={LibraryContainer}
				options={{ title: 'Playlists' }}
			/>
			<PlaylistStack.Screen
				name="PlaylistDetail"
				component={PlaylistDetailContainer}
				options={{
					headerTransparent: true,
					headerBlurEffect: undefined,
					headerStyle: { backgroundColor: 'transparent' },
					title: '',
				}}
			/>
			<PlaylistStack.Screen
				name="CreatePlaylist"
				component={PlaylistFormContainer}
				options={({ route }) => ({
					title: route.params?.playlistId ? 'Modifier la playlist' : 'Nouvelle Playlist',
				})}
			/>
			<PlaylistStack.Screen
				name="SearchTracks"
				component={SearchTracksContainer}
				options={{ title: 'Ajouter des titres' }}
			/>
			<PlaylistStack.Screen
				name="PlaylistSharing"
				component={PlaylistSharingContainer}
				options={{ title: 'Visibilité et droits' }}
			/>
			<PlaylistStack.Screen
				name="EventDetail"
				component={EventDetailContainer}
				options={{ title: 'Événement' }}
			/>
			<PlaylistStack.Screen
				name="EventForm"
				component={EventFormContainer}
				options={({ route }) => ({
					title: route.params?.eventId ? "Modifier l'événement" : 'Nouvel événement',
				})}
			/>
		</PlaylistStack.Navigator>
	);
}
