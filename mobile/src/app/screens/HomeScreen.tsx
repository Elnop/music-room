import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PlaylistStackParamList } from '@/features/playlists/shared/playlist/playlistTypes';
import { HomeContainer } from '@/features/playlists/features/browse/features/home/components/HomeContainer';
import { NearbyEventsContainer } from '@/features/events/features/nearby/components/NearbyEventsContainer';
import { SimilarProfilesContainer } from '@/features/user/features/friends/features/similar-profiles/components/SimilarProfilesContainer';
import { PlanContainer } from '@/features/subscription/PlanContainer';
import { PlaylistCardMenuContainer } from '@/features/playlists/features/editor/features/card-menu/PlaylistCardMenuContainer';

type HomeScreenProps = NativeStackScreenProps<PlaylistStackParamList, 'Home'>;

export function HomeScreen(props: HomeScreenProps) {
	return (
		<PlanContainer>
			{(plan) => (
				<PlaylistCardMenuContainer navigation={props.navigation} premium={plan}>
					{(actionsFor) => (
						<HomeContainer
							{...props}
							onPlaylistActions={actionsFor}
							nearbyEvents={<NearbyEventsContainer />}
							similarProfiles={<SimilarProfilesContainer />}
						/>
					)}
				</PlaylistCardMenuContainer>
			)}
		</PlanContainer>
	);
}
