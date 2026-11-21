import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { PlaylistStackParamList } from '@/features/playlists/shared/playlist/playlistTypes';
import type { EventStackParamList } from '@/features/events/eventTypes';
import { HomeScreen } from '@/app/screens/HomeScreen';
import { LibraryScreen } from '@/app/screens/LibraryScreen';
import { PlaylistDetailScreen } from '@/app/screens/PlaylistDetailScreen';
import { playbackActions } from '@/features/playback/lib/playbackActions';
import { SearchTracksScreen } from '@/app/screens/SearchTracksScreen';
import { PlaylistFormContainer } from '@/features/playlists/features/editor/features/playlist-form/components/PlaylistFormContainer';
import { PlaylistSharingContainer } from '@/features/playlists/features/editor/features/sharing/components/PlaylistSharingContainer';
import { EventDetailContainer } from '@/features/events/features/detail/components/EventDetailContainer';
import { EventFormContainer } from '@/features/events/features/event-form/components/EventFormContainer';
import { screenLayout } from '@/features/shell/screenLayout';
import { useStackOptions } from '@/features/shell/hooks/useStackOptions';

const PlaylistStack = createNativeStackNavigator<PlaylistStackParamList & EventStackParamList>();
const layout = screenLayout(true);

const PLAYLIST_DETAIL_OPTIONS = {
	headerTransparent: true,
	headerBlurEffect: undefined,
	headerStyle: { backgroundColor: 'transparent' },
	title: '',
};

type PlaylistsNavigatorProps = {
	initialRouteName: 'Home' | 'Playlists';
};

function editorScreens() {
	return (
		<>
			<PlaylistStack.Screen
				name="CreatePlaylist"
				component={PlaylistFormContainer}
				options={({ route }) => ({
					title: route.params?.playlistId ? 'Modifier la playlist' : 'Nouvelle Playlist',
				})}
			/>
			<PlaylistStack.Screen name="SearchTracks" options={{ title: 'Ajouter des titres' }}>
				{props => <SearchTracksScreen {...props} playback={playbackActions} />}
			</PlaylistStack.Screen>
			<PlaylistStack.Screen
				name="PlaylistSharing"
				component={PlaylistSharingContainer}
				options={{ title: 'Visibilité et droits' }}
			/>
		</>
	);
}

function eventScreens() {
	return (
		<>
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
		</>
	);
}

export function PlaylistsNavigator({ initialRouteName }: PlaylistsNavigatorProps) {
	const stackOptions = useStackOptions();

	return (
		<PlaylistStack.Navigator
			screenLayout={layout}
			initialRouteName={initialRouteName}
			screenOptions={{ ...stackOptions, headerLargeTitle: false }}
		>
			<PlaylistStack.Screen name="Home" component={HomeScreen} options={{ title: 'Accueil' }} />
			<PlaylistStack.Screen
				name="Playlists"
				component={LibraryScreen}
				options={{ title: 'Playlists' }}
			/>
			<PlaylistStack.Screen name="PlaylistDetail" options={PLAYLIST_DETAIL_OPTIONS}>
				{props => <PlaylistDetailScreen {...props} />}
			</PlaylistStack.Screen>
			{editorScreens()}
			{eventScreens()}
		</PlaylistStack.Navigator>
	);
}
