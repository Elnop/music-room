import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PlaylistStackParamList } from '@/features/playlists/types';
import { HomeOrchestrator } from '@/features/playlists/home/components/orchestrators/HomeOrchestrator';
import { NearbyEventsOrchestrator } from '@/features/events/nearby/components/orchestrators/NearbyEventsOrchestrator';
import { SimilarProfilesOrchestrator } from '@/features/friends/similarProfiles/components/orchestrators/SimilarProfilesOrchestrator';

type HomeScreenProps = NativeStackScreenProps<PlaylistStackParamList, 'Home'>;

/** Features never import each other: the home screen of playlists receives the events and profiles sections here. */
export function HomeScreen(props: HomeScreenProps) {
	return (
		<HomeOrchestrator
			{...props}
			nearbyEvents={<NearbyEventsOrchestrator />}
			similarProfiles={<SimilarProfilesOrchestrator />}
		/>
	);
}
