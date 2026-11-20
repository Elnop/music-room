import React from 'react';
import { TrackActionsSheetContainer } from '@/features/playlists/features/editor/features/track-actions/components/TrackActionsSheetContainer';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import type { PlaylistStackParamList } from '@/features/playlists/shared/playlist/lib/types';
import type { EventStackParamList } from '@/features/events/lib/types';
import { LibraryContainer } from '@/features/playlists/features/browse/features/library/components/LibraryContainer';
import { PlaylistDetailContainer } from '@/features/playlists/features/editor/features/detail/components/PlaylistDetailContainer';
import { PlaylistFormContainer } from '@/features/playlists/features/editor/features/playlist-form/components/PlaylistFormContainer';
import { SearchTracksContainer } from '@/features/playlists/features/editor/features/search-tracks/components/SearchTracksContainer';
import { PlaylistSharingContainer } from '@/features/playlists/features/editor/features/sharing/components/PlaylistSharingContainer';
import { EventDetailContainer } from '@/features/events/features/detail/components/EventDetailContainer';
import { EventFormContainer } from '@/features/events/features/event-form/components/EventFormContainer';
import { HomeScreen } from '@/navigation/screens/HomeScreen';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { screenHeader, screenLayout } from '@/navigation/screenLayout';
import { headerTitle } from '@/shared/theme/lib/pixelFrame';
import { PlanContainer } from '@/features/subscription/PlanContainer';
import { PlaylistCardMenuContainer } from '@/features/playlists/features/editor/features/card-menu/PlaylistCardMenuContainer';

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
				{props => (
					<PlanContainer>
						{plan => (
							<PlaylistDetailContainer
								{...props}
								premium={plan}
								TrackActionsSheet={TrackActionsSheetContainer}
							/>
						)}
					</PlanContainer>
				)}
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
					<SearchTracksContainer {...props} TrackActionsSheet={TrackActionsSheetContainer} />
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
