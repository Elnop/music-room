import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PlaylistStackParamList } from '@/features/playlists/shared/playlist/lib/types';
import { HomeContainer } from '@/features/playlists/features/browse/features/home/components/HomeContainer';
import { NearbyEventsContainer } from '@/features/events/features/nearby/components/NearbyEventsContainer';
import { SimilarProfilesContainer } from '@/features/user/features/friends/features/similar-profiles/components/SimilarProfilesContainer';
import { PlanContainer } from '@/features/subscription/PlanContainer';
import { PlaylistCardMenuContainer } from '@/features/playlists/features/editor/features/card-menu/PlaylistCardMenuContainer';

type HomeScreenProps = NativeStackScreenProps<PlaylistStackParamList, 'Home'>;

/** Features never import each other, so the events and profiles sections are passed in here. */
export function HomeScreen(props: HomeScreenProps) {
	return (
		<PlanContainer>
			{plan => (
				<PlaylistCardMenuContainer navigation={props.navigation} premium={plan}>
					{actionsFor => (
						<HomeContainer
							{...props}
							actionsFor={actionsFor}
							nearbyEvents={<NearbyEventsContainer />}
							similarProfiles={<SimilarProfilesContainer />}
						/>
					)}
				</PlaylistCardMenuContainer>
			)}
		</PlanContainer>
	);
}
