import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FriendsContainer } from '@/features/user/features/friends/features/friends-list/components/FriendsContainer';
import { PlaylistDetailScreen } from '@/app/screens/PlaylistDetailScreen';
import { playbackActions } from '@/features/playback/lib/playbackActions';
import { SearchTracksScreen } from '@/app/screens/SearchTracksScreen';
import { UserProfileScreen } from '@/app/screens/UserProfileScreen';
import type { FriendsStackParamList } from '@/features/user/features/friends/types';
import { screenLayout } from '@/features/shell/screenLayout';
import { useStackOptions } from '@/features/shell/hooks/useStackOptions';

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
			<FriendsStack.Screen
				name="UserProfile"
				component={UserProfileScreen}
				options={{ title: '', headerTitle: '' }}
			/>
			<FriendsStack.Screen name="PlaylistDetail" options={{ headerShown: false }}>
				{props => <PlaylistDetailScreen {...props} />}
			</FriendsStack.Screen>
			<FriendsStack.Screen name="SearchTracks" options={{ title: 'Ajouter des musiques' }}>
				{props => <SearchTracksScreen {...props} playback={playbackActions} />}
			</FriendsStack.Screen>
		</FriendsStack.Navigator>
	);
}
