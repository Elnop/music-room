import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PlaylistStackParamList } from '@/features/playlists/types';
import { useHomeScreen } from '@/features/playlists/home/useHomeScreen';
import { HomeView } from '@/features/playlists/home/components/presenters/HomeView';
import { usePlaylistCardMenu } from '@/features/playlists/cardMenu/usePlaylistCardMenu';
import { PlaylistCardMenuContainer } from '@/features/playlists/cardMenu/PlaylistCardMenuContainer';

type HomeOrchestratorProps = NativeStackScreenProps<PlaylistStackParamList, 'Home'> & {
	/** Sections of other features: the navigation layer passes them in. */
	nearbyEvents?: React.ReactNode;
	similarProfiles?: React.ReactNode;
};

export function HomeContainer({
	navigation,
	nearbyEvents,
	similarProfiles,
}: HomeOrchestratorProps) {
	const screen = useHomeScreen(navigation);
	const menu = usePlaylistCardMenu(navigation);
	return (
		<>
			<HomeView
				screen={screen}
				nearbyEvents={nearbyEvents}
				similarProfiles={similarProfiles}
				actionsFor={menu.actionsFor}
			/>
			<PlaylistCardMenuContainer menu={menu} />
		</>
	);
}
