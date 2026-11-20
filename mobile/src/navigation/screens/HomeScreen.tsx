import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PlaylistStackParamList } from '@/features/playlists/types';
import { HomeContainer } from '@/features/playlists/home/components/HomeContainer';
import { NearbyEventsContainer } from '@/features/events/features/nearby/components/NearbyEventsContainer';
import { SimilarProfilesContainer } from '@/features/user/features/friends/features/similar-profiles/components/SimilarProfilesContainer';
import { PlanContainer } from '@/features/subscription/PlanContainer';

type HomeScreenProps = NativeStackScreenProps<PlaylistStackParamList, 'Home'>;

/** Features never import each other, so the events and profiles sections are passed in here. */
export function HomeScreen(props: HomeScreenProps) {
	return (
		<PlanContainer>
			{plan => (
				<HomeContainer
					{...props}
					premium={plan}
					nearbyEvents={<NearbyEventsContainer />}
					similarProfiles={<SimilarProfilesContainer />}
				/>
			)}
		</PlanContainer>
	);
}
