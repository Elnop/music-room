import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type {
	Playlist,
	PlaylistStackParamList,
} from '@/features/playlists/shared/playlist/lib/types';
import { useHomeScreen } from '@/features/playlists/features/browse/features/home/useHomeScreen';
import { HomeView } from '@/features/playlists/features/browse/features/home/components/presenters/HomeView';

type HomeOrchestratorProps = NativeStackScreenProps<PlaylistStackParamList, 'Home'> & {
	/** Sections of other features: the navigation layer passes them in. */
	nearbyEvents?: React.ReactNode;
	similarProfiles?: React.ReactNode;
	actionsFor: (playlist: Playlist) => (() => void) | undefined;
};

export function HomeContainer({
	navigation,
	nearbyEvents,
	similarProfiles,
	actionsFor,
}: HomeOrchestratorProps) {
	const screen = useHomeScreen(navigation);
	return (
		<>
			<HomeView
				screen={screen}
				nearbyEvents={nearbyEvents}
				similarProfiles={similarProfiles}
				actionsFor={actionsFor}
			/>
		</>
	);
}
