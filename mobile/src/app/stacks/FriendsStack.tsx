import React from 'react';
import { TrackActionsSheet } from '@/app/TrackActionsSheet';
import { playbackActions } from '@/features/playback/lib/playbackActions';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FriendsContainer } from '@/features/user/features/friends/features/friends-list/components/FriendsContainer';
import { UserProfileContainer } from '@/features/user/features/friends/features/user-profile/components/UserProfileContainer';
import { PlaylistDetailScreen } from '@/app/screens/PlaylistDetailScreen';
import { SearchTracksContainer } from '@/features/playlists/features/editor/features/search-tracks/components/SearchTracksContainer';
import type { FriendsStackParamList } from '@/features/user/features/friends/types';
import { screenLayout } from '@/features/shell/screenLayout';
import { useStackOptions } from '@/features/shell/hooks/useStackOptions';
import { FriendListeningContainer } from '@/features/playback/features/control-delegation/FriendListeningContainer';

export type { FriendsStackParamList };

const FriendsStack = createNativeStackNavigator<FriendsStackParamList>();
const layout = screenLayout(true);

export function FriendsNavigator() {
	const stackOptions = useStackOptions();

	return (
		<FriendsStack.Navigator screenLayout={layout} screenOptions={stackOptions}>
			<FriendsStack.Screen
				name="Friends"
				component={FriendsContainer}
				options={{ title: 'Amis' }}
			/>
			<FriendsStack.Screen name="UserProfile" options={{ title: '', headerTitle: '' }}>
				{props => (
					<FriendListeningContainer userId={props.route.params.userId}>
						{listening => <UserProfileContainer {...props} listening={listening} />}
					</FriendListeningContainer>
				)}
			</FriendsStack.Screen>
			<FriendsStack.Screen name="PlaylistDetail" options={{ headerShown: false }}>
				{props => <PlaylistDetailScreen {...props} />}
			</FriendsStack.Screen>
			<FriendsStack.Screen name="SearchTracks" options={{ title: 'Ajouter des musiques' }}>
				{props => (
					<SearchTracksContainer
						{...props}
						TrackActionsSheet={TrackActionsSheet}
						playback={playbackActions}
					/>
				)}
			</FriendsStack.Screen>
		</FriendsStack.Navigator>
	);
}
