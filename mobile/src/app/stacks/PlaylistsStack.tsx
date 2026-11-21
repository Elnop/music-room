import React from 'react';
import { TrackActionsSheet } from '@/app/TrackActionsSheet';
import { playbackActions } from '@/features/playback/lib/playbackActions';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { PlaylistStackParamList } from '@/features/playlists/shared/playlist/lib/types';
import type { EventStackParamList } from '@/features/events/lib/types';
import { LibraryContainer } from '@/features/playlists/features/browse/features/library/components/LibraryContainer';
import { PlaylistDetailScreen } from '@/app/screens/PlaylistDetailScreen';
import { PlaylistFormContainer } from '@/features/playlists/features/editor/features/playlist-form/components/PlaylistFormContainer';
import { SearchTracksContainer } from '@/features/playlists/features/editor/features/search-tracks/components/SearchTracksContainer';
import { PlaylistSharingContainer } from '@/features/playlists/features/editor/features/sharing/components/PlaylistSharingContainer';
import { EventDetailContainer } from '@/features/events/features/detail/components/EventDetailContainer';
import { EventFormContainer } from '@/features/events/features/event-form/components/EventFormContainer';
import { HomeScreen } from '@/app/screens/HomeScreen';
import { screenLayout } from '@/features/shell/screenLayout';
import { useStackOptions } from '@/features/shell/hooks/useStackOptions';
import { PlanContainer } from '@/features/subscription/PlanContainer';
import { PlaylistCardMenuContainer } from '@/features/playlists/features/editor/features/card-menu/PlaylistCardMenuContainer';

const PlaylistStack = createNativeStackNavigator<PlaylistStackParamList & EventStackParamList>();
const layout = screenLayout(true);

interface PlaylistsNavigatorProps {
	initialRouteName: 'Home' | 'Playlists';
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
			<PlaylistStack.Screen name="Playlists" options={{ title: 'Playlists' }}>
				{props => (
					<PlanContainer>
						{plan => (
							<PlaylistCardMenuContainer navigation={props.navigation} premium={plan}>
								{actionsFor => <LibraryContainer {...props} actionsFor={actionsFor} />}
							</PlaylistCardMenuContainer>
						)}
					</PlanContainer>
				)}
			</PlaylistStack.Screen>
			<PlaylistStack.Screen
				name="PlaylistDetail"
				options={{
					headerTransparent: true,
					headerBlurEffect: undefined,
					headerStyle: { backgroundColor: 'transparent' },
					title: '',
				}}
			>
				{props => <PlaylistDetailScreen {...props} />}
			</PlaylistStack.Screen>
			<PlaylistStack.Screen
				name="CreatePlaylist"
				component={PlaylistFormContainer}
				options={({ route }) => ({
					title: route.params?.playlistId ? 'Modifier la playlist' : 'Nouvelle Playlist',
				})}
			/>
			<PlaylistStack.Screen name="SearchTracks" options={{ title: 'Ajouter des titres' }}>
				{props => (
					<SearchTracksContainer
						{...props}
						TrackActionsSheet={TrackActionsSheet}
						playback={playbackActions}
					/>
				)}
			</PlaylistStack.Screen>
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
