import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PlaylistStackParamList } from '@/features/playlists/types';
import { HomeContainer } from '@/features/playlists/home/components/HomeContainer';
import { NearbyEventsContainer } from '@/features/events/nearby/components/NearbyEventsContainer';
import { SimilarProfilesContainer } from '@/features/friends/similarProfiles/components/SimilarProfilesContainer';

type HomeScreenProps = NativeStackScreenProps<PlaylistStackParamList, 'Home'>;

/** Features never import each other, so the events and profiles sections are passed in here. */
export function HomeScreen(props: HomeScreenProps) {
	return (
		<HomeContainer
			{...props}
			nearbyEvents={<NearbyEventsContainer />}
			similarProfiles={<SimilarProfilesContainer />}
		/>
	);
}
